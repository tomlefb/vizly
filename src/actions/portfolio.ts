'use server'

import { createClient } from '@/lib/supabase/server'
import { portfolioSchema, slugSchema } from '@/lib/validations'
import { PLANS, type PlanType } from '@/lib/constants'
import { sendEmail } from '@/lib/emails/send'
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
  formData: PortfolioFormData
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

    // Check if user already has a portfolio
    const { data: existing } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (existing) {
      // UPDATE existing portfolio
      const { data, error } = await supabase
        .from('portfolios')
        .update({
          title: validData.title,
          bio: validData.bio ?? null,
          photo_url: validData.photo_url || null,
          template: validData.template,
          primary_color: validData.primary_color,
          secondary_color: validData.secondary_color,
          font: validData.font,
          font_body: validData.font_body,
          social_links: validData.social_links ?? null,
          contact_email: validData.contact_email || null,
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
        template: validData.template,
        primary_color: validData.primary_color,
        secondary_color: validData.secondary_color,
        font: validData.font,
        font_body: validData.font_body,
        social_links: validData.social_links ?? null,
        contact_email: validData.contact_email || null,
        skills: validData.skills ?? [],
        sections: validData.sections ?? null,
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

    // Check user has a portfolio
    // - title + published_at are needed for the portfolio-published email
    //   (first-publication detection via published_at IS NULL)
    const { data: portfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('id, slug, published, title, published_at')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      return { data: null, error: fetchError.message }
    }

    if (!portfolio) {
      return { data: null, error: 'Aucun portfolio trouvé' }
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

export async function unpublishPortfolio(): Promise<{
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Non authentifié' }
    }

    const { error } = await supabase
      .from('portfolios')
      .update({ published: false })
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

export async function updateCustomDomain(
  portfolioId: string,
  domain: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Non authentifié' }
    }

    // Check user is Pro
    const { data: profile } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (profile?.plan !== 'pro') {
      return { error: 'Le domaine personnalisé est réservé au plan Pro' }
    }

    // Verify portfolio belongs to the authenticated user
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!portfolio) {
      return { error: 'Portfolio introuvable' }
    }

    const trimmed = domain.trim().toLowerCase()

    // Allow empty to remove custom domain
    if (trimmed && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(trimmed)) {
      return { error: 'Nom de domaine invalide (ex: monsite.com)' }
    }

    const { error } = await supabase
      .from('portfolios')
      .update({ custom_domain: trimmed || null })
      .eq('id', portfolio.id)

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch {
    return { error: 'Erreur lors de la mise à jour du domaine' }
  }
}

export interface PortfolioWithDomain {
  id: string
  title: string
  slug: string | null
  custom_domain: string | null
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
      .select('id, title, slug, custom_domain, published')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: data ?? [], error: null }
  } catch {
    return { data: [], error: 'Erreur lors de la récupération des portfolios' }
  }
}
