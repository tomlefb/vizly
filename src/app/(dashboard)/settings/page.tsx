import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/constants'
import { SettingsForm } from './settings-form'
import { ChangeEmailForm } from './change-email-form'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

export default async function SettingsPage() {
  const t = await getTranslations('settings')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('name, plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'free') as keyof typeof PLANS
  const planLabel = PLANS[plan].name

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left — Profil (wider : 3/5) */}
        <section className="rounded-[var(--radius-lg)] border border-border-light bg-surface p-6 lg:col-span-3 lg:p-7">
          <div className="mb-5">
            <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold text-foreground">
              {t('profile')}
            </h2>
            <p className="mt-1 text-sm text-muted">{t('profileDescription')}</p>
          </div>
          <div className="space-y-4">
            <ChangeEmailForm currentEmail={user.email ?? ''} />
            <SettingsForm initialName={profile?.name ?? ''} />
          </div>
        </section>

        {/* Right stack — Langue + Plan (2/5) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-[var(--radius-lg)] border border-border-light bg-surface p-6 lg:p-7">
            <div className="mb-5">
              <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold text-foreground">
                {t('language')}
              </h2>
              <p className="mt-1 text-sm text-muted">{t('languageDescription')}</p>
            </div>
            <LanguageSwitcher />
          </section>

          <section className="flex flex-1 flex-col rounded-[var(--radius-lg)] border border-border-light bg-surface p-6 lg:p-7">
            <div className="mb-5">
              <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold text-foreground">
                {t('currentPlan')}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t('currentPlanDescription')}
              </p>
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
                {planLabel}
              </span>
              <Link
                href="/billing"
                className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
              >
                {t('manageSubscription')}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </section>
        </div>

        {/* Footer card — delete account, full-width, horizontal layout */}
        <section className="rounded-[var(--radius-lg)] border border-border-light bg-surface p-6 lg:col-span-5 lg:p-7">
          <SettingsForm initialName={profile?.name ?? ''} showDeleteOnly />
        </section>
      </div>
    </div>
  )
}
