import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { VzHighlight, vzBtnClasses } from '@/components/ui/vizly'

interface CTAProps {
  title?: string
  titleAccent?: string
  suffix?: string
  description?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export async function CTA(props: CTAProps = {}) {
  const t = await getTranslations('cta')

  const title = props.title ?? t('title')
  const titleAccent = props.titleAccent ?? t('titleAccent')
  const suffix = props.suffix ?? '\u00a0?'
  const description = props.description ?? t('description')
  const primaryLabel = props.primaryLabel ?? t('primary')
  const primaryHref = props.primaryHref ?? '/register'
  const secondaryLabel = props.secondaryLabel ?? t('secondary')
  const secondaryHref = props.secondaryHref ?? '/tarifs'

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border-light bg-surface px-8 py-16 sm:px-16 sm:py-20 lg:px-24 lg:py-24">
            <div className="relative z-10 max-w-2xl">
              <h2 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.08]">
                {title}{' '}
                <VzHighlight>{titleAccent}</VzHighlight>
                {suffix}
              </h2>

              <p className="mt-6 text-lg text-muted leading-relaxed max-w-lg">
                {description}
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href={primaryHref}
                  className={vzBtnClasses({
                    variant: 'primary',
                    size: 'lg',
                    className: 'group',
                  })}
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href={secondaryHref}
                  className={vzBtnClasses({
                    variant: 'secondary',
                    size: 'lg',
                  })}
                >
                  {secondaryLabel}
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
