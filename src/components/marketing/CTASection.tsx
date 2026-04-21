import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { VzHighlight } from '@/components/ui/vizly'

export interface CTASectionProps {
  figure: string
  unit: string
  /**
   * Desktop figure size:
   * - 'simple' (default) = 240px — for single-char numerics like "5", "3", "24"
   * - 'wide' = 200px — for figures that include a symbol/suffix like "0€", "2k+"
   * Mobile is always 140px regardless.
   */
  figureSize?: 'simple' | 'wide'
  titleRich: ReactNode
  description: string
  primaryCTA: { label: string; href: string }
  secondaryCTA: { label: string; href: string }
}

export function CTASection({
  figure,
  unit,
  figureSize = 'simple',
  titleRich,
  description,
  primaryCTA,
  secondaryCTA,
}: CTASectionProps) {
  const figureSizeClass =
    figureSize === 'wide'
      ? 'text-[96px] sm:text-[140px] lg:text-[200px]'
      : 'text-[96px] sm:text-[140px] lg:text-[240px]'

  return (
    <section className="pt-12 pb-10 sm:pt-16 sm:pb-12 lg:pt-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="rounded-[var(--radius-xl)] bg-foreground px-5 py-8 sm:px-6 sm:py-10 lg:px-12 lg:py-16">
            <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-center lg:gap-12">
              <div>
                <h2 className="font-[family-name:var(--font-satoshi)] text-4xl font-extrabold tracking-tight text-white leading-[0.95] sm:text-5xl lg:text-6xl">
                  {titleRich}
                </h2>
                <p className="mt-6 max-w-md text-base leading-relaxed text-foreground-muted">
                  {description}
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href={primaryCTA.href}
                    className="group inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-[22px] py-3.5 font-[family-name:var(--font-satoshi)] text-[15px] font-semibold text-foreground shadow-[3px_3px_0_var(--color-surface)] transition-all duration-150 hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--color-surface)]"
                  >
                    {primaryCTA.label}
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      strokeWidth={1.5}
                    />
                  </Link>
                  <Link
                    href={secondaryCTA.href}
                    className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-white/30 bg-transparent px-[22px] py-3.5 font-[family-name:var(--font-satoshi)] text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-white/5"
                  >
                    {secondaryCTA.label}
                  </Link>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center lg:items-end">
                <span
                  className={`block font-[family-name:var(--font-satoshi)] font-black text-accent leading-[0.8] tracking-[-0.08em] ${figureSizeClass}`}
                >
                  {figure}
                </span>
                <span className="mt-3 font-mono text-xs font-bold uppercase tracking-widest text-white lg:text-sm">
                  {unit}
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// -------------------------------------------------------------------
// Variant wrappers — async server components that read i18n + supply
// brand-specific figures and hrefs. Drop-in ready for each page.
// -------------------------------------------------------------------

const highlight = (chunks: ReactNode) => (
  <VzHighlight className="text-foreground">{chunks}</VzHighlight>
)

export async function CTASectionLanding() {
  const t = await getTranslations('cta.landing')
  return (
    <CTASection
      figure="5"
      figureSize="simple"
      unit={t('unit')}
      titleRich={t.rich('title', { highlight })}
      description={t('description')}
      primaryCTA={{ label: t('primary'), href: '/register' }}
      secondaryCTA={{ label: t('secondary'), href: '/tarifs' }}
    />
  )
}

export async function CTASectionTarifs() {
  const t = await getTranslations('cta.tarifs')
  return (
    <CTASection
      figure="0€"
      figureSize="wide"
      unit={t('unit')}
      titleRich={t.rich('title', { highlight })}
      description={t('description')}
      primaryCTA={{ label: t('primary'), href: '/register' }}
      secondaryCTA={{ label: t('secondary'), href: '/fonctionnalites' }}
    />
  )
}

export async function CTASectionFonctionnalites() {
  const t = await getTranslations('cta.fonctionnalites')
  return (
    <CTASection
      figure="4"
      figureSize="simple"
      unit={t('unit')}
      titleRich={t.rich('title', { highlight })}
      description={t('description')}
      primaryCTA={{ label: t('primary'), href: '/register' }}
      secondaryCTA={{ label: t('secondary'), href: '/tarifs' }}
    />
  )
}

export async function CTASectionTemplates() {
  const t = await getTranslations('cta.templates')
  return (
    <CTASection
      figure="8"
      figureSize="simple"
      unit={t('unit')}
      titleRich={t.rich('title', { highlight })}
      description={t('description')}
      primaryCTA={{ label: t('primary'), href: '/register' }}
      secondaryCTA={{ label: t('secondary'), href: '/tarifs' }}
    />
  )
}

export async function CTASectionTemplateDetail() {
  const t = await getTranslations('cta.templateDetail')
  return (
    <CTASection
      figure="8"
      figureSize="simple"
      unit={t('unit')}
      titleRich={t.rich('title', { highlight })}
      description={t('description')}
      primaryCTA={{ label: t('primary'), href: '/register' }}
      secondaryCTA={{ label: t('secondary'), href: '/templates' }}
    />
  )
}
