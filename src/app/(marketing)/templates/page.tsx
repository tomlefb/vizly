import type { Metadata } from 'next'
import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import { TemplateShowcase } from '@/components/marketing/TemplateShowcase'
import { CTA } from '@/components/marketing/CTA'
import { ScrollReveal } from '@/components/shared/ScrollReveal'

export const metadata: Metadata = {
  title: 'Templates portfolio',
  description:
    '8 templates de portfolio professionnels. Du minimal au brutalist, trouve le style qui te correspond.',
}

export default function TemplatesPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-6 lg:px-8 pt-16 pb-8 lg:pt-24 lg:pb-12">
        <ScrollReveal className="max-w-2xl mb-12">
          <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Nos <span className="text-accent">templates</span>
          </h1>
          <p className="mt-4 text-lg text-muted leading-relaxed">
            Chaque template a sa propre personnalité. Choisis celui qui te ressemble,
            personnalise les couleurs et la typo, et publie ton portfolio.
          </p>
        </ScrollReveal>

        <TemplateShowcase />
      </main>
      <CTA
        title="Choisis"
        titleAccent="ton style"
        suffix="."
        description="Gratuit pour commencer. Tu ne paies que si tu décides de publier."
      />
      <Footer />
    </>
  )
}
