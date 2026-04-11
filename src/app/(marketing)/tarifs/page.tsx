import type { Metadata } from 'next'
import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import { CTA } from '@/components/marketing/CTA'
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
      <Footer />
    </>
  )
}
