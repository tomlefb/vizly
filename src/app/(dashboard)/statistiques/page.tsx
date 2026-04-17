import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BarChart3, Eye, TrendingUp, Layers } from 'lucide-react'
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

  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('id, title, slug, published')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allPortfolios = portfolios ?? []
  const portfolioIds = allPortfolios.map((p) => p.id)

  let totalViews = 0
  let viewsLast30Days = 0
  const viewsByPortfolio: Array<{
    id: string
    title: string
    slug: string | null
    published: boolean
    views: number
  }> = []

  if (portfolioIds.length > 0) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [totalRes, recentRes] = await Promise.all([
      supabase
        .from('page_views')
        .select('id', { count: 'exact', head: true })
        .in('portfolio_id', portfolioIds),
      supabase
        .from('page_views')
        .select('id', { count: 'exact', head: true })
        .in('portfolio_id', portfolioIds)
        .gte('viewed_at', thirtyDaysAgo.toISOString()),
    ])

    totalViews = totalRes.count ?? 0
    viewsLast30Days = recentRes.count ?? 0

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

  const publishedCount = allPortfolios.filter((p) => p.published).length
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

      {/* ─── Métriques ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Eye}
          label="Vues totales"
          value={totalViews}
        />
        <StatCard
          icon={TrendingUp}
          label="30 derniers jours"
          value={viewsLast30Days}
        />
        <StatCard
          icon={Layers}
          label="Projets en ligne"
          value={publishedCount}
        />
      </div>

      {/* ─── Détail par projet ─── */}
      <section className="mt-10">
        <h2 className="font-[family-name:var(--font-satoshi)] text-base font-semibold text-foreground">
          Par projet
        </h2>
        <p className="mt-1 text-sm text-muted">
          Nombre de vues par portfolio, trié par popularité.
        </p>

        {sortedByViews.length > 0 ? (
          <ul className="mt-6 divide-y divide-border-light rounded-[var(--radius-lg)] border border-border overflow-hidden">
            {sortedByViews.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 bg-surface px-5 py-4 transition-colors hover:bg-surface-warm"
              >
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
                <p className="font-[family-name:var(--font-satoshi)] text-lg font-bold text-foreground tabular-nums">
                  {p.views.toLocaleString('fr-FR')}
                  <span className="ml-1 text-xs font-normal text-muted">
                    vues
                  </span>
                </p>
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
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: number
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <Icon
          className="h-4 w-4 text-muted-foreground"
          strokeWidth={1.5}
        />
        <p className="text-sm text-muted">{label}</p>
      </div>
      <p className="mt-2 font-[family-name:var(--font-satoshi)] text-3xl font-bold text-foreground tabular-nums">
        {value.toLocaleString('fr-FR')}
      </p>
    </div>
  )
}
