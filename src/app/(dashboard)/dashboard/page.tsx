import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanType } from '@/lib/constants'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch ALL portfolios for the user
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('users')
    .select('name, plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'free') as PlanType
  const planInfo = PLANS[plan]
  const allPortfolios = portfolios ?? []
  const publishedCount = allPortfolios.filter((p) => p.published).length
  const publishLimit = planInfo.publishLimit

  const planBadgeStyle =
    plan === 'pro'
      ? 'bg-amber-100 text-amber-800'
      : plan === 'starter'
        ? 'bg-accent/10 text-accent'
        : 'bg-muted/50 text-muted-foreground'

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight">
            Mes projets
          </h1>
          <p className="mt-1 text-muted">
            {profile?.name ? `Bienvenue, ${profile.name}` : 'Bienvenue sur Vizly'}
          </p>
        </div>
        <Link
          href="/editor"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-hover"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouveau projet
        </Link>
      </div>

      {/* Publish limit info */}
      <div className="mb-6 rounded-[var(--radius-lg)] border border-border bg-surface p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${planBadgeStyle}`}>
            {planInfo.name}
          </span>
          <span className="text-sm text-muted">
            {publishLimit === 0 && (
              <>Preview uniquement &mdash; <Link href="/billing" className="text-accent font-medium hover:text-accent-hover">Passe au Starter</Link> pour publier</>
            )}
            {publishLimit === 1 && (
              <>{publishedCount}/1 projet en ligne &mdash; <Link href="/billing" className="text-accent font-medium hover:text-accent-hover">Passe au Pro</Link> pour plus</>
            )}
            {publishLimit === Infinity && (
              <>{publishedCount} projet{publishedCount !== 1 ? 's' : ''} en ligne &mdash; illimite</>
            )}
          </span>
        </div>
        <span className="text-sm font-semibold text-foreground">
          {allPortfolios.length} projet{allPortfolios.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Portfolio grid */}
      {allPortfolios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allPortfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="rounded-[var(--radius-lg)] border border-border bg-surface overflow-hidden transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-border"
            >
              {/* Mini preview header */}
              <div className="flex items-center gap-2 border-b border-border bg-surface-warm px-3 py-2">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF6259]" />
                  <span className="w-2 h-2 rounded-full bg-[#FFBF2F]" />
                  <span className="w-2 h-2 rounded-full bg-[#29CE42]" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="rounded-[3px] bg-background border border-border-light px-2.5 py-0.5 text-[10px] text-muted font-mono truncate max-w-[140px]">
                    {portfolio.slug ? `${portfolio.slug}.vizly.fr` : 'non publié'}
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-[family-name:var(--font-satoshi)] text-base font-semibold text-foreground truncate">
                      {portfolio.title || 'Sans titre'}
                    </h3>
                    <p className="text-xs text-muted mt-0.5 capitalize">
                      Template : {portfolio.template}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      portfolio.published
                        ? 'bg-success/10 text-success'
                        : 'bg-surface-warm text-muted'
                    }`}
                  >
                    {portfolio.published ? 'En ligne' : 'Brouillon'}
                  </span>
                </div>

                {/* Mini color preview */}
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  <div className="h-8 rounded-[var(--radius-sm)]" style={{ backgroundColor: `${portfolio.primary_color || '#E8553D'}15` }} />
                  <div className="h-8 rounded-[var(--radius-sm)]" style={{ backgroundColor: `${portfolio.primary_color || '#E8553D'}08` }} />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/editor?id=${portfolio.id}`}
                    className="flex-1 inline-flex items-center justify-center rounded-[var(--radius-md)] bg-accent px-3 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-accent-hover"
                  >
                    Modifier
                  </Link>
                  {portfolio.published && portfolio.slug && (
                    <a
                      href={`https://${portfolio.slug}.vizly.fr`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-surface-warm"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add new project card */}
          <Link
            href="/editor"
            className="rounded-[var(--radius-lg)] border-2 border-dashed border-border bg-surface-warm/30 p-5 flex flex-col items-center justify-center text-center min-h-[200px] transition-colors duration-200 hover:border-accent/40 hover:bg-accent/[0.02] group"
          >
            <div className="w-10 h-10 rounded-full bg-surface-warm border border-border flex items-center justify-center mb-3 transition-colors group-hover:border-accent/30 group-hover:bg-accent/10">
              <svg className="h-5 w-5 text-muted transition-colors group-hover:text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted transition-colors group-hover:text-foreground">
              Nouveau projet
            </p>
          </Link>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-border py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <svg
              className="h-7 w-7 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
          <h2 className="font-[family-name:var(--font-satoshi)] text-xl font-semibold">
            {profile?.name ? `${profile.name}, cree ton premier projet` : 'Cree ton premier projet'}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted leading-relaxed">
            En 5 minutes chrono. Remplis tes infos, choisis un template,
            et previsualise ton portfolio.
          </p>
          <Link
            href="/editor"
            className="mt-6 inline-flex items-center rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-hover"
          >
            Creer mon projet
          </Link>
        </div>
      )}
    </>
  )
}
