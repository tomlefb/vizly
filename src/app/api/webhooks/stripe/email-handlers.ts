/**
 * Email helpers for the Stripe webhook handler.
 *
 * Each function fires one of the 5 billing-related transactional emails
 * via the central sendEmail helper. The dispatcher in route.ts decides
 * WHICH helper to call based on the event type and the result of
 * detectSubscriptionChange().
 *
 * All helpers follow the same failure policy: log on error, never throw.
 * Webhook responses must always return 200 to Stripe — email failures
 * are observability concerns, not webhook errors.
 *
 * Date computation note: all dates are derived from Stripe UTC timestamps
 * and rendered as YYYY-MM-DD calendar dates. For users in timezones far
 * from UTC the displayed date may differ by one day from their local
 * experience. Acceptable for FR-only Vizly; revisit on internationalisation.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/emails/send'
import type Stripe from 'stripe'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/**
 * Shape of the row read from public.users in handleSubscriptionUpdated
 * and passed to email helpers. Avoids re-querying the DB once per email.
 */
export type UserBefore = {
  email: string
  name: string | null
  plan: 'free' | 'starter' | 'pro'
}

/**
 * Discriminated union returned by detectSubscriptionChange (in route.ts).
 * The 5 email helpers accept Extract<SubscriptionChange, { kind: ... }>
 * for the variant they handle, so adding a new kind requires updating
 * both the dispatcher and the helper signatures.
 */
export type SubscriptionChange =
  | { kind: 'no-op' }
  | { kind: 'cancelled-scheduled' }
  | { kind: 'cancelled-immediate' }
  | {
      kind: 'plan-changed'
      previousPlan: 'Starter' | 'Pro'
      newPlan: 'Starter' | 'Pro'
      changeType: 'upgrade' | 'downgrade'
      newBillingPeriod: 'monthly' | 'yearly'
    }
  | {
      kind: 'billing-period-changed'
      previousBillingPeriod: 'monthly' | 'yearly'
      newBillingPeriod: 'monthly' | 'yearly'
    }

// ---------------------------------------------------------------------------
// Date utilities (internal)
// ---------------------------------------------------------------------------

/** Convert a Stripe Unix timestamp (seconds) to an ISO calendar date YYYY-MM-DD. */
function toIsoDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 10)
}

/** Add one billing interval to a Date. Used for "next billing after downgrade". */
function addInterval(date: Date, interval: 'monthly' | 'yearly'): Date {
  const result = new Date(date)
  if (interval === 'yearly') {
    result.setUTCFullYear(result.getUTCFullYear() + 1)
  } else {
    result.setUTCMonth(result.getUTCMonth() + 1)
  }
  return result
}

// ---------------------------------------------------------------------------
// 1. subscription-cancelled
// ---------------------------------------------------------------------------

/**
 * Send subscription-cancelled email. The user object is already fetched
 * by the caller — no extra DB roundtrip.
 *
 * For scheduled cancel: effectiveDate = subscription.cancel_at (or
 * current_period_end as fallback). For immediate cancel: effectiveDate
 * = today (features stop working now).
 */
export async function sendCancellationEmail(
  subscription: Stripe.Subscription,
  user: UserBefore,
  isImmediate: boolean,
) {
  // At cancel-click time, user.plan should still be 'starter' or 'pro' —
  // the downgrade to 'free' happens later via customer.subscription.deleted.
  // If somehow it's already 'free', that's a state inconsistency: bail.
  if (user.plan !== 'starter' && user.plan !== 'pro') {
    console.error(
      '[Stripe Webhook] Cancellation on unexpected plan state:',
      user.email,
      user.plan,
    )
    return
  }

  // In API 2024-09-30.acacia, current_period_end was moved from the top
  // of Subscription to the SubscriptionItem level, so we read it from
  // items.data[0] when cancel_at is absent.
  let effectiveTimestamp: number
  if (isImmediate) {
    effectiveTimestamp = Math.floor(Date.now() / 1000)
  } else if (subscription.cancel_at) {
    effectiveTimestamp = subscription.cancel_at
  } else {
    const periodEnd = subscription.items.data[0]?.current_period_end
    if (!periodEnd) {
      console.error(
        '[Stripe Webhook] Cannot determine cancellation effective date for subscription:',
        subscription.id,
      )
      return
    }
    effectiveTimestamp = periodEnd
  }
  const effectiveDate = toIsoDate(effectiveTimestamp)

  const result = await sendEmail({
    template: 'subscription-cancelled',
    to: user.email,
    data: {
      name: user.name ?? '',
      previousPlanName: user.plan === 'pro' ? 'Pro' : 'Starter',
      effectiveDate,
    },
  })

  if (!result.ok) {
    console.error(
      '[Stripe Webhook] subscription-cancelled email failed:',
      result.error,
    )
    return
  }
  console.log(
    `[Stripe Webhook] subscription-cancelled sent to ${user.email} (effective ${effectiveDate}, immediate=${isImmediate})`,
  )
}

// ---------------------------------------------------------------------------
// 2. plan-changed
// ---------------------------------------------------------------------------

/**
 * Send plan-changed email (Starter ↔ Pro upgrade or downgrade).
 *
 * Vizly convention:
 *   - Upgrade (Starter → Pro): immediate. effectiveDate = today,
 *     nextBillingDate = current_period_end (next regular Pro charge).
 *   - Downgrade (Pro → Starter): at period end. effectiveDate =
 *     current_period_end, nextBillingDate = period end + 1 interval.
 */
export async function sendPlanChangedEmail(
  subscription: Stripe.Subscription,
  user: UserBefore,
  change: Extract<SubscriptionChange, { kind: 'plan-changed' }>,
) {
  const item = subscription.items.data[0]
  if (!item) {
    console.error('[Stripe Webhook] No subscription item for plan-changed')
    return
  }

  const amount = item.price.unit_amount ?? 0
  const currency = item.price.currency
  const periodEnd = item.current_period_end
  if (!periodEnd) {
    console.error('[Stripe Webhook] No current_period_end for plan-changed')
    return
  }

  const isImmediate = change.changeType === 'upgrade'
  const periodEndDate = new Date(periodEnd * 1000)

  const effectiveDate = isImmediate
    ? toIsoDate(Math.floor(Date.now() / 1000))
    : toIsoDate(periodEnd)

  // For downgrade: nextBillingDate = period end + 1 interval (when the
  // first Starter charge happens after the change takes effect).
  // For upgrade: nextBillingDate = period end (next regular Pro charge).
  const nextBillingDate = isImmediate
    ? toIsoDate(periodEnd)
    : toIsoDate(
        Math.floor(
          addInterval(periodEndDate, change.newBillingPeriod).getTime() / 1000,
        ),
      )

  const result = await sendEmail({
    template: 'plan-changed',
    to: user.email,
    data: {
      name: user.name ?? '',
      previousPlanName: change.previousPlan,
      newPlanName: change.newPlan,
      changeType: change.changeType,
      newAmount: amount,
      currency,
      newBillingPeriod: change.newBillingPeriod,
      effectiveDate,
      isImmediate,
      nextBillingDate,
    },
  })

  if (!result.ok) {
    console.error(
      '[Stripe Webhook] plan-changed email failed:',
      result.error,
    )
    return
  }
  console.log(
    `[Stripe Webhook] plan-changed sent to ${user.email} (${change.previousPlan} → ${change.newPlan})`,
  )
}

// ---------------------------------------------------------------------------
// 3. billing-period-changed
// ---------------------------------------------------------------------------

/**
 * Send billing-period-changed email (Monthly ↔ Yearly within same plan).
 *
 * Vizly convention mirrors plan-changed:
 *   - to-yearly: immediate (the user is committing more upfront)
 *   - to-monthly: at period end (let them finish their current annual)
 */
export async function sendBillingPeriodChangedEmail(
  subscription: Stripe.Subscription,
  user: UserBefore,
  change: Extract<SubscriptionChange, { kind: 'billing-period-changed' }>,
) {
  if (user.plan !== 'starter' && user.plan !== 'pro') {
    console.error(
      '[Stripe Webhook] billing-period-changed on unexpected plan:',
      user.email,
      user.plan,
    )
    return
  }

  const item = subscription.items.data[0]
  if (!item) {
    console.error('[Stripe Webhook] No subscription item for billing-period-changed')
    return
  }

  const amount = item.price.unit_amount ?? 0
  const currency = item.price.currency
  const periodEnd = item.current_period_end
  if (!periodEnd) {
    console.error('[Stripe Webhook] No current_period_end for billing-period-changed')
    return
  }

  // toYearly = immediate, toMonthly = at period end
  const isImmediate = change.newBillingPeriod === 'yearly'
  const periodEndDate = new Date(periodEnd * 1000)

  const effectiveDate = isImmediate
    ? toIsoDate(Math.floor(Date.now() / 1000))
    : toIsoDate(periodEnd)

  const nextBillingDate = isImmediate
    ? toIsoDate(periodEnd)
    : toIsoDate(
        Math.floor(
          addInterval(periodEndDate, change.newBillingPeriod).getTime() / 1000,
        ),
      )

  const result = await sendEmail({
    template: 'billing-period-changed',
    to: user.email,
    data: {
      name: user.name ?? '',
      planName: user.plan === 'pro' ? 'Pro' : 'Starter',
      previousBillingPeriod: change.previousBillingPeriod,
      newBillingPeriod: change.newBillingPeriod,
      newAmount: amount,
      currency,
      effectiveDate,
      isImmediate,
      nextBillingDate,
    },
  })

  if (!result.ok) {
    console.error(
      '[Stripe Webhook] billing-period-changed email failed:',
      result.error,
    )
    return
  }
  console.log(
    `[Stripe Webhook] billing-period-changed sent to ${user.email} (${change.previousBillingPeriod} → ${change.newBillingPeriod})`,
  )
}

// ---------------------------------------------------------------------------
// 4. payment-succeeded
// ---------------------------------------------------------------------------

/**
 * Fetch the user by id and fire payment-succeeded with the price details
 * from the subscription items + invoice info (number, hosted URL).
 *
 * Called from handleInvoicePaid in route.ts on billing_reason='subscription_create',
 * which is fired automatically after the PaymentElement confirms the
 * subscription's first invoice. See STRIPE_MIGRATION_NOTES.md "Phase 3 —
 * Q1 double email" for why this is the single entrypoint for the first-
 * payment email.
 */
export async function sendPaymentSucceededEmail(
  invoice: Stripe.Invoice,
  subscription: Stripe.Subscription,
  userId: string,
  plan: 'starter' | 'pro',
  interval: 'monthly' | 'yearly',
  supabase: ReturnType<typeof createAdminClient>,
) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    console.error(
      '[stripe webhook] User row not found for payment-succeeded:',
      userId,
      userError?.message,
    )
    return
  }

  const item = subscription.items.data[0]
  if (!item) {
    console.error('[stripe webhook] No subscription item for payment-succeeded')
    return
  }

  const amount = item.price.unit_amount ?? 0
  const currency = item.price.currency
  const periodEnd = item.current_period_end
  if (!periodEnd) {
    console.error(
      '[stripe webhook] No current_period_end for payment-succeeded',
    )
    return
  }

  // Invoice details are read directly from the invoice object passed in.
  // Both fields are nullable in Stripe's API: number is null until the
  // invoice is finalized (which happens before payment), hosted URL is
  // null for invoices that bypass the hosted page (rare). The template
  // skips these fields silently if absent.
  const invoiceNumber = invoice.number ?? undefined
  const invoiceUrl = invoice.hosted_invoice_url ?? undefined

  const result = await sendEmail({
    template: 'payment-succeeded',
    to: user.email,
    data: {
      name: user.name ?? '',
      planName: plan === 'pro' ? 'Pro' : 'Starter',
      billingPeriod: interval,
      amount,
      currency,
      paidAt: toIsoDate(Math.floor(Date.now() / 1000)),
      nextBillingDate: toIsoDate(periodEnd),
      ...(invoiceNumber ? { invoiceNumber } : {}),
      ...(invoiceUrl ? { invoiceUrl } : {}),
    },
  })

  if (!result.ok) {
    console.error(
      '[stripe webhook] payment-succeeded email failed:',
      result.error,
    )
    return
  }
  console.log(
    `[stripe webhook] payment-succeeded sent to ${user.email} (plan=${plan} interval=${interval})`,
  )
}

// ---------------------------------------------------------------------------
// 5. payment-failed
// ---------------------------------------------------------------------------

/**
 * Fetch the user by stripe_customer_id and fire payment-failed.
 *
 * Approximation on gracePeriodEndDate: Stripe Smart Retries config lives
 * in the dashboard (typically 4 retries over ~1 week) and is NOT exposed
 * via the API. We approximate at attemptedAt + 7 days. Refine if we
 * observe drift in production — see Phase 5 testing.
 */
export async function sendPaymentFailedEmail(
  invoice: Stripe.Invoice,
  customerId: string,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email, name, plan')
    .eq('stripe_customer_id', customerId)
    .single()

  if (userError || !user) {
    console.error(
      '[Stripe Webhook] User not found for payment-failed:',
      customerId,
      userError?.message,
    )
    return
  }

  if (user.plan !== 'starter' && user.plan !== 'pro') {
    console.error(
      '[Stripe Webhook] payment-failed on unexpected plan:',
      user.email,
      user.plan,
    )
    return
  }

  const amount = invoice.amount_due ?? invoice.total ?? 0
  const currency = invoice.currency

  // attemptedAt: when this failed attempt happened. Fallback chain:
  // status_transitions.finalized_at → invoice.created → now.
  const attemptedAtTs =
    invoice.status_transitions?.finalized_at ??
    invoice.created ??
    Math.floor(Date.now() / 1000)

  // nextAttemptDate: Stripe-provided if Smart Retries hasn't given up yet.
  // Optional in the template — falls back to "in the coming days".
  const nextAttemptTs = invoice.next_payment_attempt

  // gracePeriodEndDate: APPROXIMATION = attemptedAt + 7 days.
  // Stripe Smart Retries config lives in the dashboard and isn't exposed
  // via the API. Vizly's default Smart Retries setup is ~1 week (4 retries
  // over 7 days). Refine this if we observe drift between the email's
  // promised deadline and the actual moment subscription.deleted fires.
  // See Phase 5 testing notes.
  const gracePeriodTs = attemptedAtTs + 7 * 24 * 60 * 60

  const result = await sendEmail({
    template: 'payment-failed',
    to: user.email,
    data: {
      name: user.name ?? '',
      planName: user.plan === 'pro' ? 'Pro' : 'Starter',
      amount,
      currency,
      attemptedAt: toIsoDate(attemptedAtTs),
      ...(nextAttemptTs ? { nextAttemptDate: toIsoDate(nextAttemptTs) } : {}),
      gracePeriodEndDate: toIsoDate(gracePeriodTs),
    },
  })

  if (!result.ok) {
    console.error(
      '[Stripe Webhook] payment-failed email failed:',
      result.error,
    )
    return
  }
  console.log(
    `[Stripe Webhook] payment-failed sent to ${user.email} (plan=${user.plan} amount=${amount})`,
  )
}
