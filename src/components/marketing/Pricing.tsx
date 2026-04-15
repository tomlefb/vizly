'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { ScrollReveal, StaggerItem } from '@/components/shared/ScrollReveal'

export type BillingInterval = 'monthly' | 'yearly'

interface PlanFeature {
  labelKey: string
  included: boolean
}

interface PlanData {
  id: 'free' | 'starter' | 'pro'
  monthlyPrice: string
  yearlyMonthlyPrice: string
  yearlyTotalPrice: string
  features: PlanFeature[]
  featured: boolean
}

const plansData: PlanData[] = [
  {
    id: 'free',
    monthlyPrice: '0',
    yearlyMonthlyPrice: '0',
    yearlyTotalPrice: '0',
    features: [
      { labelKey: 'unlimitedProjects', included: true },
      { labelKey: 'freeTemplates', included: true },
      { labelKey: 'fullPreview', included: true },
      { labelKey: 'onlinePublish', included: false },
      { labelKey: 'customDomain', included: false },
      { labelKey: 'analytics', included: false },
    ],
    featured: false,
  },
  {
    id: 'starter',
    monthlyPrice: '4,99',
    yearlyMonthlyPrice: '4,24',
    yearlyTotalPrice: '50,88',
    features: [
      { labelKey: 'allFree', included: true },
      { labelKey: 'oneOnline', included: true },
      { labelKey: 'vizlyBadge', included: true },
      { labelKey: 'customDomain', included: false },
      { labelKey: 'analytics', included: false },
      { labelKey: 'contactForm', included: false },
    ],
    featured: true,
  },
  {
    id: 'pro',
    monthlyPrice: '9,99',
    yearlyMonthlyPrice: '8,49',
    yearlyTotalPrice: '101,88',
    features: [
      { labelKey: 'allStarter', included: true },
      { labelKey: 'noBadge', included: true },
      { labelKey: 'unlimitedOnline', included: true },
      { labelKey: 'customDomain', included: true },
      { labelKey: 'analyticsStats', included: true },
      { labelKey: 'contactForm', included: true },
      { labelKey: 'prioritySupport', included: true },
    ],
    featured: false,
  },
]

interface PricingProps {
  interval?: BillingInterval
  onIntervalChange?: (interval: BillingInterval) => void
  showHeader?: boolean
  /**
   * Called when the user clicks one of the 3 plan CTAs. The parent
   * (TarifsClient) decides what to do based on auth state:
   *   - anonymous → router.push('/register?plan=...&interval=...')
   *   - authenticated free user → open SubscriptionCheckoutModal
   *   - authenticated paid user → call changeSubscriptionPlanAction
   *
   * If `onPlanClick` is not provided, the buttons fall back to the
   * legacy anonymous-only behavior of pushing to /register (handled
   * inside the component via useRouter).
   */
  onPlanClick?: (planId: 'free' | 'starter' | 'pro') => void
}

export function Pricing({
  interval: controlledInterval,
  onIntervalChange,
  showHeader = true,
  onPlanClick,
}: PricingProps = {}) {
  const t = useTranslations('pricing')
  const [localInterval, setLocalInterval] = useState<BillingInterval>('monthly')
  const interval = controlledInterval ?? localInterval
  const setInterval = onIntervalChange ?? setLocalInterval

  return (
    <section id="pricing" className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        {showHeader && (
          <ScrollReveal className="mb-10 lg:mb-14">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
              <h2 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl shrink-0">
                {t('title')} <span className="text-accent">{t('titleAccent')}</span>
              </h2>
              <p className="text-sm text-muted sm:text-base sm:pb-1 leading-snug">
                {t('subtitle')}
              </p>
            </div>

            {/* Billing interval toggle */}
            <div className="mt-8 flex items-center gap-3">
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
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {plansData.map((plan, i) => {
            const isFree = plan.monthlyPrice === '0'
            const price =
              interval === 'yearly' ? plan.yearlyMonthlyPrice : plan.monthlyPrice

            return (
              <StaggerItem
                key={plan.id}
                index={i}
                className={cn(
                  'relative rounded-[var(--radius-lg)] flex flex-col p-7 lg:p-8',
                  plan.featured
                    ? 'border-[1.5px] border-accent md:-translate-y-2'
                    : 'border-[0.5px] border-border'
                )}
              >
                {/* Popular badge */}
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      {t('popular')}
                    </span>
                  </div>
                )}

                {/* Plan name + description */}
                <h3 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold">
                  {t(`plans.${plan.id}.name`)}
                </h3>
                <p className="mt-1 text-sm text-muted">{t(`plans.${plan.id}.description`)}</p>

                {/* Price */}
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-[family-name:var(--font-satoshi)] text-4xl font-bold tracking-tight">
                    {price}
                  </span>
                  <span className="text-lg font-medium text-foreground">€</span>
                  {!isFree && (
                    <span className="text-sm text-muted ml-0.5">{t('perMonth')}</span>
                  )}
                </div>

                {/* Yearly sub-price line */}
                <div className="h-5 mt-1">
                  {interval === 'yearly' && !isFree && (
                    <p className="text-xs font-medium text-accent">
                      {t('perYear', { price: plan.yearlyTotalPrice })}
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="my-6 border-t border-border" />

                {/* Features */}
                <ul className="space-y-3 flex-1" role="list">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.labelKey}
                      className="flex items-center gap-3 text-sm"
                    >
                      {feature.included ? (
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0',
                            feature.labelKey === 'vizlyBadge'
                              ? 'text-muted-foreground/40'
                              : 'text-success'
                          )}
                          strokeWidth={2.5}
                        />
                      ) : (
                        <X
                          className="h-4 w-4 shrink-0 text-muted-foreground/40"
                          strokeWidth={2}
                        />
                      )}
                      <span
                        className={cn(
                          feature.included
                            ? 'text-foreground'
                            : 'text-muted-foreground/50',
                          feature.labelKey === 'noBadge' && 'font-semibold'
                        )}
                      >
                        {t(`features.${feature.labelKey}`)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  type="button"
                  onClick={() => onPlanClick?.(plan.id)}
                  className={cn(
                    'mt-8 block w-full text-center rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold transition-colors duration-150',
                    plan.featured
                      ? 'bg-accent text-white hover:bg-accent-hover'
                      : 'border border-border text-foreground hover:bg-surface-warm'
                  )}
                >
                  {t(`plans.${plan.id}.cta`)}
                </button>
              </StaggerItem>
            )
          })}
        </div>

        {/* Note */}
        <p className="text-xs text-muted-foreground mt-8 text-center">
          {t('note')}
        </p>
      </div>
    </section>
  )
}
