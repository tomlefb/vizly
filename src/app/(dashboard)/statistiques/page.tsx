import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BarChart3 } from 'lucide-react'
import { DEFAULT_PORTFOLIO_COLOR, type PlanType } from '@/lib/constants'
import { parseSections, parseSkills } from '@/types/sections'
import { parseCustomBlocks } from '@/types/custom-blocks'
import { parseKpis } from '@/types/kpis'
import { parseLayoutBlocks } from '@/types/layout-blocks'
import type { TemplateProps } from '@/types'
import { VzHighlight, vzBtnClasses } from '@/components/ui/vizly'
import { StatsClient, type PortfolioStats } from './stats-client'

export default async function StatistiquesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'free') as PlanType

  if (plan !== 'pro') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border border-border-light bg-surface-sunken">
          <BarChart3
            className="h-5 w-5 text-muted-foreground"
            strokeWidth={1.5}
          />
        </div>
        <h3 className="mt-5 font-[family-name:var(--font-satoshi)] text-lg font-semibold text-foreground">
          Statistiques
        </h3>
        <p className="mt-2 text-sm text-muted">
          Suis le nombre de vues sur tes portfolios et découvre d&apos;où
          viennent tes visiteurs. Disponible avec le plan Pro.
        </p>
        <Link
          href="/billing"
          className={vzBtnClasses({ variant: 'primary', size: 'md', className: 'mt-7' })}
        >
          Passer au Pro
        </Link>
      </div>
    )
  }

  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allPortfolios = portfolios ?? []
  const portfolioIds = allPortfolios.map((p) => p.id)

  if (portfolioIds.length === 0) {
    return (
      <div>
        <header className="mb-10">
          <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Mes <VzHighlight>statistiques</VzHighlight>.
          </h1>
          <p className="mt-2 text-sm text-muted">
            Performances et vues de tes portfolios.
          </p>
        </header>
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface-warm p-8 text-center">
          <p className="text-sm text-muted">
            Crée et publie un projet pour commencer à voir tes statistiques.
          </p>
          <Link
            href="/editor"
            className="mt-4 inline-flex items-center text-sm font-medium text-accent-deep transition-colors hover:text-foreground"
          >
            Créer un projet
          </Link>
        </div>
      </div>
    )
  }

  // ── Date boundaries ──
  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  )
  const thirtyDaysAgo = new Date(startOfToday)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date(startOfToday)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const [totalCountsResult, recentViewsResult] = await Promise.all([
    Promise.all(
      allPortfolios.map(async (p) => {
        const { count } = await supabase
          .from('page_views')
          .select('id', { count: 'exact', head: true })
          .eq('portfolio_id', p.id)
        return { id: p.id, total: count ?? 0 }
      }),
    ),
    supabase
      .from('page_views')
      .select('portfolio_id, referrer, viewed_at')
      .in('portfolio_id', portfolioIds)
      .gte('viewed_at', sixtyDaysAgo.toISOString())
      .limit(50000),
  ])

  const recentViews = recentViewsResult.data ?? []
  const totalCountsMap = new Map(
    totalCountsResult.map((r) => [r.id, r.total]),
  )

  const statsMap = new Map<
    string,
    {
      viewsToday: number
      viewsLast30: number
      viewsPrev30: number
      referrerCounts: Map<string, number>
      dailyCounts: Map<string, number>
    }
  >()

  for (const pid of portfolioIds) {
    statsMap.set(pid, {
      viewsToday: 0,
      viewsLast30: 0,
      viewsPrev30: 0,
      referrerCounts: new Map(),
      dailyCounts: new Map(),
    })
  }

  for (const row of recentViews) {
    const entry = statsMap.get(row.portfolio_id)
    if (!entry) continue

    const viewedAt = new Date(row.viewed_at)

    if (viewedAt >= startOfToday) {
      entry.viewsToday++
    }
    if (viewedAt >= thirtyDaysAgo) {
      entry.viewsLast30++
      const source = extractDomain(row.referrer)
      entry.referrerCounts.set(
        source,
        (entry.referrerCounts.get(source) ?? 0) + 1,
      )
      const dayKey = viewedAt.toISOString().slice(0, 10)
      entry.dailyCounts.set(dayKey, (entry.dailyCounts.get(dayKey) ?? 0) + 1)
    } else {
      entry.viewsPrev30++
    }
  }

  const portfolioStats: PortfolioStats[] = allPortfolios.map((p) => {
    const entry = statsMap.get(p.id)
    const referrerCounts = entry?.referrerCounts ?? new Map()
    const sources = [...referrerCounts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    const templateProps: TemplateProps = {
      portfolio: {
        title: p.title || 'Mon portfolio',
        bio: p.bio ?? null,
        photo_url: p.photo_url ?? null,
        primary_color: p.primary_color || DEFAULT_PORTFOLIO_COLOR,
        secondary_color: p.secondary_color || '#1A1A1A',
        font: p.font || 'DM Sans',
        font_body: p.font_body ?? p.font ?? 'DM Sans',
        social_links:
          (p.social_links as Record<string, string> | null) ?? null,
        contact_email: p.contact_email ?? null,
      },
      projects: [],
      skills: parseSkills(p.skills),
      sections: parseSections(p.sections),
      customBlocks: parseCustomBlocks(p.custom_blocks),
      kpis: parseKpis(p.kpis),
      layoutBlocks: parseLayoutBlocks(p.layout_blocks),
      isPremium: false,
    }

    const dailyCounts = entry?.dailyCounts ?? new Map()
    const dailyViews: Array<{ date: string; count: number }> = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(startOfToday)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      dailyViews.push({ date: key, count: dailyCounts.get(key) ?? 0 })
    }

    return {
      id: p.id,
      title: p.title ?? 'Sans titre',
      slug: p.slug,
      published: p.published ?? false,
      template: p.template ?? 'classique',
      templateProps,
      totalViews: totalCountsMap.get(p.id) ?? 0,
      viewsToday: entry?.viewsToday ?? 0,
      viewsLast30: entry?.viewsLast30 ?? 0,
      viewsPrev30: entry?.viewsPrev30 ?? 0,
      sources,
      dailyViews,
    }
  })

  return <StatsClient portfolios={portfolioStats} />
}

function extractDomain(referrer: string | null): string {
  if (!referrer) return 'Direct'
  try {
    const url = new URL(referrer)
    const host = url.hostname.replace(/^www\./, '')
    if (host.includes('google')) return 'Google'
    if (host.includes('linkedin')) return 'LinkedIn'
    if (host.includes('twitter') || host.includes('x.com')) return 'X (Twitter)'
    if (host.includes('facebook')) return 'Facebook'
    if (host.includes('instagram')) return 'Instagram'
    if (host.includes('github')) return 'GitHub'
    if (host.includes('vizly')) return 'Vizly'
    return host
  } catch {
    return 'Autre'
  }
}
