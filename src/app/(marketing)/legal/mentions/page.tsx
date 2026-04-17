import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Section } from '@/components/legal/Section'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales du site vizly.fr.',
}

export default async function MentionsLegalesPage() {
  const t = await getTranslations('legal.mentions')
  const tShared = await getTranslations('legal.shared')
  const email = tShared('editor.email')

  return (
    <article className="prose-legal">
      <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight mb-2">
        {t('title')}
      </h1>
      <p className="text-sm text-muted mb-10">
        {tShared('updatedAtLabel')} : {tShared('updatedAt')}
      </p>

      <Section title={t('editorSite.title')}>
        <strong>{t('editorSite.brand')}</strong> — {tShared('domain')}
        <br />
        {tShared('editor.name')}, {tShared('editor.status')}
        <br />
        {t('editorSite.sirenLabel')} : {tShared('editor.siren')} — {t('editorSite.siretLabel')} : {tShared('editor.siret')}
        <br />
        {t('editorSite.codeApeLabel')} : {tShared('editor.codeApe')}
        <br />
        {tShared('editor.city')}
        <br />
        {t('editorSite.emailLabel')}{' '}
        <a href={`mailto:${email}`} className="text-accent-deep hover:underline">{email}</a>
      </Section>

      <Section title={t('host.title')}>
        <strong>{t('host.name')}</strong>
        <br />
        {t('host.address')}
        <br />
        {t('host.siteLabel')}{' '}
        <a
          href={t('host.url')}
          className="text-accent-deep hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('host.website')}
        </a>
      </Section>

      <Section title={t('database.title')}>
        <strong>{t('database.name')}</strong>
        <br />
        {t('database.location')}
      </Section>

      <Section title={t('payment.title')}>
        {t('payment.body')}
      </Section>

      <Section title={t('ipRights.title')}>
        {t('ipRights.body')}
      </Section>

      <Section title={t('contactSection.title')}>
        {t('contactSection.prompt')}{' '}
        <a href={`mailto:${email}`} className="text-accent-deep hover:underline">{email}</a>
      </Section>
    </article>
  )
}
