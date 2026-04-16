import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Plus, Pencil, ExternalLink, FolderPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanType } from '@/lib/constants'
import { TemplatePreview } from '@/components/shared/TemplatePreview'
import { PublishToggle } from './publish-toggle'
import { DeletePortfolio } from './delete-portfolio'
import { parseSections, parseSkills, DEFAULT_SECTIONS } from '@/types/sections'
import { parseCustomBlocks } from '@/types/custom-blocks'
import { parseKpis } from '@/types/kpis'
import { parseLayoutBlocks } from '@/types/layout-blocks'
import { AutoOpenSubscriptionModal } from '@/components/billing/AutoOpenSubscriptionModal'

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const t = await getTranslations('dashboard')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const resolvedSearchParams = await searchParams
  const planParam = resolvedSearchParams.plan
  const intervalParam = resolvedSearchParams.interval
  const autoOpenPlan: 'starter' | 'pro' | null =
    planParam === 'starter' || planParam === 'pro' ? planParam : null
  const autoOpenInterval: 'monthly' | 'yearly' =
    intervalParam === 'yearly' ? 'yearly' : 'monthly'

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

  const canPublishMore = publishedCount < publishLimit
  const planMessage =
    publishLimit === 0
      ? t('publish.upgradeStarter')
      : publishLimit === 1 && publishedCount >= 1
        ? t('publish.limitReached')
        : undefined

  const showUpgrade = publishLimit === 0 || (publishLimit === 1 && publishedCount >= 1)
  const upgradeHref = '/billing'
  const upgradeLabel = publishLimit === 0 ? t('upgradeStarter') : t('upgradePro')
  const statusFragment =
    publishLimit === 0
      ? t('previewOnly')
      : publishLimit === Infinity
        ? t('projectsOnline', { count: publishedCount })
        : `${publishedCount}/${publishLimit} ${t('projectsOnline', { count: publishedCount })}`

  return (
    <>
      {/* Page header */}
      <header className="mb-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span>{t('planLabel', { plan: planInfo.name })}</span>
            <span className="text-muted-foreground/60" aria-hidden="true">·</span>
            <span>{statusFragment}</span>
            {showUpgrade && (
              <>
                <span className="text-muted-foreground/60" aria-hidden="true">·</span>
                <Link
                  href={upgradeHref}
                  className="font-medium text-accent transition-colors hover:text-accent-hover"
                >
                  {upgradeLabel}
                </Link>
              </>
            )}
          </p>
        </div>
        <Link
          href="/editor"
          className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          {t('newProject')}
        </Link>
      </header>

      {/* Portfolio list */}
      {allPortfolios.length > 0 ? (
        <ul className="space-y-4">
          {allPortfolios.map((portfolio) => {
            const templateProps = {
              portfolio: {
                title: portfolio.title || 'Mon portfolio',
                bio: portfolio.bio ?? null,
                photo_url: portfolio.photo_url ?? null,
                primary_color: portfolio.primary_color || '#D4634E',
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
              <li
                key={portfolio.id}
                className="overflow-hidden rounded-[var(--radius-lg)] border border-border-light bg-surface transition-all duration-200 hover:border-border hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Template preview */}
                  <div className="shrink-0 overflow-hidden border-b border-border-light bg-background lg:w-[340px] lg:border-b-0 lg:border-r">
                    {/* Browser chrome */}
                    <div className="flex items-center gap-2 border-b border-border-light bg-surface-warm px-3 py-1.5">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                      </div>
                      <div className="flex flex-1 justify-center">
                        <div className="max-w-[140px] truncate rounded-[2px] border border-border-light bg-background px-2 py-px font-mono text-[9px] text-muted">
                          {portfolio.slug ? `${portfolio.slug}.vizly.fr` : t('notPublished')}
                        </div>
                      </div>
                    </div>
                    <TemplatePreview
                      templateName={portfolio.template}
                      templateProps={templateProps}
                      scale={0.265}
                      height="180px"
                    />
                  </div>

                  {/* Info + actions */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-[family-name:var(--font-satoshi)] text-lg font-semibold text-foreground">
                            {portfolio.title || t('untitled')}
                          </h3>
                          <p className="mt-0.5 text-sm text-muted">
                            {t('template')}{' '}
                            <span className="font-medium capitalize text-foreground">
                              {portfolio.template}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            portfolio.published
                              ? 'bg-success/10 text-success'
                              : 'bg-surface-warm text-muted'
                          }`}
                        >
                          {portfolio.published ? t('online') : t('draft')}
                        </span>
                      </div>

                      {portfolio.slug && (
                        <p className="mb-1 text-xs text-muted">
                          URL :{' '}
                          <span className="font-mono text-foreground">
                            {portfolio.slug}.vizly.fr
                          </span>
                        </p>
                      )}
                      {portfolio.bio && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted">{portfolio.bio}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-2 border-t border-border-light pt-4">
                      <Link
                        href={`/editor?id=${portfolio.id}`}
                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-accent-hover"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        {t('edit')}
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
                          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                          {t('viewSite')}
                        </a>
                      )}

                      <div className="flex-1" />

                      <DeletePortfolio
                        portfolioId={portfolio.id}
                        portfolioTitle={portfolio.title || t('untitled')}
                      />
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        /* Empty state — sober pattern (no colored icon circle) */
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border bg-surface px-6 py-20 text-center">
          <FolderPlus
            className="h-8 w-8 text-muted-foreground/60"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <h2 className="mt-4 font-[family-name:var(--font-satoshi)] text-base font-semibold text-foreground">
            {profile?.name ? t('emptyTitle', { name: profile.name }) : t('emptyTitleDefault')}
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-muted">{t('emptyDescription')}</p>
          <Link
            href="/editor"
            className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            {t('emptyCta')}
          </Link>
        </div>
      )}

      {autoOpenPlan && (
        <AutoOpenSubscriptionModal plan={autoOpenPlan} interval={autoOpenInterval} />
      )}
    </>
  )
}
