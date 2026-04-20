import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getPortfoliosWithDomains } from '@/actions/portfolio'
import { Globe } from 'lucide-react'
import {
  VzBadge,
  VzHighlight,
  vzBtnClasses,
} from '@/components/ui/vizly'
import { DomainAssignmentForm } from './domain-assignment-form'
import type { PlanType } from '@/lib/constants'

export default async function DomainesPage() {
  const t = await getTranslations('domains')
  const tCommon = await getTranslations('common')
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
          <Globe
            className="h-5 w-5 text-muted-foreground"
            strokeWidth={1.5}
          />
        </div>
        <h3 className="mt-5 font-[family-name:var(--font-satoshi)] text-lg font-semibold text-foreground">
          {t('upgradeTitle')}
        </h3>
        <p className="mt-2 text-sm text-muted">
          {t('upgradeDescription')}
        </p>
        <Link
          href="/billing"
          className={vzBtnClasses({ variant: 'primary', size: 'md', className: 'mt-7' })}
        >
          {t('upgradeCta')}
        </Link>
      </div>
    )
  }

  const { data: portfolios } = await getPortfoliosWithDomains()

  return (
    <div>
      <header className="mb-10">
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t('titleStart')} <VzHighlight>{t('titleAccent')}</VzHighlight>
        </h1>
        <p className="mt-2 text-sm text-muted">
          {t('subtitle')}
        </p>
      </header>

      <div className="divide-y divide-border-light">
        {/* ─── Tuto : comment ça marche ─── */}
        <section className="pb-10">
          <h2 className="font-[family-name:var(--font-satoshi)] text-base font-semibold text-foreground">
            {t('tutoTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {t('tutoSubtitle')}
          </p>

          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            <TutoStep
              step={1}
              title={t('tutoStep1Title')}
              description={t('tutoStep1Description')}
            />
            <TutoStep
              step={2}
              title={t('tutoStep2Title')}
              description={t('tutoStep2Description')}
            />
            <TutoStep
              step={3}
              title={t('tutoStep3Title')}
              description={
                <>
                  {t('tutoStep3DescStart')}
                  <Code>CNAME</Code>
                  {t('tutoStep3DescEnd')}
                </>
              }
            />
          </ol>
        </section>

        {/* ─── Liste des portfolios + formulaire domaine ─── */}
        <section className="pt-10">
          <h2 className="font-[family-name:var(--font-satoshi)] text-base font-semibold text-foreground">
            {t('portfoliosTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {t('portfoliosSubtitle')}
          </p>

          {portfolios.length > 0 ? (
            <ul className="mt-6 divide-y divide-border-light overflow-hidden rounded-[var(--radius-lg)] border border-border-light">
              {portfolios.map((portfolio) => (
                <li
                  key={portfolio.id}
                  className="bg-surface px-5 py-4 transition-colors duration-150 hover:bg-surface-warm"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium text-foreground">
                        {portfolio.title || tCommon('portfolioUntitled')}
                      </h3>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className="font-mono">
                          {portfolio.slug
                            ? `${portfolio.slug}.vizly.fr`
                            : t('notPublished')}
                        </span>
                        {portfolio.published && (
                          <VzBadge variant="online">{t('badgeOnline')}</VzBadge>
                        )}
                      </p>
                    </div>
                  </div>
                  <DomainAssignmentForm
                    portfolioId={portfolio.id}
                    currentDomain={portfolio.custom_domain ?? ''}
                    currentStatus={portfolio.custom_domain_status}
                    currentDnsTarget={portfolio.custom_domain_dns_target}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-border bg-surface-warm p-8 text-center">
              <p className="text-sm text-muted">
                {t('emptyText')}
              </p>
              <Link
                href="/editor"
                className="mt-4 inline-flex items-center text-sm font-medium text-accent-deep transition-colors hover:text-foreground"
              >
                {t('emptyCta')}
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function TutoStep({
  step,
  title,
  description,
}: {
  step: number
  title: string
  description: React.ReactNode
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border-light bg-surface-warm font-[family-name:var(--font-satoshi)] text-xs font-bold text-foreground">
        {step}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {description}
        </p>
      </div>
    </li>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-[var(--radius-sm)] bg-surface-sunken px-1.5 py-0.5 font-mono text-xs font-medium text-foreground">
      {children}
    </code>
  )
}
