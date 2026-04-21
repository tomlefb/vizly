import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { CTASectionFonctionnalites } from '@/components/marketing/CTASection'
import { ScrollReveal, StaggerItem } from '@/components/shared/ScrollReveal'
import { ProfileMockup } from '@/components/marketing/features/ProfileMockup'
import { KpiMockup } from '@/components/marketing/features/KpiMockup'
import { DesignMockup } from '@/components/marketing/features/DesignMockup'
import { PublishMockup } from '@/components/marketing/features/PublishMockup'
import { FeaturesStepperPreview } from '@/components/marketing/features/FeaturesStepperPreview'
import { VzHighlight } from '@/components/ui/vizly'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('fonctionnalites')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

const DETAIL_KEYS = ['autosave', 'preview', 'validation', 'premium'] as const

export default async function FonctionnalitesPage() {
  const t = await getTranslations('fonctionnalites')

  return (
    <main>
        {/* ── Section 1 — Hero ── */}
        <section className="pt-12 pb-4 sm:pt-16 lg:pt-24 lg:pb-8">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <ScrollReveal className="max-w-2xl">
                <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl leading-[1.08]">
                  {t('hero.titleStart')}{' '}
                  <VzHighlight>{t('hero.titleAccent')}</VzHighlight>{t('hero.titleEnd')}
                </h1>
                <p className="mt-5 text-lg text-muted leading-relaxed max-w-xl">
                  {t('hero.description')}
                </p>
              </ScrollReveal>
              <ScrollReveal className="flex-1 flex justify-center shrink-0" delay={0.15}>
                <FeaturesStepperPreview />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Étape 1 — Profil ── */}
        <section className="py-10 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <ScrollReveal margin="0% 0px">
                <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl leading-[1.1]">
                  {t('step1.titleStart')} <VzHighlight>{t('step1.titleAccent')}</VzHighlight>{t('step1.titleEnd')}
                </h2>
                <p className="mt-4 text-muted leading-relaxed">
                  {t('step1.description')}
                </p>
              </ScrollReveal>
              <ScrollReveal className="max-w-xl mx-auto lg:mx-0" margin="0% 0px" delay={0.15}>
                <ProfileMockup />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Étape 2 — Contenu ── */}
        <section className="py-10 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <ScrollReveal className="max-w-xl mx-auto lg:mx-0 order-2 lg:order-1" margin="0% 0px" delay={0.15}>
                <KpiMockup />
              </ScrollReveal>
              <ScrollReveal className="order-1 lg:order-2" margin="0% 0px">
                <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl leading-[1.1]">
                  {t('step2.titleStart')} <VzHighlight>{t('step2.titleAccent')}</VzHighlight>{t('step2.titleEnd')}
                </h2>
                <p className="mt-4 text-muted leading-relaxed">
                  {t('step2.description')}
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Étape 3 — Design ── */}
        <section className="py-10 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <ScrollReveal margin="0% 0px">
                <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl leading-[1.1]">
                  {t('step3.titleStart')} <VzHighlight>{t('step3.titleAccent')}</VzHighlight>{t('step3.titleEnd')}
                </h2>
                <p className="mt-4 text-muted leading-relaxed">
                  {t('step3.description')}
                </p>
              </ScrollReveal>
              <ScrollReveal className="max-w-xl mx-auto lg:mx-0" margin="0% 0px" delay={0.15}>
                <DesignMockup />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Étape 4 — Publication ── */}
        <section className="py-10 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <ScrollReveal className="max-w-xl mx-auto lg:mx-0 order-2 lg:order-1" margin="0% 0px" delay={0.15}>
                <PublishMockup />
              </ScrollReveal>
              <ScrollReveal className="order-1 lg:order-2" margin="0% 0px">
                <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl leading-[1.1]">
                  {t('step4.titleStart')} <VzHighlight>{t('step4.titleAccent')}</VzHighlight>{t('step4.titleEnd')}
                </h2>
                <p className="mt-4 text-muted leading-relaxed">
                  {t('step4.description')}
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Détails ── */}
        <section className="py-10 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <ScrollReveal className="mb-8 lg:mb-10">
              <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl leading-[1.1]">
                {t('detailsTitle.start')} <VzHighlight>{t('detailsTitle.accent')}</VzHighlight>{t('detailsTitle.end')}
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12">
              {DETAIL_KEYS.map((key, i) => (
                <StaggerItem key={key} index={i}>
                  <h3 className="text-[15px] font-semibold text-foreground mb-1.5">
                    {t(`details.${key}Title`)}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">{t(`details.${key}Description`)}</p>
                </StaggerItem>
              ))}
            </div>
          </div>
        </section>

        <CTASectionFonctionnalites />
    </main>
  )
}
