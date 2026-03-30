import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/constants'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
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
    <div className="space-y-2">
      <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-satoshi)]">
        Parametres
      </h1>
      <p className="text-sm text-muted">
        Gere ton profil et ton compte.
      </p>

      <div className="pt-6 space-y-8">
        {/* Profile section */}
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold mb-4">
            Profil
          </h2>

          <div className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <div className="rounded-[var(--radius-md)] border border-border bg-surface-warm px-4 py-2.5 text-sm text-muted">
                {user.email}
              </div>
              <p className="mt-1 text-xs text-muted">
                L&apos;email est lie a ton compte et ne peut pas etre modifie ici.
              </p>
            </div>

            {/* Name (editable) */}
            <SettingsForm initialName={profile?.name ?? ''} />
          </div>
        </section>

        {/* Plan section */}
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold mb-4">
            Plan actuel
          </h2>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent capitalize">
              {planLabel}
            </span>
            {plan === 'free' && (
              <span className="text-sm text-muted">
                Passe a un plan payant pour publier ton portfolio.
              </span>
            )}
          </div>
          <div className="mt-4">
            <a
              href="/billing"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
            >
              Gerer mon abonnement
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </a>
          </div>
        </section>

        {/* Danger zone */}
        <section className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50/50 p-6">
          <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold text-red-700 mb-2">
            Zone dangereuse
          </h2>
          <p className="text-sm text-red-600/80 mb-4">
            La suppression de ton compte est irreversible. Toutes tes donnees, ton portfolio et tes projets seront definitivement supprimes.
          </p>
          <SettingsForm initialName={profile?.name ?? ''} showDeleteOnly />
        </section>
      </div>
    </div>
  )
}
