import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { PlanType } from '@/lib/constants'

export default async function StatistiquesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'free') as PlanType

  if (plan !== 'pro') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
          Statistiques
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted leading-relaxed">
          Suis le nombre de vues sur tes portfolios, decouvre d&apos;ou viennent tes visiteurs et analyse tes performances.
        </p>
        <Link
          href="/billing"
          className="mt-6 inline-flex items-center rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-hover"
        >
          Passer au Pro
        </Link>
      </div>
    )
  }

  // Fetch portfolios
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('id, title, slug, published')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allPortfolios = portfolios ?? []
  const portfolioIds = allPortfolios.map((p) => p.id)

  // Fetch total views
  let totalViews = 0
  let viewsLast30Days = 0
  const viewsByPortfolio: Array<{ id: string; title: string; slug: string | null; views: number }> = []

  if (portfolioIds.length > 0) {
    const { count: total } = await supabase
      .from('page_views')
      .select('id', { count: 'exact', head: true })
      .in('portfolio_id', portfolioIds)

    totalViews = total ?? 0

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: recent } = await supabase
      .from('page_views')
      .select('id', { count: 'exact', head: true })
      .in('portfolio_id', portfolioIds)
      .gte('viewed_at', thirtyDaysAgo.toISOString())

    viewsLast30Days = recent ?? 0

    // Per-portfolio views
    for (const p of allPortfolios) {
      const { count } = await supabase
        .from('page_views')
        .select('id', { count: 'exact', head: true })
        .eq('portfolio_id', p.id)

      viewsByPortfolio.push({
        id: p.id,
        title: p.title ?? 'Sans titre',
        slug: p.slug,
        views: count ?? 0,
      })
    }
  }

  const publishedCount = allPortfolios.filter((p) => p.published).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
          Statistiques
        </h1>
        <p className="mt-1 text-sm text-muted">
          Performances de tes portfolios.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <p className="text-sm text-muted mb-1">Vues totales</p>
          <p className="font-[family-name:var(--font-satoshi)] text-3xl font-bold">{totalViews}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <p className="text-sm text-muted mb-1">30 derniers jours</p>
          <p className="font-[family-name:var(--font-satoshi)] text-3xl font-bold">{viewsLast30Days}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <p className="text-sm text-muted mb-1">Projets en ligne</p>
          <p className="font-[family-name:var(--font-satoshi)] text-3xl font-bold">{publishedCount}</p>
        </div>
      </div>

      {/* Per-project breakdown */}
      <section>
        <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold mb-4">
          Par projet
        </h2>
        {viewsByPortfolio.length > 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface divide-y divide-border">
            {viewsByPortfolio.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                  {p.slug && (
                    <p className="text-xs text-muted">{p.slug}.vizly.fr</p>
                  )}
                </div>
                <p className="font-[family-name:var(--font-satoshi)] text-lg font-bold text-foreground tabular-nums">
                  {p.views}
                  <span className="text-xs font-normal text-muted ml-1">vues</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted">
              Crée et publie un projet pour commencer à voir tes statistiques.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
