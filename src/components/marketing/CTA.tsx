import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { VzHighlight } from '@/components/ui/vizly'

interface CTAProps {
  title?: string
  titleAccent?: string
  suffix?: string
  description?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string | null
  secondaryHref?: string | null
}

export async function CTA(props: CTAProps = {}) {
  const t = await getTranslations('cta')

  const title = props.title ?? t('title')
  const titleAccent = props.titleAccent ?? t('titleAccent')
  const suffix = props.suffix ?? '\u00a0?'
  const description = props.description ?? t('description')
  const primaryLabel = props.primaryLabel ?? t('primary')
  const primaryHref = props.primaryHref ?? '/register'
  const secondaryLabel =
    props.secondaryLabel === null ? null : props.secondaryLabel ?? t('secondary')
  const secondaryHref =
    props.secondaryHref === null ? null : props.secondaryHref ?? '/tarifs'
  const showSecondary = secondaryLabel !== null && secondaryHref !== null

  return (
    <section className="pt-16 pb-12 lg:pt-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <div className="rounded-[var(--radius-xl)] bg-foreground px-6 py-16 lg:px-10 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl leading-[1.08]">
                {title}{' '}
                <VzHighlight className="text-foreground">{titleAccent}</VzHighlight>
                {suffix}
              </h2>

              <p className="mt-6 text-lg text-foreground-muted leading-relaxed">
                {description}
              </p>

              <div className="mt-10 flex flex-wrap gap-4 justify-center">
                <Link
                  href={primaryHref}
                  className="group inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-[22px] py-3.5 text-[15px] font-semibold text-foreground font-[family-name:var(--font-satoshi)] shadow-[3px_3px_0_var(--color-surface)] transition-all duration-150 hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--color-surface)]"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                {showSecondary && (
                  <Link
                    href={secondaryHref}
                    className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-white bg-transparent px-[22px] py-3.5 text-[15px] font-semibold text-white font-[family-name:var(--font-satoshi)] transition-colors duration-150 hover:bg-white/5"
                  >
                    {secondaryLabel}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
