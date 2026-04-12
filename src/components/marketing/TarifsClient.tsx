'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Pricing, type BillingInterval } from '@/components/marketing/Pricing'
import { ScrollReveal } from '@/components/shared/ScrollReveal'

export function TarifsClient() {
  const t = useTranslations('pricing')
  const [interval, setInterval] = useState<BillingInterval>('monthly')

  return (
    <>
      {/* ── Hero ── */}
      <section className="pt-16 pb-4 lg:pt-24 lg:pb-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <ScrollReveal className="max-w-2xl">
              <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {t('title')} <span className="text-accent">{t('titleAccent')}</span>
              </h1>
              <p className="mt-5 text-lg text-muted leading-relaxed max-w-xl">
                {t('subtitle')}
              </p>
            </ScrollReveal>

            <ScrollReveal className="shrink-0" delay={0.15}>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-full bg-[#f4f4f4] p-1 text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => setInterval('monthly')}
                    className={cn(
                      'rounded-full px-4 py-2 transition-colors duration-150',
                      interval === 'monthly'
                        ? 'bg-white border border-border text-foreground'
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
                        ? 'bg-white border border-border text-foreground'
                        : 'text-muted hover:text-foreground'
                    )}
                  >
                    {t('yearly')}
                  </button>
                </div>
                {interval === 'yearly' && (
                  <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                    {t('yearlyDiscount')}
                  </span>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Pricing cards ── */}
      <Pricing
        interval={interval}
        onIntervalChange={setInterval}
        showHeader={false}
      />
    </>
  )
}
