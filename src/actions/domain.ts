'use server'

// =============================================================================
// domain.ts — Gestion des custom domains pour les portfolios Pro
// =============================================================================
//
// Trois actions publiques consommées par la page /domaines :
//
//   - addCustomDomain    : validate + gate Pro + uniqueness, call Railway
//                          customDomainCreate, persist portfolio.custom_domain
//                          + status='pending' + railway_id
//
//   - verifyCustomDomain : re-query Railway pour lire le status DNS/TLS à jour,
//                          bascule la row en 'verified' si ok, sinon reste
//                          'pending' (ou 'failed' si Railway remonte erreur)
//
//   - removeCustomDomain : appelle Railway customDomainDelete + clear tous les
//                          champs custom_domain_* de la row
//
// Guardrails :
//   - Plan Pro obligatoire sur les 3 actions (defense en profondeur, même si
//     l'UI cache déjà les boutons aux non-Pro)
//   - Ownership vérifiée via user_id sur chaque query
//   - Regex stricte sur le format du domaine (anti-injection Railway)
//   - Un domaine physique = un seul portfolio (unique index DB + check côté
//     app pour un message d'erreur user-friendly avant le 23505)

import { promises as dns } from 'node:dns'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  addRailwayCustomDomain,
  getRailwayCustomDomainStatus,
  removeRailwayCustomDomain,
} from '@/lib/railway/domains'

// RFC 1035 simplifié : labels alphanumériques + tirets internes, TLD 2+ chars.
// Couvre monsite.com, portfolio.monsite.com, sub.domain.co.uk. Refuse les IDN
// (punycode converti côté browser, mais Railway n'accepte que l'ASCII).
const DOMAIN_REGEX =
  /^(?=.{1,253}$)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/

export interface DomainActionResult {
  ok: boolean
  error?: string
  // Renvoyé par addCustomDomain pour que l'UI affiche immédiatement les
  // instructions DNS sans re-query Railway.
  dnsTarget?: string
}

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

async function assertProOwnership(portfolioId: string): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (profile?.plan !== 'pro') {
    return { ok: false, error: 'Le domaine personnalisé est réservé au plan Pro.' }
  }

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('id')
    .eq('id', portfolioId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!portfolio) {
    return { ok: false, error: 'Portfolio introuvable.' }
  }

  return { ok: true, userId: user.id }
}

// ---------------------------------------------------------------------------
// addCustomDomain
// ---------------------------------------------------------------------------

export async function addCustomDomain(
  portfolioId: string,
  rawDomain: string,
): Promise<DomainActionResult> {
  const domain = rawDomain.trim().toLowerCase()

  if (!DOMAIN_REGEX.test(domain)) {
    return { ok: false, error: 'Nom de domaine invalide (ex : portfolio.monsite.com)' }
  }

  const assertion = await assertProOwnership(portfolioId)
  if (!assertion.ok) return assertion

  const supabase = await createClient()

  // Check uniqueness applicatif — évite de solliciter Railway pour rien et
  // renvoie un message explicite (plutôt qu'un 23505 sur l'UPDATE après
  // l'appel Railway qui aurait déjà créé le domaine côté infra).
  const { data: existing } = await supabase
    .from('portfolios')
    .select('id, user_id')
    .eq('custom_domain', domain)
    .maybeSingle()
  if (existing && existing.id !== portfolioId) {
    return { ok: false, error: 'Ce domaine est déjà utilisé par un autre portfolio.' }
  }

  let railwayDomain: Awaited<ReturnType<typeof addRailwayCustomDomain>>
  try {
    railwayDomain = await addRailwayCustomDomain(domain)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Railway inconnue.'
    return { ok: false, error: `Impossible d'enregistrer le domaine côté infra : ${message}` }
  }

  // Railway renvoie un CNAME pour les subdomains (portfolio.monsite.com) et
  // un A record pour les apex (monsite.com). On prend le premier record
  // quel que soit le type — la UI affichera le bon type via la colonne
  // `recordType` stockée plus bas dans custom_domain_dns_target (format
  // "CNAME:xxx" ou "A:1.2.3.4"). Fallback null si Railway n'a pas encore
  // calculé les records.
  const firstRecord = railwayDomain.status.dnsRecords[0]
  const dnsTarget = firstRecord?.requiredValue
    ? `${normalizeRecordType(firstRecord.recordType)}:${firstRecord.requiredValue}`
    : null

  const { error: updateError } = await supabase
    .from('portfolios')
    .update({
      custom_domain: domain,
      custom_domain_status: 'pending',
      custom_domain_railway_id: railwayDomain.id,
      custom_domain_dns_target: dnsTarget,
      custom_domain_verified_at: null,
    })
    .eq('id', portfolioId)

  if (updateError) {
    // Rollback best-effort : si la DB a échoué après l'enregistrement
    // Railway, on nettoie côté Railway pour éviter un domaine orphelin.
    // Ce chemin couvre aussi la race « deux users qui réclament le même
    // domaine simultanément » : un des deux UPDATE remonte un 23505 sur
    // l'index unique custom_domain, on rollback Railway et on renvoie un
    // message clair.
    await removeRailwayCustomDomain(railwayDomain.id)
    const is23505 =
      (updateError as { code?: string }).code === '23505' ||
      /duplicate key/i.test(updateError.message)
    return {
      ok: false,
      error: is23505
        ? 'Ce domaine vient d\'être réclamé par un autre portfolio. Merci d\'en choisir un autre.'
        : updateError.message,
    }
  }

  revalidatePath('/domaines')

  return { ok: true, dnsTarget: dnsTarget ?? undefined }
}

// ---------------------------------------------------------------------------
// verifyCustomDomain
// ---------------------------------------------------------------------------

export async function verifyCustomDomain(
  portfolioId: string,
): Promise<DomainActionResult> {
  const assertion = await assertProOwnership(portfolioId)
  if (!assertion.ok) return assertion

  const supabase = await createClient()
  const { data: row } = await supabase
    .from('portfolios')
    .select('custom_domain, custom_domain_railway_id, custom_domain_dns_target')
    .eq('id', portfolioId)
    .single()

  if (!row?.custom_domain || !row.custom_domain_railway_id) {
    return { ok: false, error: 'Aucun domaine à vérifier sur ce portfolio.' }
  }

  const status = await getRailwayCustomDomainStatus(row.custom_domain_railway_id)
  if (!status) {
    // Railway ne connaît plus ce domaine : on clean la row locale pour
    // permettre à l'user d'en re-créer un.
    await supabase
      .from('portfolios')
      .update({
        custom_domain: null,
        custom_domain_status: null,
        custom_domain_railway_id: null,
        custom_domain_dns_target: null,
        custom_domain_verified_at: null,
      })
      .eq('id', portfolioId)
    return { ok: false, error: 'Le domaine n\'existe plus côté infra. Merci de le re-saisir.' }
  }

  // Sanity check DNS côté serveur Vizly : on vérifie que le CNAME pointe
  // bien vers le host Railway attendu. Railway fait le même check, mais
  // doubler la vérif nous permet d'afficher un message précis si l'user
  // n'a juste pas encore configuré son DNS.
  const firstRecord = status.status.dnsRecords[0]
  const expectedType = firstRecord ? normalizeRecordType(firstRecord.recordType) : 'CNAME'
  const expectedValue = firstRecord?.requiredValue ?? null

  const dnsOk = await probeDns(row.custom_domain, expectedType, expectedValue)

  const nowVerified = status.status.verified && dnsOk

  await supabase
    .from('portfolios')
    .update({
      custom_domain_status: nowVerified ? 'verified' : 'pending',
      custom_domain_verified_at: nowVerified ? new Date().toISOString() : null,
    })
    .eq('id', portfolioId)

  revalidatePath('/domaines')

  if (nowVerified) {
    return { ok: true }
  }
  return {
    ok: false,
    error: dnsOk
      ? 'Railway n\'a pas encore fini de provisionner le certificat TLS. Réessaie dans 1 à 2 minutes.'
      : `Le DNS n\'est pas encore propagé. Crée un ${expectedType} pour "${row.custom_domain}" vers "${expectedValue ?? '—'}" puis réessaie.`,
  }
}

function normalizeRecordType(raw: string | null | undefined): 'CNAME' | 'A' | 'AAAA' {
  const upper = (raw ?? '').toUpperCase()
  if (upper.includes('CNAME')) return 'CNAME'
  if (upper.includes('AAAA')) return 'AAAA'
  return 'A'
}

async function probeDns(
  domain: string,
  recordType: 'CNAME' | 'A' | 'AAAA',
  expectedTarget: string | null,
): Promise<boolean> {
  try {
    if (recordType === 'CNAME') {
      const records = await dns.resolveCname(domain)
      if (!expectedTarget) return records.length > 0
      return records.some((r) => r.toLowerCase() === expectedTarget.toLowerCase())
    }
    if (recordType === 'AAAA') {
      const records = await dns.resolve6(domain)
      if (!expectedTarget) return records.length > 0
      return records.includes(expectedTarget)
    }
    // A
    const records = await dns.resolve4(domain)
    if (!expectedTarget) return records.length > 0
    return records.includes(expectedTarget)
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// removeCustomDomain
// ---------------------------------------------------------------------------

export async function removeCustomDomain(
  portfolioId: string,
): Promise<DomainActionResult> {
  const assertion = await assertProOwnership(portfolioId)
  if (!assertion.ok) return assertion

  const supabase = await createClient()
  const { data: row } = await supabase
    .from('portfolios')
    .select('custom_domain_railway_id')
    .eq('id', portfolioId)
    .single()

  if (row?.custom_domain_railway_id) {
    await removeRailwayCustomDomain(row.custom_domain_railway_id)
  }

  const { error } = await supabase
    .from('portfolios')
    .update({
      custom_domain: null,
      custom_domain_status: null,
      custom_domain_railway_id: null,
      custom_domain_dns_target: null,
      custom_domain_verified_at: null,
    })
    .eq('id', portfolioId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/domaines')
  return { ok: true }
}
