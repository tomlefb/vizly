import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Eye,
  Layers,
  Link2,
  Minus,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanType } from '@/lib/constants'

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
        <BarChart3
          className="h-9 w-9 text-muted-foreground/50"
          strokeWidth={1.5}
        />
        <h3 className="mt-5 font-[family-name:var(--font-satoshi)] text-lg font-semibold text-foreground">
          Statistiques
        </h3>
        <p className="mt-2 text-sm text-muted">
          Suis le nombre de vues sur tes portfolios et découvre d&apos;où
          viennent tes visiteurs. Disponible avec le plan Pro.
        </p>
        <div className="mt-7">
          <Link
            href="/billing"
            className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-accent px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
          >
            Passer au Pro
          </Link>
        </div>
      </div>
    )
  }

  // ── Fetch portfolios ──
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('id, title, slug, published')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allPortfolios = portfolios ?? []
  const portfolioIds = allPortfolios.map((p) => p.id)
  const publishedCount = allPortfolios.filter((p) => p.published).length

  // ── Build date boundaries ──
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

  let totalViews = 0
  let viewsToday = 0
  let viewsLast30 = 0
  let viewsPrev30 = 0
  const viewsByPortfolio: Array<{
    id: string
    title: string
    slug: string | null
    published: boolean
    views: number
  }> = []
  let topSources: Array<{ source: string; count: number }> = []

  if (portfolioIds.length > 0) {
    // ── Aggregate queries in parallel ──
    const [totalRes, todayRes, last30Res, prev30Res, referrerRes] =
      await Promise.all([
        supabase
          .from('page_views')
          .select('id', { count: 'exact', head: true })
          .in('portfolio_id', portfolioIds),
        supabase
          .from('page_views')
          .select('id', { count: 'exact', head: true })
          .in('portfolio_id', portfolioIds)
          .gte('viewed_at', startOfToday.toISOString()),
        supabase
          .from('page_views')
          .select('id', { count: 'exact', head: true })
          .in('portfolio_id', portfolioIds)
          .gte('viewed_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('page_views')
          .select('id', { count: 'exact', head: true })
          .in('portfolio_id', portfolioIds)
          .gte('viewed_at', sixtyDaysAgo.toISOString())
          .lt('viewed_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('page_views')
          .select('referrer')
          .in('portfolio_id', portfolioIds)
          .gte('viewed_at', thirtyDaysAgo.toISOString()),
      ])

    totalViews = totalRes.count ?? 0
    viewsToday = todayRes.count ?? 0
    viewsLast30 = last30Res.count ?? 0
    viewsPrev30 = prev30Res.count ?? 0

    // ── Top sources from referrers ──
    const referrerRows = referrerRes.data ?? []
    const sourceCounts = new Map<string, number>()
    for (const row of referrerRows) {
      const source = extractDomain(row.referrer)
      sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1)
    }
    topSources = [...sourceCounts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // ── Per-portfolio counts (parallel) ──
    const perPortfolioCounts = await Promise.all(
      allPortfolios.map(async (p) => {
        const { count } = await supabase
          .from('page_views')
          .select('id', { count: 'exact', head: true })
          .eq('portfolio_id', p.id)
        return {
          id: p.id,
          title: p.title ?? 'Sans titre',
          slug: p.slug,
          published: p.published ?? false,
          views: count ?? 0,
        }
      }),
    )
    viewsByPortfolio.push(...perPortfolioCounts)
  }

  // ── Trend (30j vs 30j précédents) ──
  const trendPercent =
    viewsPrev30 > 0
      ? Math.round(((viewsLast30 - viewsPrev30) / viewsPrev30) * 100)
      : viewsLast30 > 0
        ? 100
        : 0

  const sortedByViews = [...viewsByPortfolio].sort((a, b) => b.views - a.views)

  return (
    <div>
      <header className="mb-10">
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Mes <span className="text-accent">statistiques</span>.
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Performances et vues de tes portfolios.
        </p>
      </header>

      {/* ─── KPI cards ─── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Eye} label="Vues totales" value={totalViews} />
        <StatCard
          icon={TrendingUp}
          label="30 derniers jours"
          value={viewsLast30}
          trend={trendPercent}
        />
        <StatCard icon={Eye} label="Aujourd'hui" value={viewsToday} />
        <StatCard icon={Layers} label="Projets en ligne" value={publishedCount} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        {/* ─── Détail par projet ─── */}
        <section>
          <h2 className="font-[family-name:var(--font-satoshi)] text-base font-semibold text-foreground">
            Par projet
          </h2>
          <p className="mt-1 text-sm text-muted">
            Nombre de vues par portfolio, trié par popularité.
          </p>

          {sortedByViews.length > 0 ? (
            <ul className="mt-6 divide-y divide-border-light rounded-[var(--radius-lg)] border border-border overflow-hidden">
              {sortedByViews.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center gap-4 bg-surface px-5 py-4 transition-colors hover:bg-surface-warm"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-warm text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p.title}
                      </p>
                      {p.published && (
                        <span className="inline-flex items-center rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                          En ligne
                        </span>
                      )}
                    </div>
                    {p.slug && (
                      <p className="text-xs text-muted">{p.slug}.vizly.fr</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-[family-name:var(--font-satoshi)] text-lg font-bold text-foreground tabular-nums">
                      {p.views.toLocaleString('fr-FR')}
                    </p>
                    <p className="text-xs text-muted">vues</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted">
                Crée et publie un projet pour commencer à voir tes statistiques.
              </p>
              <Link
                href="/editor"
                className="mt-4 inline-flex items-center text-sm font-medium text-accent hover:text-accent-hover transition-colors"
              >
                Créer un projet
              </Link>
            </div>
          )}
        </section>

        {/* ─── Top sources ─── */}
        <section>
          <h2 className="font-[family-name:var(--font-satoshi)] text-base font-semibold text-foreground">
            Sources
          </h2>
          <p className="mt-1 text-sm text-muted">
            D&apos;où viennent tes visiteurs (30 derniers jours).
          </p>

          {topSources.length > 0 ? (
            <ul className="mt-6 space-y-1">
              {topSources.map((s) => {
                const maxCount = topSources[0]?.count ?? 1
                const widthPct = Math.max(
                  8,
                  Math.round((s.count / maxCount) * 100),
                )
                return (
                  <li key={s.source} className="group relative">
                    <div
                      className="absolute inset-y-0 left-0 rounded-[var(--radius-sm)] bg-surface-warm transition-colors group-hover:bg-accent/5"
                      style={{ width: `${widthPct}%` }}
                    />
                    <div className="relative flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link2 className="h-3 w-3 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                        <span className="text-sm text-foreground truncate">
                          {s.source}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground tabular-nums">
                        {s.count.toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted">
                Pas encore de données sur les sources.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

// ── Sub-components ──

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: number
  trend?: number
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-sm text-muted">{label}</p>
      </div>
      <p className="mt-2 font-[family-name:var(--font-satoshi)] text-3xl font-bold text-foreground tabular-nums">
        {value.toLocaleString('fr-FR')}
      </p>
      {trend !== undefined && (
        <div className="mt-1.5 flex items-center gap-1">
          {trend > 0 ? (
            <ArrowUp className="h-3 w-3 text-success" strokeWidth={2} />
          ) : trend < 0 ? (
            <ArrowDown className="h-3 w-3 text-destructive" strokeWidth={2} />
          ) : (
            <Minus className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              trend > 0
                ? 'text-success'
                : trend < 0
                  ? 'text-destructive'
                  : 'text-muted-foreground',
            )}
          >
            {trend > 0 ? '+' : ''}
            {trend} % vs 30j préc.
          </span>
        </div>
      )}
    </div>
  )
}

// ── Helpers ──

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
