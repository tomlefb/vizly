'use client'

// =============================================================================
// PricingSection — Pricing cards + full plan-click flow (landing + /tarifs)
// =============================================================================
//
// Wraps <Pricing> with the shared plan-click logic used on both the marketing
// landing page and the /tarifs page :
//   - not authenticated : redirect to /register (preserving plan+interval for
//     the post-signup auto-open modal in /dashboard).
//   - authenticated + free plan CTA : redirect to /dashboard.
//   - authenticated + free → starter/pro : open SubscriptionCheckoutModal.
//   - authenticated + paid → different paid plan : call change-plan server
//     action and show inline feedback.
//   - authenticated + same plan : button is rendered disabled ("Plan actuel")
//     so this path never triggers.

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Pricing, type BillingInterval } from './Pricing'
import { SubscriptionCheckoutModal } from '@/components/billing/SubscriptionCheckoutModal'
import { changeSubscriptionPlanAction } from '@/actions/billing'

interface PricingSectionProps {
  isAuthenticated: boolean
  currentPlan: 'free' | 'starter' | 'pro'
  showHeader?: boolean
  interval?: BillingInterval
  onIntervalChange?: (interval: BillingInterval) => void
}

type Feedback =
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

export function PricingSection({
  isAuthenticated,
  currentPlan,
  showHeader = true,
  interval: controlledInterval,
  onIntervalChange,
}: PricingSectionProps) {
  const router = useRouter()
  const [localInterval, setLocalInterval] = useState<BillingInterval>('monthly')
  const interval = controlledInterval ?? localInterval
  const setInterval = onIntervalChange ?? setLocalInterval
  const [modalPlan, setModalPlan] = useState<'starter' | 'pro' | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const handlePlanClick = useCallback(
    async (planId: 'free' | 'starter' | 'pro') => {
      if (planId === 'free') {
        if (isAuthenticated) {
          router.push('/dashboard')
        } else {
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
      {feedback && (
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 pt-4">
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

      <Pricing
        interval={interval}
        onIntervalChange={setInterval}
        showHeader={showHeader}
        onPlanClick={(planId) => void handlePlanClick(planId)}
        currentPlan={isAuthenticated ? currentPlan : undefined}
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
