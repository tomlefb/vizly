import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import { TemplateShowcase } from '@/components/marketing/TemplateShowcase'

export const metadata: Metadata = {
  title: 'Templates portfolio',
  description:
    '8 templates de portfolio professionnels. Du minimal au brutalist, trouve le style qui te correspond.',
}

export default function TemplatesPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-2xl mb-12">
          <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Nos templates
          </h1>
          <p className="mt-4 text-lg text-muted leading-relaxed">
            Chaque template a sa propre personnalité. Choisis celui qui te ressemble,
            personnalise les couleurs et la typo, et publie ton portfolio.
          </p>
        </div>

        <TemplateShowcase />

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
          >
            Essayer gratuitement
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            Crée ton portfolio gratuitement. Tu ne paieras que pour la mise en ligne.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
