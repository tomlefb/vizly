/**
 * Stripe webhook handler.
 *
 * Receives Stripe events (signed via STRIPE_WEBHOOK_SECRET), routes them
 * to the right handler, and returns 2xx on success / 5xx on handler error
 * so Stripe retries with exponential backoff.
 *
 * Three cross-cutting rules apply to every handler in this file:
 *
 *   1. Idempotence first. The very first thing after signature verification
 *      is an INSERT into webhook_events keyed by stripe_event_id. If the
 *      row already exists (Postgres 23505 unique_violation), we return 200
 *      immediately and skip ALL handlers — Stripe is retrying an event
 *      we've already processed.
 *
 *   2. DB before email. Inside a handler, all DB writes happen first.
 *      Email sends happen last. Reason: if the email fails the DB is still
 *      consistent and the user has their plan; if we inverted, a failed DB
 *      after a successful email would tell the user "Paiement confirmé"
 *      while their account stays free.
 *
 *   3. Errors → 500, not 200. Any unhandled handler exception bubbles to
 *      the global catch and returns 500 so Stripe re-fires. Exceptions:
 *      400 on signature verify failure, 200 on idempotent skip, 200 on
 *      unrecognized event type. (Audit debt #9.)
 *
 * Active events:
 *   - customer.subscription.created       → handleSubscriptionCreated
 *   - customer.subscription.updated       → handleSubscriptionUpdated
 *   - customer.subscription.deleted       → handleSubscriptionDeleted
 *   - invoice.paid                        → handleInvoicePaid
 *   - invoice.payment_failed              → handlePaymentFailed
 *   - checkout.session.completed          → handleCheckoutCompleted (legacy)
 *   - payment_intent.succeeded            → handlePaymentIntentSucceeded
 *
 * Email side-effects live in ./email-handlers.ts. This file contains the
 * webhook routing, idempotence, DB sync logic, and the dispatcher.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import {
  getPlanFromPriceId,
  getPlanAndIntervalFromPriceId,
} from '@/lib/stripe/prices'
import {
  mapStripeSubscriptionToRow,
  resolvePlanOrLogUnknown,
  resolveUserIdForSubscription,
} from '@/lib/stripe/webhook-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/types'
import {
  sendCancellationEmail,
  sendPlanChangedEmail,
  sendBillingPeriodChangedEmail,
  sendPaymentSucceededEmail,
  sendPaymentFailedEmail,
  type SubscriptionChange,
} from './email-handlers'
import type Stripe from 'stripe'

// ---------------------------------------------------------------------------
// Subscription change detection (dispatcher for handleSubscriptionUpdated)
// ---------------------------------------------------------------------------

/**
 * Detect what kind of change a customer.subscription.updated event represents.
 *
 * Cancel detection takes priority — if the user just clicked Cancel,
 * we don't care about any other concurrent field change in the same event.
 *
 * Plan/period detection used to require previous_attributes.items to be
 * defined, but Stripe sometimes sends partial previous_attributes. Audit
 * debt #18: we now fall back on the local subscriptions row's plan +
 * interval as the "before" snapshot when previous_attributes.items is
 * missing or unresolved.
 *
 * Free → paid transitions return 'no-op' here — they go through
 * handleInvoicePaid (billing_reason='subscription_create') instead.
 */
function detectSubscriptionChange(
  subscription: Stripe.Subscription,
  previousAttributes: Partial<Stripe.Subscription> | undefined,
  userBeforePlan: 'free' | 'starter' | 'pro',
  localSubscriptionBefore: {
    plan: 'free' | 'starter' | 'pro'
    interval: 'monthly' | 'yearly'
  } | null,
): SubscriptionChange {
  // 1. Scheduled cancel — primary path (Vizly portal default)
  const justScheduledCancel =
    previousAttributes?.cancel_at_period_end === false &&
    subscription.cancel_at_period_end === true
  if (justScheduledCancel) return { kind: 'cancelled-scheduled' }

  // 2. Immediate cancel — defensive (Stripe Dashboard admin action)
  const justCancelledImmediately =
    previousAttributes?.status !== undefined &&
    previousAttributes.status !== 'canceled' &&
    subscription.status === 'canceled'
  if (justCancelledImmediately) return { kind: 'cancelled-immediate' }

  // 3. Item change detection — try previous_attributes first, fallback to
  // local DB if Stripe sent a partial previous_attributes (debt #18).
  const newPriceId = subscription.items.data[0]?.price?.id
  if (!newPriceId) return { kind: 'no-op' }

  const newMapping = getPlanAndIntervalFromPriceId(newPriceId)
  if (!newMapping) return { kind: 'no-op' }

  let prevMapping: { plan: 'starter' | 'pro'; interval: 'monthly' | 'yearly' } | null = null

  // Primary path: previous_attributes.items.data[0].price.id
  const prevItems = previousAttributes?.items
  if (prevItems) {
    const prevPriceId = prevItems.data?.[0]?.price?.id
    if (prevPriceId) {
      prevMapping = getPlanAndIntervalFromPriceId(prevPriceId)
    }
  }

  // Fallback (debt #18): use the local subscriptions row state captured
  // BEFORE the upsert. Only valid if the local row had a paid plan — a
  // 'free' fallback would mean the event is a free→paid transition that
  // should go through handleInvoicePaid instead.
  if (
    !prevMapping &&
    localSubscriptionBefore &&
    (localSubscriptionBefore.plan === 'starter' ||
      localSubscriptionBefore.plan === 'pro')
  ) {
    prevMapping = {
      plan: localSubscriptionBefore.plan,
      interval: localSubscriptionBefore.interval,
    }
  }

  if (!prevMapping) return { kind: 'no-op' }

  // 4. Plan change vs billing period change
  if (prevMapping.plan !== newMapping.plan) {
    if (userBeforePlan === 'free') return { kind: 'no-op' }

    return {
      kind: 'plan-changed',
      previousPlan: prevMapping.plan === 'pro' ? 'Pro' : 'Starter',
      newPlan: newMapping.plan === 'pro' ? 'Pro' : 'Starter',
      changeType: newMapping.plan === 'pro' ? 'upgrade' : 'downgrade',
      newBillingPeriod: newMapping.interval,
    }
  }

  if (prevMapping.interval !== newMapping.interval) {
    return {
      kind: 'billing-period-changed',
      previousBillingPeriod: prevMapping.interval,
      newBillingPeriod: newMapping.interval,
    }
  }

  return { kind: 'no-op' }
}

// ---------------------------------------------------------------------------
// POST entry point
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? '',
    )
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Webhook signature verification failed'
    console.error('[stripe webhook] Signature verification failed:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = createAdminClient()

  // ---- Rule 1: idempotence first (debt #3) ----
  // Insert into webhook_events keyed by stripe_event_id. If the row already
  // exists (Postgres 23505 unique_violation), Stripe is retrying an event
  // we've already processed — return 200 immediately and skip all handlers.
  const { error: insertError } = await supabase.from('webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event as unknown as Json,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      console.log(
        `[stripe webhook] Event ${event.id} (${event.type}) already processed, skipping`,
      )
      return NextResponse.json(
        { received: true, skipped: true },
        { status: 200 },
      )
    }
    console.error(
      `[stripe webhook] Failed to log event ${event.id}:`,
      insertError,
    )
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
  }

  // ---- Dispatch (rule 3: errors → 500) ----
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event, supabase)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event, supabase)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event, supabase)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event, supabase)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event, supabase)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event, supabase)
        break

      default:
        console.log(`[stripe webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error(
      `[stripe webhook] Handler failed for ${event.type} (${event.id}):`,
      err,
    )
    return NextResponse.json(
      { error: 'Handler failed', eventId: event.id, eventType: event.type },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// handleSubscriptionCreated — new in Phase 3
// ---------------------------------------------------------------------------

/**
 * Fires when Stripe creates a subscription, for both flows:
 *   - Legacy Checkout: fires alongside checkout.session.completed
 *   - New Elements: fires immediately after stripe.subscriptions.create with
 *     status=incomplete (the user will confirm payment client-side via
 *     PaymentElement, then status flips to active and invoice.paid fires)
 *
 * The handler is idempotent w.r.t. handleCheckoutCompleted via the
 * `subscriptions` table upsert — both can sync the same row without harm.
 *
 * No email sent here. The first-payment email is fired from handleInvoicePaid
 * on billing_reason='subscription_create' to avoid duplication on the legacy
 * flow (where checkout.session.completed used to send it independently).
 */
async function handleSubscriptionCreated(
  event: Stripe.Event,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const handlerName = 'handleSubscriptionCreated'
  console.log(`[stripe webhook] ${handlerName} start: ${event.id}`)

  const subscription = event.data.object as Stripe.Subscription

  const userId = await resolveUserIdForSubscription(subscription, supabase)
  if (!userId) {
    throw new Error(
      `${handlerName}: cannot resolve userId for ${event.id}, ` +
        `subscription ${subscription.id}`,
    )
  }

  const row = mapStripeSubscriptionToRow(subscription, userId, {
    eventId: event.id,
  })
  if (!row) {
    // Unknown priceId or no items — already logged in helpers, bail cleanly.
    console.log(
      `[stripe webhook] ${handlerName}: skipping local sync for ${event.id} ` +
        `(unknown priceId or no items)`,
    )
    return
  }

  // ---- Rule 2: DB writes first ----

  // 1. Upsert local subscriptions row. onConflict='user_id' replaces any
  // pre-existing row for this user (e.g. a previously cancelled sub) with
  // the fresh state. See webhook-helpers.ts header for rationale.
  const { error: upsertError } = await supabase
    .from('subscriptions')
    .upsert(row, { onConflict: 'user_id' })

  if (upsertError) {
    throw new Error(
      `${handlerName}: failed to upsert subscription row: ${upsertError.message}`,
    )
  }

  // 2. Update the legacy users columns (still source of truth for parts of
  // the app until Phase 6 cuts it over). plan + customer_id + sub_id.
  const { error: userError } = await supabase
    .from('users')
    .update({
      plan: row.plan,
      stripe_customer_id: row.stripe_customer_id,
      stripe_subscription_id: row.stripe_subscription_id,
    })
    .eq('id', userId)

  if (userError) {
    throw new Error(
      `${handlerName}: failed to update user plan: ${userError.message}`,
    )
  }

  console.log(
    `[stripe webhook] ${handlerName} done: ${event.id} sub ${subscription.id} ` +
      `user ${userId} plan ${row.plan} ${row.interval} status ${row.status}`,
  )
}

// ---------------------------------------------------------------------------
// handleSubscriptionUpdated — modified in Phase 3
// ---------------------------------------------------------------------------

/**
 * The busiest event. Fires for many reasons (plan change, period change,
 * card update, cancel click, proration, reactivation…). Uses
 * detectSubscriptionChange() as a dispatcher to route to the right email.
 *
 * Phase 3 changes:
 *   - Read the local subscriptions row BEFORE upsert (captures the OLD
 *     state for the dispatcher's debt #18 fallback)
 *   - Upsert the local subscriptions row to sync with the latest Stripe
 *     state at the start (rule 2: DB before email)
 *   - Pass localSubscriptionBefore to detectSubscriptionChange so it can
 *     fallback when previous_attributes.items is missing
 *
 * Email logic is unchanged from Phase 1.
 */
async function handleSubscriptionUpdated(
  event: Stripe.Event,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const handlerName = 'handleSubscriptionUpdated'
  console.log(`[stripe webhook] ${handlerName} start: ${event.id}`)

  const subscription = event.data.object as Stripe.Subscription
  const previousAttributes = event.data.previous_attributes as
    | Partial<Stripe.Subscription>
    | undefined

  const userId = await resolveUserIdForSubscription(subscription, supabase)
  if (!userId) {
    throw new Error(
      `${handlerName}: cannot resolve userId for ${event.id}, ` +
        `subscription ${subscription.id}`,
    )
  }

  // Read user state BEFORE updating — dispatcher needs the OLD plan to
  // detect plan-changed (Starter ↔ Pro) vs billing-period-changed.
  const { data: userBefore, error: userBeforeError } = await supabase
    .from('users')
    .select('email, name, plan')
    .eq('id', userId)
    .single()

  if (userBeforeError || !userBefore) {
    throw new Error(
      `${handlerName}: user row not found for ${userId}: ${userBeforeError?.message ?? 'no row'}`,
    )
  }

  // Read the local subscriptions row BEFORE the upsert. Captures the OLD
  // plan + interval for the debt #18 fallback in detectSubscriptionChange.
  const { data: localBefore } = await supabase
    .from('subscriptions')
    .select('plan, interval')
    .eq('user_id', userId)
    .maybeSingle()

  // ---- Rule 2: DB writes first ----

  // 1. Upsert local subscriptions row with the new state
  const newRow = mapStripeSubscriptionToRow(subscription, userId, {
    eventId: event.id,
  })
  if (newRow) {
    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert(newRow, { onConflict: 'user_id' })
    if (upsertError) {
      throw new Error(
        `${handlerName}: failed to upsert subscription row: ${upsertError.message}`,
      )
    }
  }
  // If newRow is null (unknown priceId), we already logged. Continue with
  // legacy users.plan update so users stay in sync even on unknown prices.

  // 2. Keep legacy users.plan in sync with the current priceId
  await updateUserPlanFromSubscription(subscription, userId, supabase)

  // ---- Dispatch (best-effort emails) ----
  const change = detectSubscriptionChange(
    subscription,
    previousAttributes,
    userBefore.plan,
    localBefore && (localBefore.interval === 'monthly' || localBefore.interval === 'yearly')
      ? { plan: localBefore.plan, interval: localBefore.interval }
      : null,
  )

  console.log(
    `[stripe webhook] ${handlerName}: ${event.id} → ${change.kind} (userId=${userId})`,
  )

  switch (change.kind) {
    case 'no-op':
      break

    case 'cancelled-scheduled':
    case 'cancelled-immediate': {
      const reason = subscription.cancellation_details?.reason ?? 'unknown'
      console.log(
        `[stripe webhook] ${handlerName}: cancellation reason=${reason} (userId=${userId})`,
      )
      await sendCancellationEmail(
        subscription,
        userBefore,
        change.kind === 'cancelled-immediate',
      )
      break
    }

    case 'plan-changed':
      await sendPlanChangedEmail(subscription, userBefore, change)
      break

    case 'billing-period-changed':
      await sendBillingPeriodChangedEmail(subscription, userBefore, change)
      break
  }

  console.log(`[stripe webhook] ${handlerName} done: ${event.id}`)
}

async function updateUserPlanFromSubscription(
  subscription: Stripe.Subscription,
  userId: string,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const priceId = subscription.items.data[0]?.price.id
  if (!priceId) {
    console.error('[stripe webhook] No price found in updated subscription')
    return
  }

  const plan = getPlanFromPriceId(priceId)
  if (!plan) {
    console.error(`[stripe webhook] Unknown price ID on update: ${priceId}`)
    return
  }

  const { error } = await supabase
    .from('users')
    .update({ plan })
    .eq('id', userId)

  if (error) {
    throw new Error(
      `updateUserPlanFromSubscription: failed for user ${userId}: ${error.message}`,
    )
  }

  console.log(`[stripe webhook] User ${userId} plan updated to ${plan}`)
}

// ---------------------------------------------------------------------------
// handleSubscriptionDeleted — modified in Phase 3
// ---------------------------------------------------------------------------

/**
 * Fires when a subscription reaches its period end after being cancelled
 * (or when an admin force-deletes via Dashboard). The cancellation EMAIL
 * is NOT sent from here — it's sent from handleSubscriptionUpdated at the
 * moment the user clicks Cancel in the portal (cancel_at_period_end
 * transition false → true), typically weeks before this event fires.
 *
 * Phase 3 changes: also mark the local subscriptions row status='canceled'
 * (don't delete — preserve traceability until the user re-subscribes,
 * at which point handleSubscriptionCreated will REPLACE the row via
 * onConflict='user_id'). Existing portfolio unpublish logic unchanged.
 */
async function handleSubscriptionDeleted(
  event: Stripe.Event,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const handlerName = 'handleSubscriptionDeleted'
  console.log(`[stripe webhook] ${handlerName} start: ${event.id}`)

  const subscription = event.data.object as Stripe.Subscription

  const targetUserId = await resolveUserIdForSubscription(subscription, supabase)
  if (!targetUserId) {
    throw new Error(
      `${handlerName}: cannot resolve userId for deleted subscription ${subscription.id}`,
    )
  }

  // 1. Mark the local subscriptions row as canceled (don't delete — keep
  // for traceability until re-subscription replaces it).
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : new Date().toISOString(),
    })
    .eq('user_id', targetUserId)

  if (subError) {
    // Log but don't throw — the local row sync is observability, the
    // critical writes are users.plan + portfolios.published below.
    console.error(
      `[stripe webhook] ${handlerName}: failed to mark local sub canceled: ${subError.message}`,
    )
  }

  // 2. Reset legacy users columns
  const { error: userError } = await supabase
    .from('users')
    .update({
      plan: 'free',
      stripe_subscription_id: null,
    })
    .eq('id', targetUserId)

  if (userError) {
    throw new Error(
      `${handlerName}: failed to reset user plan: ${userError.message}`,
    )
  }

  // 3. Unpublish all of the user's portfolios
  const { error: portfolioError } = await supabase
    .from('portfolios')
    .update({ published: false })
    .eq('user_id', targetUserId)

  if (portfolioError) {
    throw new Error(
      `${handlerName}: failed to unpublish portfolios: ${portfolioError.message}`,
    )
  }

  console.log(
    `[stripe webhook] ${handlerName} done: ${event.id} user ${targetUserId} (sub ${subscription.id} canceled, portfolios unpublished)`,
  )
}

// ---------------------------------------------------------------------------
// handleInvoicePaid — new in Phase 3
// ---------------------------------------------------------------------------

/**
 * Fires when an invoice transitions to paid. Three relevant cases by
 * billing_reason:
 *
 *   - 'subscription_create': first payment after subscription creation.
 *     Source of truth for the payment-succeeded email (covers BOTH the
 *     legacy Checkout flow and the new Elements flow — see Q1 verdict in
 *     STRIPE_MIGRATION_NOTES.md).
 *
 *   - 'subscription_cycle': renewal at the start of a new billing period.
 *     DB synced (current_period_end advanced), no email sent in Phase 3
 *     scope. Stripe's native invoice receipt email covers the user-facing
 *     notification. A custom Vizly renewal email may be added in a
 *     dedicated emails session post-chantier.
 *
 *   - 'subscription_update': proration after upgrade/downgrade. Email
 *     dispatch lives in handleSubscriptionUpdated (sendPlanChangedEmail).
 *     This handler just syncs the invoice row.
 *
 * Other billing_reasons (manual, subscription_threshold, ...) are logged
 * and DB-synced but no email.
 */
async function handleInvoicePaid(
  event: Stripe.Event,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const handlerName = 'handleInvoicePaid'
  console.log(`[stripe webhook] ${handlerName} start: ${event.id}`)

  const invoice = event.data.object as Stripe.Invoice

  // dahlia: invoice.subscription was removed from top-level Invoice. The
  // subscription reference now lives at parent.subscription_details.subscription
  // and is only present when billing_reason is one of the subscription_*
  // values. For manual/standalone invoices this is null and we skip.
  const subscriptionRef = invoice.parent?.subscription_details?.subscription
  if (!subscriptionRef) {
    console.log(
      `[stripe webhook] ${handlerName}: invoice ${invoice.id} not tied to a subscription, skipping (manual or one-shot)`,
    )
    return
  }

  const subscriptionId =
    typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef.id

  // Retrieve fresh subscription state from Stripe. We need it for:
  //   - userId resolution via metadata (canonical path)
  //   - up-to-date current_period_end for the local subscriptions row
  //   - amount + interval for the email
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  const userId = await resolveUserIdForSubscription(subscription, supabase)
  if (!userId) {
    throw new Error(
      `${handlerName}: cannot resolve userId for invoice.paid event ${event.id}, subscription ${subscriptionId}`,
    )
  }

  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : (invoice.customer?.id ?? null)
  if (!customerId) {
    throw new Error(
      `${handlerName}: invoice ${invoice.id} has no customer (event ${event.id})`,
    )
  }

  // ---- Rule 2: DB writes first ----

  // 1. Upsert into local invoices table
  if (!invoice.id) {
    throw new Error(
      `${handlerName}: invoice has no ID (event ${event.id}) — should never happen`,
    )
  }
  const { error: invoiceError } = await supabase.from('invoices').upsert(
    {
      user_id: userId,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
      number: invoice.number ?? null,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status ?? 'paid',
      hosted_invoice_url: invoice.hosted_invoice_url ?? null,
      invoice_pdf: invoice.invoice_pdf ?? null,
      period_start: invoice.period_start
        ? new Date(invoice.period_start * 1000).toISOString()
        : null,
      period_end: invoice.period_end
        ? new Date(invoice.period_end * 1000).toISOString()
        : null,
      paid_at: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : new Date().toISOString(),
    },
    { onConflict: 'stripe_invoice_id' },
  )

  if (invoiceError) {
    throw new Error(
      `${handlerName}: failed to upsert invoice row: ${invoiceError.message}`,
    )
  }

  // 2. Re-sync local subscriptions row with the fresh subscription state
  // (current_period_end advances on each cycle, status normalizes etc.)
  const subRow = mapStripeSubscriptionToRow(subscription, userId, {
    eventId: event.id,
  })
  if (subRow) {
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert(subRow, { onConflict: 'user_id' })
    if (subError) {
      throw new Error(
        `${handlerName}: failed to upsert subscription row from invoice.paid: ${subError.message}`,
      )
    }
  }

  // ---- Dispatch email by billing_reason ----
  const billingReason = invoice.billing_reason
  console.log(
    `[stripe webhook] ${handlerName}: invoice ${invoice.id} sub ${subscriptionId} reason ${billingReason} amount ${invoice.amount_paid}`,
  )

  if (billingReason === 'subscription_create') {
    // Resolve plan/interval for the email. If unknown, we already logged
    // via mapStripeSubscriptionToRow above, so just skip the email
    // silently (DB is synced, that's what matters).
    const item = subscription.items.data[0]
    if (item) {
      const mapping = resolvePlanOrLogUnknown(item.price.id, {
        eventId: event.id,
        subscriptionId,
      })
      if (mapping) {
        await sendPaymentSucceededEmail(
          invoice,
          subscription,
          userId,
          mapping.plan,
          mapping.interval,
          supabase,
        )
      }
    }
  } else if (billingReason === 'subscription_cycle') {
    // Renewal — DB synced, no email in Phase 3 scope. See file header
    // and STRIPE_MIGRATION_NOTES.md "Dette #4 partielle".
    console.log(
      `[stripe webhook] ${handlerName}: renewal for sub ${subscriptionId} — DB synced, no Vizly email (Stripe receipt covers user-facing)`,
    )
  } else if (billingReason === 'subscription_update') {
    // Proration upgrade/downgrade — email handled by handleSubscriptionUpdated.
    console.log(
      `[stripe webhook] ${handlerName}: proration for sub ${subscriptionId} — email via handleSubscriptionUpdated dispatcher`,
    )
  } else {
    console.log(
      `[stripe webhook] ${handlerName}: invoice ${invoice.id} reason ${billingReason} — DB synced, no email`,
    )
  }

  console.log(`[stripe webhook] ${handlerName} done: ${event.id}`)
}

// ---------------------------------------------------------------------------
// handlePaymentFailed — unchanged from Phase 1
// ---------------------------------------------------------------------------

async function handlePaymentFailed(
  event: Stripe.Event,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const handlerName = 'handlePaymentFailed'
  console.log(`[stripe webhook] ${handlerName} start: ${event.id}`)

  const invoice = event.data.object as Stripe.Invoice

  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : (invoice.customer?.id ?? null)

  if (!customerId) {
    throw new Error(
      `${handlerName}: cannot resolve customer for failed invoice ${invoice.id}`,
    )
  }

  console.warn(
    `[stripe webhook] ${handlerName}: payment failed for customer ${customerId}, invoice ${invoice.id}`,
  )

  await sendPaymentFailedEmail(invoice, customerId, supabase)

  console.log(`[stripe webhook] ${handlerName} done: ${event.id}`)
}

// ---------------------------------------------------------------------------
// handlePaymentIntentSucceeded — new in Phase 3
// ---------------------------------------------------------------------------

/**
 * Fires for every PaymentIntent that succeeds, including subscription
 * invoice PIs created automatically by Stripe. We early-bail unless the
 * PI was created by Vizly's createTemplatePaymentIntent helper, identified
 * by metadata.type === 'template'.
 *
 * Coexists with handleCheckoutCompleted mode='payment' until Phase 6
 * removes the legacy template Checkout path. Both write to the same
 * purchased_templates table with the same upsert key (user_id, template_id)
 * so duplicate writes are no-ops.
 */
async function handlePaymentIntentSucceeded(
  event: Stripe.Event,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const handlerName = 'handlePaymentIntentSucceeded'
  console.log(`[stripe webhook] ${handlerName} start: ${event.id}`)

  const paymentIntent = event.data.object as Stripe.PaymentIntent

  if (paymentIntent.metadata?.type !== 'template') {
    console.log(
      `[stripe webhook] ${handlerName}: PI ${paymentIntent.id} type=${paymentIntent.metadata?.type ?? 'none'}, not a template purchase — skipping`,
    )
    return
  }

  const userId = paymentIntent.metadata?.userId
  const templateId = paymentIntent.metadata?.templateId

  if (!userId || !templateId) {
    throw new Error(
      `${handlerName}: PI ${paymentIntent.id} has type=template but missing userId or templateId in metadata`,
    )
  }

  const { error } = await supabase.from('purchased_templates').upsert(
    {
      user_id: userId,
      template_id: templateId,
      stripe_payment_id: paymentIntent.id,
    },
    { onConflict: 'user_id,template_id' },
  )

  if (error) {
    throw new Error(
      `${handlerName}: failed to upsert purchased_templates: ${error.message}`,
    )
  }

  console.log(
    `[stripe webhook] ${handlerName} done: ${event.id} user ${userId} template ${templateId}`,
  )
}

// ---------------------------------------------------------------------------
// handleCheckoutCompleted — modified in Phase 3
// ---------------------------------------------------------------------------

/**
 * Legacy handler for the hosted Stripe Checkout flow. Two branches:
 *
 *   - mode='subscription': legacy first-checkout for subs. Phase 3
 *     changes: still updates legacy users columns AND now also upserts
 *     the local subscriptions row via the shared mapStripeSubscriptionToRow
 *     helper. The payment-succeeded email used to be sent from here is
 *     now sent from handleInvoicePaid to avoid double-sending. See Q1
 *     verdict in STRIPE_MIGRATION_NOTES.md.
 *
 *   - mode='payment': legacy template one-shot. Unchanged from Phase 1.
 *     Coexists with handlePaymentIntentSucceeded (which handles the new
 *     Elements flow). Both write to purchased_templates with the same
 *     upsert key, so duplicate writes are no-ops.
 *
 * Phase 6 will delete this entire handler when the legacy Checkout flow
 * is retired.
 */
async function handleCheckoutCompleted(
  event: Stripe.Event,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const handlerName = 'handleCheckoutCompleted'
  console.log(`[stripe webhook] ${handlerName} start: ${event.id}`)

  const session = event.data.object as Stripe.Checkout.Session

  if (session.mode === 'subscription') {
    await handleSubscriptionCheckout(session, supabase, event.id)
  } else if (session.mode === 'payment') {
    await handleTemplateCheckout(session, supabase)
  }

  console.log(`[stripe webhook] ${handlerName} done: ${event.id}`)
}

async function handleSubscriptionCheckout(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createAdminClient>,
  eventId: string,
) {
  const userId = session.metadata?.userId
  if (!userId) {
    throw new Error(
      'handleSubscriptionCheckout: missing userId in session metadata',
    )
  }

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id

  if (!subscriptionId) {
    throw new Error(
      'handleSubscriptionCheckout: missing subscription ID in checkout session',
    )
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0]?.price.id

  if (!priceId) {
    throw new Error(
      'handleSubscriptionCheckout: no price found in subscription items',
    )
  }

  const planMapping = resolvePlanOrLogUnknown(priceId, {
    eventId,
    subscriptionId,
  })
  if (!planMapping) {
    // Unknown price — already logged. Bail without throwing so the event
    // is consumed (we can't credit a non-Vizly plan, but we shouldn't
    // retry indefinitely either).
    return
  }

  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : (session.customer?.id ?? null)

  // 1. Update legacy users columns
  const { error: userError } = await supabase
    .from('users')
    .update({
      plan: planMapping.plan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    })
    .eq('id', userId)

  if (userError) {
    throw new Error(
      `handleSubscriptionCheckout: failed to update user plan: ${userError.message}`,
    )
  }

  // 2. Upsert local subscriptions row via the shared helper. Both flows
  // (legacy Checkout and new Elements) converge on the same row shape.
  const row = mapStripeSubscriptionToRow(subscription, userId, { eventId })
  if (row) {
    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert(row, { onConflict: 'user_id' })
    if (upsertError) {
      throw new Error(
        `handleSubscriptionCheckout: failed to upsert local subscription row: ${upsertError.message}`,
      )
    }
  }

  console.log(
    `[stripe webhook] handleSubscriptionCheckout: user ${userId} upgraded to ${planMapping.plan} ${planMapping.interval} via legacy Checkout (sub ${subscriptionId})`,
  )

  // Email is now sent from handleInvoicePaid (billing_reason='subscription_create')
  // to avoid double-email on legacy Checkout flow. This branch will be
  // fully removed in Phase 6.
}

async function handleTemplateCheckout(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const userId = session.metadata?.userId
  const templateId = session.metadata?.templateId

  if (!userId || !templateId) {
    throw new Error(
      'handleTemplateCheckout: missing userId or templateId in session metadata',
    )
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? session.id)

  const { error } = await supabase.from('purchased_templates').upsert(
    {
      user_id: userId,
      template_id: templateId,
      stripe_payment_id: paymentIntentId,
    },
    { onConflict: 'user_id,template_id' },
  )

  if (error) {
    throw new Error(
      `handleTemplateCheckout: failed to record template purchase: ${error.message}`,
    )
  }

  console.log(
    `[stripe webhook] handleTemplateCheckout: user ${userId} purchased template ${templateId}`,
  )
}
