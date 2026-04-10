import { getTranslations } from 'next-intl/server'

/* ------------------------------------------------------------------ */
/*  Keys for stats and features                                        */
/* ------------------------------------------------------------------ */

const STAT_KEYS = ['portfolios', 'time', 'templates', 'price'] as const

const FEATURE_KEYS = ['live', 'form', 'templates', 'customizable', 'unlimited'] as const

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export async function SocialProof() {
  const t = await getTranslations('socialProof')

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* ── Stats row ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4">
          {STAT_KEYS.map((key, i) => (
            <div
              key={key}
              className={`py-6 md:py-0 md:px-8 ${
                i > 0 ? 'border-l-[0.5px] border-border' : ''
              } ${i >= 2 ? 'max-md:border-t-[0.5px] max-md:border-border' : ''} ${
                i === 2 ? 'max-md:border-l-0' : ''
              }`}
            >
              <p className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {t(`stats.${key}.value`)}
                <span className="text-accent">{t(`stats.${key}.suffix`)}</span>
              </p>
              <p className="mt-1.5 text-sm text-muted leading-snug">
                {t(`stats.${key}.label`)}
              </p>
            </div>
          ))}
        </div>

        {/* ── Divider ───────────────────────────────────────────── */}
        <div className="border-t border-border mt-12 lg:mt-16" />

        {/* ── Features text grid ────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 mt-10 lg:mt-12">
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
