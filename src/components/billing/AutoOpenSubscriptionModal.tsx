'use client'

// =============================================================================
// AutoOpenSubscriptionModal — auto-opens the subscription modal post-register
// =============================================================================
//
// Tiny client component that wraps SubscriptionCheckoutModal and auto-opens
// it once at mount when the parent (typically /dashboard) detects `plan` and
// `interval` query params from a /tarifs → /register → /dashboard flow.
//
// Flow :
//   1. User clicks "Choisir Pro" on /tarifs → router.push('/register?plan=pro&interval=monthly')
//   2. User completes signup OTP → register page redirects to /dashboard?plan=pro&interval=monthly
//   3. /dashboard server component reads searchParams.plan + searchParams.interval
//      and renders <AutoOpenSubscriptionModal plan="pro" interval="monthly" />
//   4. This component auto-opens the modal once at mount, then router.replace('/dashboard')
//      to clean the query params from the URL bar
//
// Guard against React StrictMode double-mount in dev: a useRef ensures the
// auto-open only fires once even if the effect runs twice (StrictMode mounts
// every effect twice in dev to surface side-effect bugs). Without the guard,
// the modal would briefly open twice on first render in dev.

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SubscriptionCheckoutModal } from './SubscriptionCheckoutModal'

interface AutoOpenSubscriptionModalProps {
  plan: 'starter' | 'pro'
  interval: 'monthly' | 'yearly'
}

export function AutoOpenSubscriptionModal({
  plan,
  interval,
}: AutoOpenSubscriptionModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const hasAutoOpenedRef = useRef(false)

  useEffect(() => {
    if (hasAutoOpenedRef.current) return
    hasAutoOpenedRef.current = true
    setOpen(true)
  }, [])

  return (
    <SubscriptionCheckoutModal
      open={open}
      onClose={() => {
        setOpen(false)
        // Strip the query params from the URL once the modal is dismissed,
        // so a refresh or a back-navigation doesn't re-trigger the auto-open.
        router.replace('/dashboard')
      }}
      plan={plan}
      interval={interval}
      onSuccess={() => {
        // Refresh the dashboard server component to pick up the new plan
        // (which is rendered by the page's getBillingStatus call). The
        // onClose handler then strips the query params.
        router.refresh()
      }}
    />
  )
}
