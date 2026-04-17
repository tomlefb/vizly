import { Hero } from '@/components/marketing/Hero'
import { FeaturesGrid } from '@/components/marketing/FeaturesGrid'
import { Pricing } from '@/components/marketing/Pricing'
import { CTASectionLanding } from '@/components/marketing/CTASection'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <FeaturesGrid />
      <Pricing />
      <CTASectionLanding />
    </main>
  )
}
