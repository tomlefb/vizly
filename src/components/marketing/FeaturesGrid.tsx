import { getTranslations } from 'next-intl/server'
import { ScrollReveal } from '@/components/shared/ScrollReveal'

const FEATURE_KEYS = ['live', 'form', 'templates', 'customizable', 'unlimited'] as const

export async function FeaturesGrid() {
  const t = await getTranslations('socialProof')
  const ft = await getTranslations('features')

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* Header -- matching pricing pattern */}
        <ScrollReveal className="mb-10 lg:mb-14">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
            <h2 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl shrink-0">
              <span className="text-accent">{ft('titleAccent')}</span> {ft('titleEnd')}
            </h2>
            <p className="text-sm text-muted sm:text-base sm:pb-1 leading-snug">
              {ft('subtitle')}
            </p>
          </div>
        </ScrollReveal>

        {/* Features text grid */}
        <div className="grid grid-cols-2 md:grid-cols-5">
          {FEATURE_KEYS.map((key, i) => (
            <div
              key={key}
              className={`py-4 md:py-0 md:px-5 lg:px-6 ${
                i > 0 ? 'md:border-l-[0.5px] md:border-border' : ''
              } ${i % 2 !== 0 ? 'max-md:border-l-[0.5px] max-md:border-border' : ''
              } ${i >= 2 ? 'max-md:border-t-[0.5px] max-md:border-border' : ''}`}
            >
              <p className="text-[15px] font-semibold text-foreground tracking-wide">
                {t(`features.${key}.title`)}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
                {t(`features.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
