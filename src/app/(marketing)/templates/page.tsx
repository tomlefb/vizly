import type { Metadata } from 'next'
import { TemplateShowcase } from '@/components/marketing/TemplateShowcase'
import { CTASectionTemplates } from '@/components/marketing/CTASection'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { VzHighlight } from '@/components/ui/vizly'

export const metadata: Metadata = {
  title: 'Templates portfolio',
  description:
    '8 templates de portfolio professionnels. Du minimal au brutalist, trouve le style qui te correspond.',
}

export default function TemplatesPage() {
  return (
    <>
      <main className="mx-auto max-w-7xl px-6 lg:px-8 pt-16 pb-8 lg:pt-24 lg:pb-12">
        <TemplateShowcase
          header={
            <ScrollReveal className="max-w-2xl">
              <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl leading-[1.08]">
                Nos <VzHighlight>templates</VzHighlight>
              </h1>
              <p className="mt-4 text-lg text-muted leading-relaxed">
                Chaque template a sa propre personnalité. Choisis celui qui te ressemble,
                personnalise les couleurs et la typo, et publie ton portfolio.
              </p>
            </ScrollReveal>
          }
        />
      </main>
      <CTASectionTemplates />
    </>
  )
}
