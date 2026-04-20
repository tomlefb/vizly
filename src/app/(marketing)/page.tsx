import { Hero } from '@/components/marketing/Hero'
import { FeaturesGrid } from '@/components/marketing/FeaturesGrid'
import { PricingSection } from '@/components/marketing/PricingSection'
import { CTASectionLanding } from '@/components/marketing/CTASection'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
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
      <Hero />
      <FeaturesGrid />
      <PricingSection isAuthenticated={user !== null} currentPlan={currentPlan} />
      <CTASectionLanding />
    </main>
  )
}
