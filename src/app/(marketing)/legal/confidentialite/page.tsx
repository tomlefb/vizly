import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Section } from '@/components/legal/Section'
import type { RgpdRight } from '@/types/legal'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité de Vizly · comment nous protégeons vos données.',
}

export default async function ConfidentialitePage() {
  const t = await getTranslations('legal.confidentialite')
  const tShared = await getTranslations('legal.shared')
  const email = tShared('editor.email')

  const collectedItems = t.raw('donneesCollectees.items') as string[]
  const finaliteItems = t.raw('finalite.items') as string[]
  const rgpdRights = t.raw('rgpd.rights') as RgpdRight[]

  return (
    <article className="prose-legal">
      <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight mb-2">
        {t('title')}
      </h1>
      <p className="text-sm text-muted mb-10">
        {tShared('updatedAtLabel')} : {tShared('updatedAt')}
      </p>

      <Section title={t('responsable.title')}>
        {t('responsable.identity', {
          name: tShared('editor.name'),
          status: tShared('editor.status'),
        })}
        <br />
        {t('responsable.sirenCity', {
          siren: tShared('editor.siren'),
          city: tShared('editor.city'),
        })}
        <br />
        {t('responsable.contactLabel')}{' '}
        <a href={`mailto:${email}`} className="text-accent-deep hover:underline">{email}</a>
      </Section>

      <Section title={t('donneesCollectees.title')}>
        {t('donneesCollectees.intro')}
        <ul className="mt-2 list-disc list-inside space-y-1">
          {collectedItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title={t('finalite.title')}>
        {t('finalite.intro')}
        <ul className="mt-2 list-disc list-inside space-y-1">
          {finaliteItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title={t('stockage.title')}>
        {t('stockage.body')}
      </Section>

      <Section title={t('partage.title')}>
        {t('partage.body')}
      </Section>

      <Section title={t('cookies.title')}>
        {t('cookies.body')}
      </Section>

      <Section title={t('rgpd.title')}>
        {t('rgpd.intro')}
        <ul className="mt-2 list-disc list-inside space-y-1">
          {rgpdRights.map((right) => (
            <li key={right.label}>
              <strong>{right.label}</strong> : {right.description}
            </li>
          ))}
        </ul>
        <p className="mt-2">
          {t('rgpd.contactPrompt')}{' '}
          <a href={`mailto:${email}`} className="text-accent-deep hover:underline">{email}</a>.
          {' '}
          {t('rgpd.contactSuffix')}
        </p>
      </Section>

      <Section title={t('contactSection.title')}>
        {t('contactSection.prompt')}{' '}
        <a href={`mailto:${email}`} className="text-accent-deep hover:underline">{email}</a>
      </Section>
    </article>
  )
}
