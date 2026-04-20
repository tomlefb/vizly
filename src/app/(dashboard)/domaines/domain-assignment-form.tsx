'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Copy, Loader2, RefreshCcw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VzBadge, VzBtn } from '@/components/ui/vizly'
import { ConfirmActionDialog } from '@/components/billing/ConfirmActionDialog'
import {
  addCustomDomain,
  verifyCustomDomain,
  removeCustomDomain,
} from '@/actions/domain'

type DomainStatus = 'pending' | 'verified' | 'failed' | null

interface DomainAssignmentFormProps {
  portfolioId: string
  currentDomain: string
  currentStatus: DomainStatus
  currentDnsTarget: string | null
}

// Fréquence du polling quand un domaine est en pending — on check Railway
// toutes les 30s pour basculer automatiquement en "Actif" dès que le DNS +
// cert sont OK, sans forcer l'user à cliquer Vérifier manuellement. On
// arrête dès que status passe à 'verified' ou que le composant unmount.
const POLL_INTERVAL_MS = 30_000

export function DomainAssignmentForm({
  portfolioId,
  currentDomain,
  currentStatus,
  currentDnsTarget,
}: DomainAssignmentFormProps) {
  const router = useRouter()
  const [draft, setDraft] = useState('')
  const [message, setMessage] = useState<
    | { kind: 'error' | 'success' | 'info'; text: string }
    | null
  >(null)
  const [dnsTargetOverride, setDnsTargetOverride] = useState<string | null>(null)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [removeDialogError, setRemoveDialogError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const rawDnsTarget = dnsTargetOverride ?? currentDnsTarget
  // rawDnsTarget stocké en DB sous forme "TYPE:VALUE". Support legacy où
  // seulement la valeur serait là (ancien format).
  const dnsParts = rawDnsTarget?.includes(':')
    ? {
        type: rawDnsTarget.split(':')[0] ?? 'CNAME',
        value: rawDnsTarget.split(':').slice(1).join(':'),
      }
    : rawDnsTarget
      ? { type: 'CNAME', value: rawDnsTarget }
      : null

  const hasDomain = currentDomain !== ''

  // Polling silencieux en arrière-plan quand un domaine est pending. Ne
  // fait rien si l'user n'a pas encore configuré son DNS — seulement
  // rafraîchit l'état quand Railway confirme. router.refresh() propage la
  // DB maj vers les server components, le badge passe automatiquement en
  // "Actif" sans input utilisateur.
  useEffect(() => {
    if (currentStatus !== 'pending') return
    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      const result = await verifyCustomDomain(portfolioId)
      if (cancelled) return
      if (result.ok) {
        router.refresh()
      }
    }
    const interval = setInterval(() => void tick(), POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [currentStatus, portfolioId, router])

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const result = await addCustomDomain(portfolioId, draft.trim())
      if (!result.ok) {
        setMessage({ kind: 'error', text: result.error ?? 'Erreur inconnue.' })
        return
      }
      if (result.dnsTarget) setDnsTargetOverride(result.dnsTarget)
      setMessage({
        kind: 'info',
        text: 'Domaine enregistré. Configure ton DNS — on vérifie automatiquement dès que c\'est propagé.',
      })
      setDraft('')
      router.refresh()
    })
  }

  function handleVerify() {
    setMessage(null)
    startTransition(async () => {
      const result = await verifyCustomDomain(portfolioId)
      if (!result.ok) {
        setMessage({ kind: 'error', text: result.error ?? 'Vérification échouée.' })
        return
      }
      setMessage({ kind: 'success', text: 'Domaine vérifié, il est maintenant actif.' })
      router.refresh()
    })
  }

  function handleOpenRemove() {
    setMessage(null)
    setRemoveDialogError(null)
    setRemoveDialogOpen(true)
  }

  async function handleConfirmRemove() {
    setRemoveDialogError(null)
    const result = await removeCustomDomain(portfolioId)
    if (!result.ok) {
      setRemoveDialogError(result.error ?? 'Suppression échouée.')
      return
    }
    setRemoveDialogOpen(false)
    setMessage({ kind: 'success', text: 'Domaine retiré.' })
    setDnsTargetOverride(null)
    router.refresh()
  }

  // Etat vide : formulaire d'ajout
  if (!hasDomain) {
    return (
      <div className="space-y-2">
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setMessage(null)
            }}
            placeholder="portfolio.tonsite.com"
            className="h-10 min-w-0 flex-1 rounded-[var(--radius-md)] border border-border-light bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent-deep focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <VzBtn
            type="submit"
            variant="primary"
            size="md"
            disabled={isPending || draft.trim() === ''}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Enregistrement…
              </>
            ) : (
              'Ajouter'
            )}
          </VzBtn>
        </form>
        <p className="text-xs text-muted-foreground">
          Astuce : un sous-domaine type <span className="font-mono">portfolio.tonsite.com</span> a
          une config DNS plus simple qu&apos;un domaine racine (<span className="font-mono">tonsite.com</span>).
        </p>
        <MessageLine message={message} />
      </div>
    )
  }

  // Etat occupé : domaine + status + actions + instructions
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <CopyablePill value={currentDomain} />
        <StatusBadge status={currentStatus} />
        <div className="ml-auto flex gap-2">
          {currentStatus !== 'verified' && (
            <VzBtn
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleVerify}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : (
                <RefreshCcw className="h-4 w-4" strokeWidth={2} />
              )}
              Vérifier
            </VzBtn>
          )}
          <VzBtn
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleOpenRemove}
            disabled={isPending}
            aria-label="Retirer le domaine"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
            Retirer
          </VzBtn>
        </div>
      </div>

      {currentStatus !== 'verified' && (
        <div className="space-y-3 rounded-[var(--radius-md)] border border-border-light bg-surface-warm px-4 py-3 text-xs text-foreground">
          <div>
            <p className="font-medium">Étape 1 · Configure ton DNS chez ton registrar</p>
            {dnsParts ? (
              <div className="mt-2 space-y-2">
                <DnsRow label="Type" value={dnsParts.type} />
                <DnsRow
                  label="Nom / Hôte"
                  value={extractHostLabel(currentDomain)}
                />
                <DnsRow label="Valeur / Cible" value={dnsParts.value} />
              </div>
            ) : (
              <p className="mt-2 text-muted">
                La cible DNS exacte s&apos;affichera après un premier clic « Vérifier ».
              </p>
            )}
          </div>

          <RegistrarGuide />

          <p className="text-muted-foreground">
            La propagation DNS prend en général entre 1 minute et 1 heure (parfois
            plus). On vérifie automatiquement toutes les 30 secondes — tu peux
            fermer cette page et revenir plus tard, tu verras le badge passer en
            « Actif » quand c&apos;est bon.
          </p>
        </div>
      )}

      <MessageLine message={message} />

      <ConfirmActionDialog
        open={removeDialogOpen}
        onClose={() => setRemoveDialogOpen(false)}
        onConfirm={handleConfirmRemove}
        title="Retirer ce domaine ?"
        description={`${currentDomain} sera supprimé côté Railway et le portfolio redeviendra accessible uniquement sur son sous-domaine vizly.fr. Tu pourras le rajouter à tout moment.`}
        confirmLabel="Retirer le domaine"
        cancelLabel="Annuler"
        confirmVariant="destructive"
        error={removeDialogError}
      />
    </div>
  )
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

function CopyablePill({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      return
    }
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 1800)
  }, [value])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-surface px-2.5 py-1 font-mono text-sm text-foreground transition-colors hover:bg-surface-warm"
      aria-label={copied ? 'Copié' : `Copier ${value}`}
    >
      <span>{value}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[var(--color-success-fg)]" strokeWidth={2.5} />
      ) : (
        <Copy
          className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground"
          strokeWidth={2}
        />
      )}
    </button>
  )
}

function DnsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="min-w-[92px] text-muted">{label}</span>
      <CopyablePill value={value} />
    </div>
  )
}

function extractHostLabel(domain: string): string {
  // Pour un apex (monsite.com), beaucoup de registrars veulent "@".
  // Pour un subdomain (portfolio.monsite.com), ils veulent juste "portfolio".
  // Detection basique : 2 parties = apex, 3+ = subdomain.
  const parts = domain.split('.')
  if (parts.length <= 2) return '@'
  return parts.slice(0, parts.length - 2).join('.')
}

function RegistrarGuide() {
  const [open, setOpen] = useState(false)
  const [registrar, setRegistrar] = useState<keyof typeof REGISTRAR_GUIDES>('ovh')

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground transition-colors hover:text-accent-deep"
        aria-expanded={open}
      >
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
          strokeWidth={2}
        />
        Comment faire chez mon registrar ?
      </button>
      {open && (
        <div className="mt-3 space-y-3 rounded-[var(--radius-sm)] border border-border-light bg-surface px-3 py-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-warm p-0.5">
            {(Object.keys(REGISTRAR_GUIDES) as Array<keyof typeof REGISTRAR_GUIDES>).map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRegistrar(key)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                    registrar === key
                      ? 'bg-surface text-foreground border border-border'
                      : 'text-muted hover:text-foreground',
                  )}
                >
                  {REGISTRAR_GUIDES[key].label}
                </button>
              ),
            )}
          </div>
          <ol className="list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-muted">
            {REGISTRAR_GUIDES[registrar].steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

const REGISTRAR_GUIDES = {
  ovh: {
    label: 'OVH',
    steps: [
      'Va dans Espace Client → Web Cloud → Noms de domaine, puis clique sur ton domaine.',
      'Ouvre l\'onglet "Zone DNS" en haut de page.',
      'Clique sur "Ajouter une entrée" en haut à droite de la liste des enregistrements.',
      'Sélectionne le type affiché plus haut (CNAME ou A), puis clique Suivant.',
      'Dans "Sous-domaine", colle la valeur "Nom / Hôte" (ou laisse vide si c\'est "@").',
      'Dans "Cible", colle la valeur "Valeur / Cible" indiquée plus haut.',
      'Clique Suivant puis Confirmer. OVH met à jour la zone en quelques minutes.',
    ],
  },
  gandi: {
    label: 'Gandi',
    steps: [
      'Depuis ton dashboard Gandi, clique sur ton domaine dans la liste.',
      'Ouvre l\'onglet "DNS Records" à gauche.',
      'Clique sur le bouton "Add" (en haut à droite).',
      'Choisis le type indiqué plus haut (CNAME ou A).',
      'Dans "Name", colle la valeur "Nom / Hôte" (ou laisse "@").',
      'Dans "Hostname" ou "Value", colle la valeur "Valeur / Cible".',
      'Laisse le TTL par défaut, clique "Create".',
    ],
  },
  cloudflare: {
    label: 'Cloudflare',
    steps: [
      'Depuis le dashboard Cloudflare, clique sur ton domaine.',
      'Va dans DNS → Records.',
      'Clique "Add record".',
      'Choisis le type (CNAME ou A), puis colle "Nom / Hôte" dans Name et "Valeur / Cible" dans Target.',
      'IMPORTANT : passe "Proxy status" sur "DNS only" (nuage gris, pas orange) — sinon Railway ne pourra pas valider le certificat.',
      'Clique "Save".',
    ],
  },
  namecheap: {
    label: 'Namecheap',
    steps: [
      'Depuis le Dashboard → Domain List, clique "Manage" à côté de ton domaine.',
      'Ouvre l\'onglet "Advanced DNS".',
      'Clique "Add New Record".',
      'Choisis le type : "CNAME Record" ou "A Record".',
      'Dans "Host", colle "Nom / Hôte" (ou "@" pour un apex).',
      'Dans "Value", colle "Valeur / Cible".',
      'Clique sur l\'icône check verte pour sauvegarder.',
    ],
  },
  other: {
    label: 'Autre',
    steps: [
      'Ouvre l\'interface DNS de ton registrar (souvent dans "DNS", "Zone DNS" ou "Nameservers").',
      'Ajoute un nouvel enregistrement du type indiqué ci-dessus (CNAME ou A).',
      'Le champ "Nom/Hôte/Host/Name" reçoit la valeur "Nom / Hôte" que tu vois plus haut.',
      'Le champ "Valeur/Target/Points to" reçoit la valeur "Valeur / Cible".',
      'Garde le TTL par défaut (souvent 3600 ou automatique).',
      'Sauvegarde et reviens vérifier ici dans 1 à 60 minutes.',
    ],
  },
} satisfies Record<string, { label: string; steps: string[] }>

function StatusBadge({ status }: { status: DomainStatus }) {
  if (status === 'verified') {
    return <VzBadge variant="online">Actif</VzBadge>
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
        Échec
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent-deep">
      <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} />
      En attente du DNS
    </span>
  )
}

function MessageLine({
  message,
}: {
  message: { kind: 'error' | 'success' | 'info'; text: string } | null
}) {
  if (!message) return null
  const role = message.kind === 'error' ? 'alert' : 'status'
  const colorClass =
    message.kind === 'error'
      ? 'text-destructive'
      : message.kind === 'success'
        ? 'text-[var(--color-success-fg)]'
        : 'text-muted'
  return (
    <p className={`text-xs ${colorClass}`} role={role}>
      {message.text}
    </p>
  )
}
