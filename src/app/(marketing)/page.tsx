import { Header } from '@/components/marketing/Header'
import { Hero } from '@/components/marketing/Hero'
import { FeaturesGrid } from '@/components/marketing/FeaturesGrid'
import { Pricing } from '@/components/marketing/Pricing'
import { CTA } from '@/components/marketing/CTA'
import { Footer } from '@/components/marketing/Footer'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <FeaturesGrid />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
