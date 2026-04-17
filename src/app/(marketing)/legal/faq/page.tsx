import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { FAQAccordion } from '@/components/marketing/FAQAccordion'
import { VzHighlight } from '@/components/ui/vizly'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Questions fréquentes sur Vizly · création de portfolios en ligne.',
}

export default async function FAQPage() {
  const t = await getTranslations('legal.faq')

  return (
    <>
      <div className="mb-12">
        <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl leading-[1.08]">
          Questions <VzHighlight>fréquentes</VzHighlight>
        </h1>
        <p className="mt-4 text-lg text-muted leading-relaxed">
          {t('subtitle')}
        </p>
      </div>
      <FAQAccordion />
    </>
  )
}
