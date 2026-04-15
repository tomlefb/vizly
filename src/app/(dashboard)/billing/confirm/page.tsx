// =============================================================================
// /billing/confirm — landing page after a Stripe 3DS redirect
// =============================================================================
//
// Reached only when stripe.confirmPayment({ redirect: 'if_required' }) was
// forced into a hard redirect because the card required Strong Customer
// Authentication. For non-3DS payments, the modals stay in-app and this page
// is never visited.
//
// Stripe appends `payment_intent`, `payment_intent_client_secret` and
// `redirect_status` to the return_url. The Vizly modals also pass a custom
// param to discriminate the context:
//   - SubscriptionCheckoutModal → `?subscription_id=sub_...`
//   - TemplatePurchaseModal     → `?payment_intent_id=pi_...`
//
// IMPORTANT — this page does NOT touch the DB. The webhook pipeline
// (customer.subscription.created, invoice.paid, payment_intent.succeeded)
// is the source of truth and runs in parallel. We just show an optimistic
// confirmation message and bounce the user back to /billing after 3 s,
// giving the webhook time to land before the next render of the recap.

import { Check, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ConfirmRedirectAfterDelay } from './ConfirmRedirectAfterDelay'

interface ConfirmPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type Status = 'succeeded' | 'failed' | 'unknown'

function pickStatus(value: string | string[] | undefined): Status {
  if (value === 'succeeded') return 'succeeded'
  if (value === 'failed') return 'failed'
  return 'unknown'
}

function pickContext(
  params: Record<string, string | string[] | undefined>,
): 'subscription' | 'template' | 'unknown' {
  if (typeof params.subscription_id === 'string') return 'subscription'
  if (typeof params.payment_intent_id === 'string') return 'template'
  return 'unknown'
}

export default async function BillingConfirmPage({
  searchParams,
}: ConfirmPageProps) {
  const [params, t] = await Promise.all([
    searchParams,
    getTranslations('billing'),
  ])

  const status = pickStatus(params.redirect_status)
  const context = pickContext(params)

  if (status === 'succeeded') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center pt-16 text-center">
        <Check
          className="h-8 w-8 text-foreground"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <h1 className="mt-4 text-2xl font-bold text-foreground font-[family-name:var(--font-satoshi)]">
          {t('confirmTitle')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {context === 'template'
            ? t('confirmTemplateBody')
            : t('confirmSubBody')}
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          {t('confirmRedirecting')}
        </p>
        <ConfirmRedirectAfterDelay
          targetPath="/billing"
          delayMs={3000}
          continueLabel={t('confirmContinue')}
        />
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center pt-16 text-center">
        <X
          className="h-8 w-8 text-foreground"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <h1 className="mt-4 text-2xl font-bold text-foreground font-[family-name:var(--font-satoshi)]">
          {t('confirmFailedTitle')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('confirmFailedBody')}
        </p>
        <Link
          href="/billing"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
        >
          {t('confirmFailedBack')}
        </Link>
      </div>
    )
  }

  // unknown — defensive branch, should never be reached in practice
  return (
    <div className="mx-auto flex max-w-md flex-col items-center pt-16 text-center">
      <AlertCircle
        className="h-8 w-8 text-foreground"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <h1 className="mt-4 text-2xl font-bold text-foreground font-[family-name:var(--font-satoshi)]">
        {t('confirmUnknownTitle')}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t('confirmUnknownBody')}
      </p>
      <Link
        href="/billing"
        className="mt-6 inline-flex h-10 items-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface-warm"
      >
        {t('confirmFailedBack')}
      </Link>
    </div>
  )
}
