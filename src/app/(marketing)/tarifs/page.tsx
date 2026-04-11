import type { Metadata } from 'next'
import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import { TarifsClient } from '@/components/marketing/TarifsClient'

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
      </main>
      <Footer />
    </>
  )
}
