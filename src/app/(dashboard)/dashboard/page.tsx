import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanType } from '@/lib/constants'
import { TemplatePreview } from '@/components/shared/TemplatePreview'
import { PublishToggle } from './publish-toggle'
import { DeletePortfolio } from './delete-portfolio'
import { parseSections, parseSkills, DEFAULT_SECTIONS } from '@/types/sections'
import { parseCustomBlocks } from '@/types/custom-blocks'
import { parseKpis } from '@/types/kpis'
import { parseLayoutBlocks } from '@/types/layout-blocks'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

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

  // Can the user publish one more?
  const canPublishMore = publishedCount < publishLimit
  const planMessage =
    publishLimit === 0
      ? 'Passe au Starter pour publier'
      : publishLimit === 1 && publishedCount >= 1
        ? 'Limite atteinte — passe au Pro'
        : undefined

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
              <>{publishedCount} projet{publishedCount !== 1 ? 's' : ''} en ligne</>
            )}
          </span>
        </div>
        <span className="text-sm font-semibold text-foreground">
          {allPortfolios.length} projet{allPortfolios.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Portfolio list */}
      {allPortfolios.length > 0 ? (
        <div className="space-y-5">
          {allPortfolios.map((portfolio) => {
            const templateProps = {
              portfolio: {
                title: portfolio.title || 'Mon portfolio',
                bio: portfolio.bio ?? null,
                photo_url: portfolio.photo_url ?? null,
                primary_color: portfolio.primary_color || '#E8553D',
                secondary_color: portfolio.secondary_color || '#1A1A1A',
                font: portfolio.font || 'DM Sans',
                font_body: portfolio.font_body ?? portfolio.font ?? 'DM Sans',
                social_links: (portfolio.social_links as Record<string, string> | null) ?? null,
                contact_email: portfolio.contact_email ?? null,
              },
              projects: [],
              skills: parseSkills(portfolio.skills),
              sections: parseSections(portfolio.sections),
              customBlocks: parseCustomBlocks(portfolio.custom_blocks),
              kpis: parseKpis(portfolio.kpis),
              layoutBlocks: parseLayoutBlocks(portfolio.layout_blocks),
              isPremium: false,
            }

            return (
              <div
                key={portfolio.id}
                className="rounded-[var(--radius-xl)] border border-border bg-surface overflow-hidden transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Template preview */}
                  <div className="lg:w-[340px] shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-white overflow-hidden">
                    {/* Browser chrome */}
                    <div className="flex items-center gap-2 border-b border-border bg-surface-warm px-3 py-1.5">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6259]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFBF2F]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#29CE42]" />
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="rounded-[2px] bg-background border border-border-light px-2 py-px text-[9px] text-muted font-mono truncate max-w-[140px]">
                          {portfolio.slug ? `${portfolio.slug}.vizly.fr` : 'non publie'}
                        </div>
                      </div>
                    </div>
                    {/* Scaled template */}
                    <TemplatePreview
                      templateName={portfolio.template}
                      templateProps={templateProps}
                      scale={0.265}
                      height="180px"
                    />
                  </div>

                  {/* Info + actions */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold text-foreground truncate">
                            {portfolio.title || 'Sans titre'}
                          </h3>
                          <p className="text-sm text-muted mt-0.5">
                            Template <span className="capitalize font-medium text-foreground">{portfolio.template}</span>
                          </p>
                        </div>
                        <span
                          className={`shrink-0 ml-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            portfolio.published
                              ? 'bg-success/10 text-success'
                              : 'bg-surface-warm text-muted'
                          }`}
                        >
                          {portfolio.published ? 'En ligne' : 'Brouillon'}
                        </span>
                      </div>

                      {portfolio.slug && (
                        <p className="text-xs text-muted mb-1">
                          URL : <span className="font-mono text-foreground">{portfolio.slug}.vizly.fr</span>
                        </p>
                      )}
                      {portfolio.bio && (
                        <p className="text-xs text-muted line-clamp-2 mt-1">
                          {portfolio.bio}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border-light">
                      <Link
                        href={`/editor?id=${portfolio.id}`}
                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-accent-hover"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                        Modifier
                      </Link>

                      <PublishToggle
                        portfolioId={portfolio.id}
                        slug={portfolio.slug}
                        published={portfolio.published}
                        canPublish={portfolio.published || canPublishMore}
                        planMessage={planMessage}
                      />

                      {portfolio.published && portfolio.slug && (
                        <a
                          href={`https://${portfolio.slug}.vizly.fr`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-surface-warm"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                          Voir le site
                        </a>
                      )}

                      {/* Spacer to push delete to the right */}
                      <div className="flex-1" />

                      <DeletePortfolio
                        portfolioId={portfolio.id}
                        portfolioTitle={portfolio.title || 'Sans titre'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Add new project card */}
          <Link
            href="/editor"
            className="block rounded-[var(--radius-xl)] border-2 border-dashed border-border bg-surface-warm/20 p-8 text-center transition-colors duration-200 hover:border-accent/40 hover:bg-accent/[0.02] group"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-warm border border-border flex items-center justify-center transition-colors group-hover:border-accent/30 group-hover:bg-accent/10">
                <svg className="h-5 w-5 text-muted transition-colors group-hover:text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="text-sm font-medium text-muted transition-colors group-hover:text-foreground">
                Creer un nouveau projet
              </span>
            </div>
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
