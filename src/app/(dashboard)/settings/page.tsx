import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
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
    .select('name')
    .eq('id', user.id)
    .single()

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

