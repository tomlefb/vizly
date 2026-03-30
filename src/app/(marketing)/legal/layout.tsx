import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 lg:px-8 py-16 lg:py-24">
        {children}
      </main>
      <Footer />
    </>
  )
}
