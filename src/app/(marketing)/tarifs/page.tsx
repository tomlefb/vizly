import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { CTASectionTarifs } from '@/components/marketing/CTASection'
import { TarifsClient } from '@/components/marketing/TarifsClient'
import { ComparisonTable } from '@/components/marketing/ComparisonTable'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('tarifs')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function TarifsPage() {
  const t = await getTranslations('tarifs')
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
          {t('faqQuestion')}{' '}
          <Link
            href="/legal/faq"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            {t('faqLink')}
          </Link>
        </p>
      </div>
      <CTASectionTarifs />
    </main>
  )
}
