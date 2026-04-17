import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ContactForm } from '@/components/marketing/ContactForm'
import { VzHighlight } from '@/components/ui/vizly'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contacte l\'équipe Vizly · on répond sous 24 heures.',
}

export default async function ContactPage() {
  const t = await getTranslations('legal.contact')

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight leading-[1.1]">
          <VzHighlight>{t('title')}</VzHighlight>
        </h1>
        <p className="mt-4 text-muted">
          {t('subtitle')}
        </p>
      </div>
      <ContactForm />
    </div>
  )
}
