import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ReportForm } from '@/components/marketing/ReportForm'
import { VzHighlight } from '@/components/ui/vizly'

export const metadata: Metadata = {
  title: 'Signaler un contenu',
  description:
    'Signaler un contenu illicite ou une violation de droits sur un portfolio hébergé par Vizly.',
  robots: { index: true, follow: true },
}

export default async function SignalementPage() {
  const t = await getTranslations('legal.signalement')

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight leading-[1.1]">
          <VzHighlight>{t('title')}</VzHighlight>
        </h1>
        <p className="mt-4 text-sm text-muted leading-relaxed">
          {t('subtitle')}
        </p>
      </div>
      <ReportForm />
    </div>
  )
}
