'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { PricingSection } from '@/components/marketing/PricingSection'
import { type BillingInterval } from '@/components/marketing/Pricing'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { VzHighlight } from '@/components/ui/vizly'

interface TarifsClientProps {
  isAuthenticated: boolean
  currentPlan: 'free' | 'starter' | 'pro'
}

export function TarifsClient({ isAuthenticated, currentPlan }: TarifsClientProps) {
  const t = useTranslations('pricing')
  const [interval, setInterval] = useState<BillingInterval>('monthly')

  return (
    <>
      {/* ── Hero ── */}
      <section className="pt-12 pb-4 sm:pt-16 lg:pt-24 lg:pb-8">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <ScrollReveal className="max-w-2xl">
              <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl leading-[1.08]">
                {t('title')} <VzHighlight>{t('titleAccent')}</VzHighlight>
              </h1>
              <p className="mt-5 text-lg text-muted leading-relaxed max-w-xl">
                {t('subtitle')}
              </p>
            </ScrollReveal>

            <ScrollReveal className="shrink-0" delay={0.15}>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-full bg-surface-sunken p-1 text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => setInterval('monthly')}
                    className={cn(
                      'rounded-full px-4 py-2 transition-colors duration-150',
                      interval === 'monthly'
                        ? 'bg-surface border border-border-light text-foreground'
                        : 'text-muted hover:text-foreground'
                    )}
                  >
                    {t('monthly')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterval('yearly')}
                    className={cn(
                      'rounded-full px-4 py-2 transition-colors duration-150',
                      interval === 'yearly'
                        ? 'bg-surface border border-border-light text-foreground'
                        : 'text-muted hover:text-foreground'
                    )}
                  >
                    {t('yearly')}
                  </button>
                </div>
                {interval === 'yearly' && (
                  <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-fg">
                    {t('yearlyDiscount')}
                  </span>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <PricingSection
        isAuthenticated={isAuthenticated}
        currentPlan={currentPlan}
        showHeader={false}
        interval={interval}
        onIntervalChange={setInterval}
      />
    </>
  )
}
