import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAccountOverview } from '@/actions/billing'
import { PLANS } from '@/lib/constants'
import { formatEur } from '@/lib/utils'
import { SettingsForm } from './settings-form'
import { ChangeEmailForm } from './change-email-form'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

function formatLongDate(iso: string | null): string | null {
  if (!iso) return null
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export default async function SettingsPage() {
  const t = await getTranslations('settings')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: profile }, overview] = await Promise.all([
    supabase.from('users').select('name').eq('id', user.id).single(),
    getAccountOverview(),
  ])

  return (
    <div>
      <header className="mb-10">
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t.rich('titleRich', {
            accent: (chunks) => <span className="text-accent">{chunks}</span>,
          })}
        </h1>
        <p className="mt-1.5 text-sm text-muted">{t('subtitle')}</p>
      </header>

      <div className="divide-y divide-border-light">
        <SettingsSection
          title={t('profile')}
          description={t('profileDescription')}
        >
          <div className="space-y-5">
            <ChangeEmailForm currentEmail={user.email ?? ''} />
            <SettingsForm initialName={profile?.name ?? ''} />
          </div>
        </SettingsSection>

        <SettingsSection
          title={t('subscriptionTitle')}
          description={t('subscriptionDescription')}
        >
          <SubscriptionCard
            overview={overview}
            manageLabel={t('manageSubscription')}
          />
        </SettingsSection>

        <SettingsSection
          title={t('preferencesTitle')}
          description={t('preferencesDescription')}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('language')}
              </p>
              <p className="text-sm text-muted">{t('languageDescription')}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </SettingsSection>

        <SettingsSection
          title={t('dangerTitle')}
          description={t('dangerSectionDescription')}
        >
          <SettingsForm initialName={profile?.name ?? ''} showDeleteOnly />
        </SettingsSection>
      </div>
    </div>
  )
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-6 py-10 first:pt-0 last:pb-0 md:grid-cols-[260px_1fr] md:gap-10">
      <div>
        <h2 className="font-[family-name:var(--font-satoshi)] text-base font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  )
}

function SubscriptionCard({
  overview,
  manageLabel,
}: {
  overview: Awaited<ReturnType<typeof getAccountOverview>>
  manageLabel: string
}) {
  const nextBilling = formatLongDate(overview.nextBillingDate)

  if (overview.plan === 'free') {
    return (
      <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <PlanBadge plan="free" cancelled={false} />
            <span className="text-sm text-muted">Pas d&apos;abonnement actif.</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Passe à Starter ou Pro pour publier ton portfolio.
          </p>
        </div>
        <Link
          href="/billing"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface-warm sm:self-auto"
        >
          {manageLabel}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>
    )
  }

  const priceLabel =
    overview.priceCents !== null && overview.interval
      ? `${formatEur(overview.priceCents)} ${
          overview.interval === 'monthly' ? '/mois' : '/an'
        }`
      : null

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-border bg-surface p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <PlanBadge
            plan={overview.plan}
            cancelled={overview.cancelAtPeriodEnd}
          />
          {priceLabel && (
            <span className="text-sm font-semibold text-foreground">
              {priceLabel}
            </span>
          )}
        </div>

        <div className="space-y-0.5 text-sm text-muted">
          {nextBilling && (
            <p>
              {overview.cancelAtPeriodEnd
                ? `Actif jusqu'au ${nextBilling}`
                : `Prochaine facturation le ${nextBilling}`}
            </p>
          )}
          {overview.cardLast4 && (
            <p className="font-[family-name:var(--font-dm-mono),ui-monospace] tabular-nums">
              {overview.cardBrand
                ? `${overview.cardBrand.toUpperCase()} •••• ${overview.cardLast4}`
                : `•••• ${overview.cardLast4}`}
            </p>
          )}
        </div>
      </div>

      <Link
        href="/billing"
        className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface-warm"
      >
        {manageLabel}
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
      </Link>
    </div>
  )
}

function PlanBadge({
  plan,
  cancelled,
}: {
  plan: 'free' | 'starter' | 'pro'
  cancelled: boolean
}) {
  if (cancelled) {
    return (
      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-destructive">
        Annulé
      </span>
    )
  }
  if (plan === 'free') {
    return (
      <span className="inline-flex items-center rounded-full bg-surface-warm px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
        Free
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
      {PLANS[plan].name}
    </span>
  )
}
