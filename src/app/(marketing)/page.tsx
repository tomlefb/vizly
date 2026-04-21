import type { Metadata } from 'next'
import { Hero } from '@/components/marketing/Hero'
import { FeaturesGrid } from '@/components/marketing/FeaturesGrid'
import { PricingSection } from '@/components/marketing/PricingSection'
import { CTASectionLanding } from '@/components/marketing/CTASection'
import { createClient } from '@/lib/supabase/server'

// Metadata propre pour la homepage — indépendante du template root. Sans ça,
// Google voyait une seule page indexée avec le titre du template, ce qui
// explique la diversité keyword nulle dans Search Console (seul "vizly"
// rankait). Le title cible désormais "créer un portfolio en ligne" + brand.
export const metadata: Metadata = {
  // `absolute` court-circuite le template root `%s · Vizly` qui sinon
  // doublerait la marque ("… · Vizly · Vizly").
  title: { absolute: 'Vizly · Créer un portfolio en ligne en 5 minutes' },
  description:
    'Vizly est le builder de portfolios en ligne le plus simple. Choisis un template, remplis un formulaire, publie ton site sur pseudo.vizly.fr en 5 minutes.',
  keywords: [
    'créer un portfolio',
    'portfolio en ligne',
    'site portfolio',
    'builder portfolio',
    'portfolio gratuit',
    'faire un portfolio',
    'portfolio professionnel',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Créer un portfolio en ligne · Vizly',
    description:
      'Le builder de portfolios le plus simple. Remplis, personnalise, publie sur pseudo.vizly.fr.',
    url: '/',
    type: 'website',
  },
}

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
