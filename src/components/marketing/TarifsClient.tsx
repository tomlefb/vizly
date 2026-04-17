'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Pricing, type BillingInterval } from '@/components/marketing/Pricing'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { VzHighlight } from '@/components/ui/vizly'
import { SubscriptionCheckoutModal } from '@/components/billing/SubscriptionCheckoutModal'
import { changeSubscriptionPlanAction } from '@/actions/billing'

interface TarifsClientProps {
  isAuthenticated: boolean
  currentPlan: 'free' | 'starter' | 'pro'
}

export function TarifsClient({ isAuthenticated, currentPlan }: TarifsClientProps) {
  const t = useTranslations('pricing')
  const router = useRouter()
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const [modalPlan, setModalPlan] = useState<'starter' | 'pro' | null>(null)
  const [feedback, setFeedback] = useState<
    | { kind: 'success'; message: string }
    | { kind: 'error'; message: string }
    | null
  >(null)

  const handlePlanClick = useCallback(
    async (planId: 'free' | 'starter' | 'pro') => {
      if (planId === 'free') {
        if (!isAuthenticated) {
          router.push('/register')
        }
        return
      }

      if (!isAuthenticated) {
        router.push(`/register?plan=${planId}&interval=${interval}`)
        return
      }

      if (currentPlan === planId) {
        return
      }

      if (currentPlan === 'free') {
        setModalPlan(planId)
        return
      }

      setFeedback(null)
      const result = await changeSubscriptionPlanAction({
        plan: planId,
        interval,
      })

      if (!result.ok) {
        setFeedback({ kind: 'error', message: result.error })
        return
      }

      setFeedback({ kind: 'success', message: result.message })
      router.refresh()
    },
    [isAuthenticated, currentPlan, interval, router],
  )

  return (
    <>
      {/* ── Hero ── */}
      <section className="pt-16 pb-4 lg:pt-24 lg:pb-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
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

      {/* Inline feedback after a direct plan change */}
      {feedback && (
        <div className="mx-auto max-w-7xl px-6 lg:px-8 -mt-4 mb-4">
          <p
            className={cn(
              'text-sm',
              feedback.kind === 'success' ? 'text-foreground' : 'text-destructive',
            )}
            role={feedback.kind === 'error' ? 'alert' : undefined}
          >
            {feedback.message}
          </p>
        </div>
      )}

      {/* ── Pricing cards ── */}
      <Pricing
        interval={interval}
        onIntervalChange={setInterval}
        showHeader={false}
        onPlanClick={(planId) => void handlePlanClick(planId)}
      />

      {modalPlan && (
        <SubscriptionCheckoutModal
          open={modalPlan !== null}
          onClose={() => setModalPlan(null)}
          plan={modalPlan}
          interval={interval}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  )
}
