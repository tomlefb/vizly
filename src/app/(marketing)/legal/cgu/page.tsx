import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Section } from '@/components/legal/Section'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description: "CGU de la plateforme Vizly · création de portfolios en ligne.",
}

export default async function CGUPage() {
  const t = await getTranslations('legal.cgu')
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

      <Section title={t('objet.title')}>
        {t('objet.body')}
      </Section>

      <Section title={t('editeur.title')}>
        {t('editeur.body', {
          name: tShared('editor.name'),
          status: tShared('editor.status'),
          siren: tShared('editor.siren'),
          city: tShared('editor.city'),
        })}
        {' '}
        {t('editeur.contactLabel')}{' '}
        <a href={`mailto:${email}`} className="text-accent-deep hover:underline">{email}</a>.
      </Section>

      <Section title={t('inscription.title')}>
        {t('inscription.body')}
      </Section>

      <Section title={t('service.title')}>
        {t('service.body')}
      </Section>

      <Section title={t('retractation.title')}>
        {t('retractation.body')}
        {' '}
        {t('retractation.contactPrompt')}{' '}
        <a href={`mailto:${email}`} className="text-accent-deep hover:underline">{email}</a>.
      </Section>

      <Section title={t('propriete.title')}>
        {t('propriete.body')}
      </Section>

      <Section title={t('responsabilite.title')}>
        {t('responsabilite.body')}
      </Section>

      <Section title={t('resiliation.title')}>
        {t('resiliation.body')}
      </Section>

      <Section title={t('modifications.title')}>
        {t('modifications.body')}
      </Section>

      <Section title={t('droitApplicable.title')}>
        {t('droitApplicable.body')}
      </Section>
    </article>
  )
}
