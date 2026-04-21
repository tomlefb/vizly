import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { FAQAccordion } from '@/components/marketing/FAQAccordion'
import { VzHighlight } from '@/components/ui/vizly'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Questions fréquentes sur Vizly · création de portfolios en ligne.',
  alternates: {
    canonical: '/legal/faq',
  },
}

// Structure des items FAQ lus depuis les messages i18n, répliquée ici pour le
// JSON-LD (FAQAccordion lit les mêmes clés côté client).
interface FaqItem {
  q: string
  a: string
  section?: string
}

export default async function FAQPage() {
  const t = await getTranslations('legal.faq')
  const tFaq = await getTranslations('faq')
  const items = tFaq.raw('items') as FaqItem[]

  // FAQPage schema — Google peut afficher les Q/R directement dans la SERP
  // (rich snippet "Autres questions"), ce qui améliore le CTR sur les
  // requêtes longues. On convertit les items i18n sans mise en forme pour
  // garder la cohérence avec l'accordéon affiché.
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://www.vizly.fr' },
      { '@type': 'ListItem', position: 2, name: 'FAQ', item: 'https://www.vizly.fr/legal/faq' },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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
