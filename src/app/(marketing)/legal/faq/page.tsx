import type { Metadata } from 'next'
import { FAQAccordion } from '@/components/marketing/FAQAccordion'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Questions frequentes sur Vizly · creation de portfolios en ligne.',
}

export default function FAQPage() {
  return (
    <>
      <div className="mb-12">
        <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl">
          Questions frequentes
        </h1>
        <p className="mt-4 text-lg text-muted leading-relaxed">
          Tout ce que tu dois savoir sur Vizly.
        </p>
      </div>
      <FAQAccordion />
    </>
  )
}
