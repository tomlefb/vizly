import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import { CTA } from '@/components/marketing/CTA'
import { TarifsClient } from '@/components/marketing/TarifsClient'
import { ComparisonTable } from '@/components/marketing/ComparisonTable'

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
      <Footer />
    </>
  )
}
