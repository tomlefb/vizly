import type { Metadata } from 'next'
import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import { TarifsClient } from '@/components/marketing/TarifsClient'
import { ComparisonTable } from '@/components/marketing/ComparisonTable'
import { PricingFAQ } from '@/components/marketing/PricingFAQ'

export const metadata: Metadata = {
  title: 'Tarifs',
  description:
    'Simple, transparent. Commence gratuitement, tu ne paies que quand tu décides de publier ton portfolio.',
}

export default function TarifsPage() {
  return (
    <>
      <Header />
      <main>
        <TarifsClient />
        <ComparisonTable />
        <PricingFAQ />
      </main>
      <Footer />
    </>
  )
}
