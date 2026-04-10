import { Header } from '@/components/marketing/Header'
import { Hero } from '@/components/marketing/Hero'
import { SocialProof } from '@/components/marketing/SocialProof'
import { Features } from '@/components/marketing/Features'
import { Pricing } from '@/components/marketing/Pricing'
import { CTA } from '@/components/marketing/CTA'
import { Footer } from '@/components/marketing/Footer'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
