'use server'

import { createClient } from '@/lib/supabase/server'
import { portfolioSchema, slugSchema } from '@/lib/validations'
import { PLANS, type PlanType } from '@/lib/constants'
import { sendEmail } from '@/lib/emails/send'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import type { PortfolioFormData } from '@/lib/validations'
import type { Portfolio } from '@/types'

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vizly.fr'

interface PortfolioResult {
  data: Portfolio | null
  error: string | null
}

export async function getPortfolio(): Promise<PortfolioResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Non authentifié' }
    }

    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch {
    return { data: null, error: 'Erreur lors de la récupération du portfolio' }
  }
}

export async function upsertPortfolio(
  formData: PortfolioFormData,
  portfolioId?: string
): Promise<PortfolioResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Non authentifié' }
    }

    const parsed = portfolioSchema.safeParse(formData)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      return {
        data: null,
        error: firstIssue ? firstIssue.message : 'Données invalides',
      }
    }

    const validData = parsed.data

    // Si un portfolioId est fourni, on cible ce portfolio précis (update).
    // Sans id, on crée un nouveau portfolio — permet à un user d'avoir
    // plusieurs portfolios simultanés (listés au dashboard).
    let existing: { id: string; template: string } | null = null
    if (portfolioId) {
      const { data } = await supabase
        .from('portfolios')
        .select('id, template')
        .eq('id', portfolioId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!data) {
        return { data: null, error: 'Portfolio introuvable' }
      }
      existing = data
    }

    // Garde-fou premium : un user ne peut persister un template premium
    // que s'il l'a acheté. Sans ça, l'auto-save de l'editor écrirait en
    // DB n'importe quel template premium prévisualisé. Si l'utilisateur
    // envoie un template premium non acheté, on retombe silencieusement
    // sur le template précédent (update) ou sur 'classique' (insert).
    const templateConfig = TEMPLATE_CONFIGS.find((t) => t.name === validData.template)
    let safeTemplate = validData.template
    if (templateConfig?.isPremium) {
      const { data: owned } = await supabase
        .from('purchased_templates')
        .select('template_id')
        .eq('user_id', user.id)
        .eq('template_id', validData.template)
        .maybeSingle()
      if (!owned) {
        safeTemplate = existing?.template ?? 'classique'
      }
    }

    if (existing) {
      // UPDATE existing portfolio
      const { data, error } = await supabase
        .from('portfolios')
        .update({
          title: validData.title,
          bio: validData.bio ?? null,
          photo_url: validData.photo_url || null,
          template: safeTemplate,
          primary_color: validData.primary_color,
          secondary_color: validData.secondary_color,
          background_color: validData.background_color,
          font: validData.font,
          font_body: validData.font_body,
          social_links: validData.social_links ?? null,
          contact_email: validData.contact_email || null,
          contact_form_enabled: validData.contact_form_enabled,
          contact_form_title: validData.contact_form_title,
          contact_form_description: validData.contact_form_description,
          skills: validData.skills ?? [],
          sections: validData.sections ?? null,
          custom_blocks: validData.custom_blocks ?? [],
          kpis: validData.kpis ?? [],
          layout_blocks: validData.layout_blocks ?? [],
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    }

    // INSERT new portfolio
    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        title: validData.title,
        bio: validData.bio ?? null,
        photo_url: validData.photo_url || null,
        template: safeTemplate,
        primary_color: validData.primary_color,
        secondary_color: validData.secondary_color,
        background_color: validData.background_color,
        font: validData.font,
        font_body: validData.font_body,
        social_links: validData.social_links ?? null,
        contact_email: validData.contact_email || null,
        contact_form_enabled: validData.contact_form_enabled,
        contact_form_title: validData.contact_form_title,
        contact_form_description: validData.contact_form_description,
        skills: validData.skills ?? [],
        sections: validData.sections ?? null,
        custom_blocks: validData.custom_blocks ?? [],
        kpis: validData.kpis ?? [],
        layout_blocks: validData.layout_blocks ?? [],
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch {
    return {
      data: null,
      error: 'Erreur lors de la sauvegarde du portfolio',
    }
  }
}

export async function publishPortfolio(
  portfolioId: string,
  slug: string
): Promise<PortfolioResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Non authentifié' }
    }

    // Validate the slug with Zod
    const parsed = slugSchema.safeParse(slug)
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      return {
        data: null,
        error: firstIssue ? firstIssue.message : 'Pseudo invalide',
      }
    }

    const validSlug = parsed.data

    // Check plan publish limit + fetch user name for the email payload
    const { data: profile } = await supabase
      .from('users')
      .select('plan, name')
      .eq('id', user.id)
      .single()

    const plan = (profile?.plan ?? 'free') as PlanType
    const limit = PLANS[plan].publishLimit

    if (limit === 0) {
      return { data: null, error: 'Passe au plan Starter pour mettre ton portfolio en ligne' }
    }

    // Count currently published portfolios (excluding the one being published)
    const { count: publishedCount } = await supabase
      .from('portfolios')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('published', true)

    // Fetch the specific portfolio to publish + verify ownership.
    // title + published_at are needed for the portfolio-published email
    // (first-publication detection via published_at IS NULL).
    const { data: portfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('id, slug, published, title, published_at')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError) {
      return { data: null, error: fetchError.message }
    }

    if (!portfolio) {
      return { data: null, error: 'Portfolio introuvable' }
    }

    // Check slug uniqueness — allow if the user already owns this slug
    const { data: existing } = await supabase
      .from('portfolios')
      .select('id')
      .eq('slug', validSlug)
      .neq('id', portfolio.id)
      .limit(1)
      .maybeSingle()

    if (existing) {
      return { data: null, error: 'Ce pseudo est déjà pris' }
    }

    // Enforce publish limit (don't count this portfolio if already published)
    const alreadyPublished = portfolio.published ? 1 : 0
    const otherPublished = (publishedCount ?? 0) - alreadyPublished
    if (otherPublished >= limit) {
      return {
        data: null,
        error: plan === 'starter'
          ? 'Tu as déjà 1 projet en ligne. Passe au Pro pour en publier plus.'
          : 'Limite de publication atteinte pour ton plan.',
      }
    }

    // Detect first publication BEFORE the update. Migration 008 added
    // published_at to portfolios and backfilled it to created_at for
    // already-published portfolios, so any portfolio with published_at
    // IS NULL has never been published before. After unpublish+republish,
    // published_at stays set → no re-fire of the welcome-to-online email.
    const isFirstPublication = portfolio.published_at === null

    // Publish: set slug + published = true (+ published_at on first publi)
    const updatePayload: {
      slug: string
      published: boolean
      published_at?: string
    } = {
      slug: validSlug,
      published: true,
    }
    if (isFirstPublication) {
      updatePayload.published_at = new Date().toISOString()
    }

    const { data: updated, error: updateError } = await supabase
      .from('portfolios')
      .update(updatePayload)
      .eq('id', portfolio.id)
      .select()
      .single()

    if (updateError) {
      return { data: null, error: updateError.message }
    }

    // Fire portfolio-published email on first publication only.
    // Failure is logged but doesn't fail the publication itself — the
    // user has successfully published, the email is a side effect.
    if (isFirstPublication && user.email) {
      const portfolioUrl = `https://${validSlug}.${APP_DOMAIN}`
      const emailResult = await sendEmail({
        template: 'portfolio-published',
        to: user.email,
        data: {
          name: profile?.name ?? '',
          portfolioTitle: portfolio.title ?? '',
          portfolioUrl,
          portfolioSlug: validSlug,
        },
      })

      if (!emailResult.ok) {
        console.error(
          `[Portfolio] portfolio-published email failed for ${user.email}:`,
          emailResult.error,
        )
      } else {
        console.log(
          `[Portfolio] portfolio-published sent to ${user.email} (slug=${validSlug})`,
        )
      }
    }

    return { data: updated, error: null }
  } catch {
    return {
      data: null,
      error: 'Erreur lors de la publication du portfolio',
    }
  }
}

export async function unpublishPortfolio(
  portfolioId: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Non authentifié' }
    }

    // Filtre sur id + user_id : garantit qu'on ne dépublie que le bon
    // portfolio et que l'user en est bien propriétaire (défense en
    // profondeur, RLS gère déjà l'isolation).
    const { error } = await supabase
      .from('portfolios')
      .update({ published: false })
      .eq('id', portfolioId)
      .eq('user_id', user.id)

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch {
    return { error: 'Erreur lors de la dépublication du portfolio' }
  }
}

export async function deletePortfolio(
  portfolioId: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Non authentifié' }
    }

    // Verify ownership
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!portfolio) {
      return { error: 'Portfolio introuvable' }
    }

    // Delete projects first (cascade may handle this but explicit is safer)
    await supabase
      .from('projects')
      .delete()
      .eq('portfolio_id', portfolioId)

    // Delete portfolio
    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', portfolioId)

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch {
    return { error: 'Erreur lors de la suppression du portfolio' }
  }
}

export interface PortfolioWithDomain {
  id: string
  title: string
  slug: string | null
  custom_domain: string | null
  custom_domain_status: 'pending' | 'verified' | 'failed' | null
  custom_domain_verified_at: string | null
  custom_domain_dns_target: string | null
  published: boolean
}

export async function getPortfoliosWithDomains(): Promise<{
  data: PortfolioWithDomain[]
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: [], error: 'Non authentifié' }
    }

    const { data, error } = await supabase
      .from('portfolios')
      .select(
        'id, title, slug, custom_domain, custom_domain_status, custom_domain_verified_at, custom_domain_dns_target, published',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: [], error: error.message }
    }

    // Narrow custom_domain_status en union stricte (la colonne est `text`
    // en DB, le check postgres garantit déjà la validité — on cast ici
    // pour que le reste de l'app consomme l'union typée.)
    const narrowed: PortfolioWithDomain[] = (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      custom_domain: row.custom_domain,
      custom_domain_status:
        row.custom_domain_status === 'pending'
          || row.custom_domain_status === 'verified'
          || row.custom_domain_status === 'failed'
          ? row.custom_domain_status
          : null,
      custom_domain_verified_at: row.custom_domain_verified_at,
      custom_domain_dns_target: row.custom_domain_dns_target,
      published: row.published,
    }))

    return { data: narrowed, error: null }
  } catch {
    return { data: [], error: 'Erreur lors de la récupération des portfolios' }
  }
}
