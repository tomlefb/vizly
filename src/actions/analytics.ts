'use server'

import { createClient } from '@/lib/supabase/server'

interface ViewsByDay {
  date: string
  count: number
}

interface ViewsByPortfolio {
  portfolioId: string
  title: string
  slug: string | null
  views: number
}

interface PortfolioStats {
  totalViews: number
  viewsLast30Days: number
  viewsByDay: ViewsByDay[]
  viewsByPortfolio: ViewsByPortfolio[]
}

interface PortfolioStatsResult {
  data: PortfolioStats | null
  error: string | null
}

export async function getPortfolioStats(): Promise<PortfolioStatsResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Non authentifié' }
    }

    // Check user plan — analytics is a Pro feature
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return { data: null, error: 'Impossible de récupérer le profil utilisateur' }
    }

    if (userData.plan !== 'pro') {
      return { data: null, error: 'Les analytics sont réservées au plan Pro' }
    }

    // Get all user's portfolios
    const { data: portfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id, title, slug')
      .eq('user_id', user.id)

    if (portfolioError) {
      return { data: null, error: 'Impossible de récupérer les portfolios' }
    }

    if (!portfolios || portfolios.length === 0) {
      return {
        data: {
          totalViews: 0,
          viewsLast30Days: 0,
          viewsByDay: [],
          viewsByPortfolio: [],
        },
        error: null,
      }
    }

    const portfolioIds = portfolios.map((p) => p.id)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

    // Fetch total views and last-30-day views in parallel
    const [totalResult, last30Result, dailyResult] = await Promise.all([
      // Total views across all portfolios
      supabase
        .from('page_views')
        .select('id', { count: 'exact', head: true })
        .in('portfolio_id', portfolioIds),

      // Views in the last 30 days
      supabase
        .from('page_views')
        .select('id', { count: 'exact', head: true })
        .in('portfolio_id', portfolioIds)
        .gte('viewed_at', thirtyDaysAgoISO),

      // All views in the last 30 days (for daily breakdown)
      supabase
        .from('page_views')
        .select('portfolio_id, viewed_at')
        .in('portfolio_id', portfolioIds)
        .gte('viewed_at', thirtyDaysAgoISO)
        .order('viewed_at', { ascending: true }),
    ])

    const totalViews = totalResult.count ?? 0
    const viewsLast30Days = last30Result.count ?? 0
    const dailyViews = dailyResult.data ?? []

    // Build viewsByDay: aggregate by date
    const dayMap = new Map<string, number>()
    for (const view of dailyViews) {
      const date = view.viewed_at.split('T')[0]
      if (date) {
        dayMap.set(date, (dayMap.get(date) ?? 0) + 1)
      }
    }

    const viewsByDay: ViewsByDay[] = Array.from(dayMap.entries()).map(
      ([date, count]) => ({ date, count })
    )

    // Build viewsByPortfolio: count views per portfolio
    const portfolioViewMap = new Map<string, number>()
    for (const view of dailyViews) {
      portfolioViewMap.set(
        view.portfolio_id,
        (portfolioViewMap.get(view.portfolio_id) ?? 0) + 1
      )
    }

    const viewsByPortfolio: ViewsByPortfolio[] = portfolios.map((p) => ({
      portfolioId: p.id,
      title: p.title,
      slug: p.slug,
      views: portfolioViewMap.get(p.id) ?? 0,
    }))

    return {
      data: {
        totalViews,
        viewsLast30Days,
        viewsByDay,
        viewsByPortfolio,
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Erreur lors de la récupération des statistiques' }
  }
}
