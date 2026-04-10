import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export async function CTA() {
  const t = await getTranslations('cta')

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-foreground px-8 py-16 sm:px-16 sm:py-20 lg:px-24 lg:py-24">
          {/* Background accent shape */}
          <div
            className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/10 blur-3xl -translate-y-1/2 translate-x-1/3"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-accent/5 blur-3xl translate-y-1/2 -translate-x-1/3"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-2xl">
            <h2 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight text-background sm:text-4xl lg:text-5xl">
              {t('title')}{' '}
              <span className="text-accent">{t('titleAccent')}</span>&nbsp;?
            </h2>

            <p className="mt-5 text-lg text-background/60 leading-relaxed max-w-lg">
              {t('description')}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-hover hover:gap-3"
              >
                {t('primary')}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/#pricing"
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-background/20 px-7 py-3.5 text-sm font-semibold text-background/80 transition-colors duration-200 hover:bg-background/5 hover:text-background"
              >
                {t('secondary')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
