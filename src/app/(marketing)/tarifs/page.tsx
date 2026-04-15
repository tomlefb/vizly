import type { Metadata } from 'next'
import Link from 'next/link'
import { CTA } from '@/components/marketing/CTA'
import { TarifsClient } from '@/components/marketing/TarifsClient'
import { ComparisonTable } from '@/components/marketing/ComparisonTable'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Tarifs',
  description:
    'Simple, transparent. Commence gratuitement, tu ne paies que quand tu décides de publier ton portfolio.',
}

export default async function TarifsPage() {
  // Server-side auth check + plan resolution. Used to drive CTA behavior
  // in TarifsClient: anonymous → /register redirect, authenticated free →
  // open SubscriptionCheckoutModal, authenticated paid → direct
  // changeSubscriptionPlanAction. Source of truth for `currentPlan` is
  // the local users.plan column (kept in sync with the subscriptions
  // table by the Phase 3 webhook handlers).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentPlan: 'free' | 'starter' | 'pro' = 'free'
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .single()
    currentPlan = (profile?.plan ?? 'free') as 'free' | 'starter' | 'pro'
  }

  return (
    <main>
      <TarifsClient isAuthenticated={user !== null} currentPlan={currentPlan} />
      <ComparisonTable />
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-8 lg:pb-12">
        <p className="text-center text-sm text-muted">
          Une question sur les plans ?{' '}
          <Link
            href="/legal/faq"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Consulte la FAQ complète →
          </Link>
        </p>
      </div>
      <CTA
        title="Prêt à publier"
        titleAccent="ton portfolio"
        description="Gratuit pour commencer. Tu ne paies que quand tu décides de publier."
        primaryLabel="Créer mon portfolio"
        primaryHref="/register"
        secondaryLabel="Voir les templates"
        secondaryHref="/templates"
      />
    </main>
  )
}
