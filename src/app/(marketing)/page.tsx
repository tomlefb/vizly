import { Hero } from '@/components/marketing/Hero'
import { FeaturesGrid } from '@/components/marketing/FeaturesGrid'
import { Pricing } from '@/components/marketing/Pricing'
import { CTA } from '@/components/marketing/CTA'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <FeaturesGrid />
      <Pricing />
      <CTA />
    </main>
  )
}
