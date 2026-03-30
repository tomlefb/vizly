'use server'

import { createClient } from '@/lib/supabase/server'
import { portfolioSchema, slugSchema } from '@/lib/validations'
import type { PortfolioFormData } from '@/lib/validations'
import type { Portfolio } from '@/types'

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
          social_links: validData.social_links ?? null,
          contact_email: validData.contact_email || null,
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
        social_links: validData.social_links ?? null,
        contact_email: validData.contact_email || null,
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

    // Check user has a portfolio
    const { data: portfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('id, slug')
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

    // Publish: set slug + published = true
    const { data: updated, error: updateError } = await supabase
      .from('portfolios')
      .update({ slug: validSlug, published: true })
      .eq('id', portfolio.id)
      .select()
      .single()

    if (updateError) {
      return { data: null, error: updateError.message }
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

export async function updateCustomDomain(
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

    const trimmed = domain.trim().toLowerCase()

    // Allow empty to remove custom domain
    if (trimmed && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(trimmed)) {
      return { error: 'Nom de domaine invalide (ex: monsite.com)' }
    }

    const { error } = await supabase
      .from('portfolios')
      .update({ custom_domain: trimmed || null })
      .eq('user_id', user.id)

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch {
    return { error: 'Erreur lors de la mise à jour du domaine' }
  }
}
