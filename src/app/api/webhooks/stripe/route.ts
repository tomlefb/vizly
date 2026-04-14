/**
 * Stripe webhook handler.
 *
 * Receives Stripe events (signed via STRIPE_WEBHOOK_SECRET), routes them
 * to the right handler, and returns 200 always (Stripe re-fires on non-2xx).
 *
 * Handlers:
 * - checkout.session.completed (subscription + one-shot template purchases)
 * - customer.subscription.updated (plan changes, period changes, cancel click)
 *   → dispatched via detectSubscriptionChange()
 * - customer.subscription.deleted (period-end termination → unpublish portfolios)
 * - invoice.payment_failed (fire payment-failed email)
 *
 * Email side-effects live in ./email-handlers.ts. This file contains only
 * the webhook routing + DB sync logic + the dispatcher.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import {
  getPlanFromPriceId,
  getPlanAndIntervalFromPriceId,
} from '@/lib/stripe/prices'
import { createAdminClient } from '@/lib/supabase/admin'
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
// Subscription change detection (dispatcher)
// ---------------------------------------------------------------------------

/**
 * Detect what kind of change a customer.subscription.updated event represents.
 *
 * Cancel detection takes priority — if the user just clicked Cancel,
 * we don't care about any other concurrent field change in the same event.
 *
 * Plan/period detection requires previous_attributes.items to be defined
 * (Stripe only sets it when items actually changed). We compare the
 * previous and new price IDs via getPlanAndIntervalFromPriceId.
 *
 * Free → paid transitions return 'no-op' here — they go through
 * checkout.session.completed instead, which fires payment-succeeded.
 */
function detectSubscriptionChange(
  subscription: Stripe.Subscription,
  previousAttributes: Partial<Stripe.Subscription> | undefined,
  userBeforePlan: 'free' | 'starter' | 'pro',
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

  // 3. Item change detection — only fires if items actually changed
  const prevItems = previousAttributes?.items
  if (!prevItems) return { kind: 'no-op' }

  const newPriceId = subscription.items.data[0]?.price?.id
  if (!newPriceId) return { kind: 'no-op' }

  const newMapping = getPlanAndIntervalFromPriceId(newPriceId)
  if (!newMapping) return { kind: 'no-op' }

  // Read previous priceId from previous_attributes.items.data[0].price.id
  const prevPriceId = prevItems.data?.[0]?.price?.id
  if (!prevPriceId) return { kind: 'no-op' }

  const prevMapping = getPlanAndIntervalFromPriceId(prevPriceId)
  if (!prevMapping) return { kind: 'no-op' }

  // 4. Plan change vs billing period change
  if (prevMapping.plan !== newMapping.plan) {
    // Defensive: free → paid shouldn't reach here (it goes through
    // checkout.session.completed). If userBefore is 'free', skip.
    if (userBeforePlan === 'free') return { kind: 'no-op' }

    return {
      kind: 'plan-changed',
      previousPlan: prevMapping.plan === 'pro' ? 'Pro' : 'Starter',
      newPlan: newMapping.plan === 'pro' ? 'Pro' : 'Starter',
      changeType: newMapping.plan === 'pro' ? 'upgrade' : 'downgrade',
      newBillingPeriod: newMapping.interval,
    }
  }

  // Same plan, different interval = billing-period-changed
  if (prevMapping.interval !== newMapping.interval) {
    return {
      kind: 'billing-period-changed',
      previousBillingPeriod: prevMapping.interval,
      newBillingPeriod: newMapping.interval,
    }
  }

  // Same plan, same interval — items changed for some other reason (no-op)
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
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ''
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
    console.error('[Stripe Webhook] Signature verification failed:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(event.data.object, supabase)
        break
      }

      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(
          event.data.object,
          event.data.previous_attributes,
          supabase,
        )
        break
      }

      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event.data.object, supabase)
        break
      }

      case 'invoice.payment_failed': {
        await handlePaymentFailed(event.data.object, supabase)
        break
      }

      default: {
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook handler error'
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, message)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createAdminClient>
) {
  if (session.mode === 'subscription') {
    await handleSubscriptionCheckout(session, supabase)
  } else if (session.mode === 'payment') {
    await handleTemplateCheckout(session, supabase)
  }
}

async function handleSubscriptionCheckout(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createAdminClient>
) {
  const userId = session.metadata?.userId
  if (!userId) {
    console.error('[Stripe Webhook] Missing userId in subscription checkout metadata')
    return
  }

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id

  if (!subscriptionId) {
    console.error('[Stripe Webhook] Missing subscription ID in checkout session')
    return
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0]?.price.id

  if (!priceId) {
    console.error('[Stripe Webhook] No price found in subscription items')
    return
  }

  const planMapping = getPlanAndIntervalFromPriceId(priceId)
  if (!planMapping) {
    console.error(`[Stripe Webhook] Unknown price ID: ${priceId}`)
    return
  }

  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null

  const { error } = await supabase
    .from('users')
    .update({
      plan: planMapping.plan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    })
    .eq('id', userId)

  if (error) {
    console.error('[Stripe Webhook] Failed to update user plan:', error.message)
    return
  }

  console.log(`[Stripe Webhook] User ${userId} upgraded to ${planMapping.plan}`)

  // Fire payment-succeeded email after the DB update succeeds.
  // Failure is logged inside the helper but doesn't propagate.
  await sendPaymentSucceededEmail(
    subscription,
    userId,
    planMapping.plan,
    planMapping.interval,
    session,
    supabase,
  )
}

async function handleTemplateCheckout(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createAdminClient>
) {
  const userId = session.metadata?.userId
  const templateId = session.metadata?.templateId

  if (!userId || !templateId) {
    console.error('[Stripe Webhook] Missing userId or templateId in template checkout metadata')
    return
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? session.id

  const { error } = await supabase.from('purchased_templates').upsert(
    {
      user_id: userId,
      template_id: templateId,
      stripe_payment_id: paymentIntentId,
    },
    {
      onConflict: 'user_id,template_id',
    }
  )

  if (error) {
    console.error('[Stripe Webhook] Failed to record template purchase:', error.message)
    return
  }

  console.log(`[Stripe Webhook] User ${userId} purchased template ${templateId}`)
}

/**
 * Resolve the Vizly user ID linked to a Stripe subscription.
 *
 * Primary path: subscription.metadata.userId (set at checkout time).
 * Fallback: DB lookup by stripe_subscription_id (for subs where metadata
 * is missing — e.g. legacy subs or subs created via Stripe Dashboard).
 *
 * Returns null if the user cannot be resolved — the caller should log
 * and bail out cleanly.
 */
async function resolveUserIdFromSubscription(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createAdminClient>,
): Promise<string | null> {
  const fromMetadata = subscription.metadata?.userId
  if (fromMetadata) return fromMetadata

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .limit(1)
    .maybeSingle()

  return user?.id ?? null
}

/**
 * Handles customer.subscription.updated — the busiest event. Fires for
 * many reasons (plan change, period change, card update, cancel click,
 * proration, reactivation…). Uses detectSubscriptionChange() as a
 * dispatcher to route to the right email helper.
 *
 * Order of operations:
 *   1. Resolve userId from metadata or DB lookup
 *   2. Read userBefore (plan, email, name) — needed BEFORE updating because
 *      the dispatcher compares the OLD plan with the NEW price ID
 *   3. Update user.plan from the new priceId (existing behavior)
 *   4. Run the dispatcher → SubscriptionChange
 *   5. Switch on change.kind and call the right email helper
 *
 * Email failures are logged but never block the webhook response.
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  previousAttributes: Partial<Stripe.Subscription> | undefined,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const userId = await resolveUserIdFromSubscription(subscription, supabase)
  if (!userId) {
    console.error(
      '[Stripe Webhook] Cannot find user for subscription:',
      subscription.id,
    )
    return
  }

  // Read user state BEFORE updating — the dispatcher needs the OLD plan
  // to detect plan-changed (Starter ↔ Pro) vs billing-period-changed
  // (same plan, different interval).
  const { data: userBefore, error: userBeforeError } = await supabase
    .from('users')
    .select('email, name, plan')
    .eq('id', userId)
    .single()

  if (userBeforeError || !userBefore) {
    console.error(
      '[Stripe Webhook] User row not found for subscription update:',
      userId,
      userBeforeError?.message,
    )
    return
  }

  // Keep user.plan in sync with the current priceId
  await updateUserPlanFromSubscription(subscription, userId, supabase)

  // Dispatch on what specifically changed
  const change = detectSubscriptionChange(
    subscription,
    previousAttributes,
    userBefore.plan,
  )

  console.log(
    `[Stripe Webhook] subscription.updated → ${change.kind} (userId=${userId})`,
  )

  switch (change.kind) {
    case 'no-op':
      return

    case 'cancelled-scheduled':
    case 'cancelled-immediate': {
      // Log cancellation_details.reason for analytics (not decision-making).
      // 'cancellation_requested' = user clicked in portal, 'payment_failed'
      // = Smart Retries gave up, 'payment_disputed' = dispute, null = not set.
      const reason = subscription.cancellation_details?.reason ?? 'unknown'
      console.log(
        `[Stripe Webhook] Cancellation reason=${reason} (userId=${userId})`,
      )
      await sendCancellationEmail(
        subscription,
        userBefore,
        change.kind === 'cancelled-immediate',
      )
      return
    }

    case 'plan-changed':
      await sendPlanChangedEmail(subscription, userBefore, change)
      return

    case 'billing-period-changed':
      await sendBillingPeriodChangedEmail(subscription, userBefore, change)
      return
  }
}

async function updateUserPlanFromSubscription(
  subscription: Stripe.Subscription,
  userId: string,
  supabase: ReturnType<typeof createAdminClient>
) {
  const priceId = subscription.items.data[0]?.price.id
  if (!priceId) {
    console.error('[Stripe Webhook] No price found in updated subscription')
    return
  }

  const plan = getPlanFromPriceId(priceId)
  if (!plan) {
    console.error(`[Stripe Webhook] Unknown price ID on update: ${priceId}`)
    return
  }

  const { error } = await supabase
    .from('users')
    .update({ plan })
    .eq('id', userId)

  if (error) {
    console.error('[Stripe Webhook] Failed to update plan on subscription change:', error.message)
    return
  }

  console.log(`[Stripe Webhook] User ${userId} plan updated to ${plan}`)
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createAdminClient>
) {
  // Note: the subscription-cancelled EMAIL is NOT sent from here.
  // It's sent from handleSubscriptionUpdated at the moment the user
  // clicks Cancel in the portal (transition cancel_at_period_end: false
  // → true), typically weeks before this event fires. This handler is
  // strictly responsible for the DB-side downgrade: reset user.plan to
  // 'free' and unpublish all their portfolios. See Bloc 1.1 notes.
  const targetUserId = await resolveUserIdFromSubscription(
    subscription,
    supabase,
  )
  if (!targetUserId) {
    console.error(
      '[Stripe Webhook] Cannot find user for deleted subscription:',
      subscription.id,
    )
    return
  }

  const { error: userError } = await supabase
    .from('users')
    .update({
      plan: 'free',
      stripe_subscription_id: null,
    })
    .eq('id', targetUserId)

  if (userError) {
    console.error('[Stripe Webhook] Failed to reset user plan:', userError.message)
    return
  }

  const { error: portfolioError } = await supabase
    .from('portfolios')
    .update({ published: false })
    .eq('user_id', targetUserId)

  if (portfolioError) {
    console.error('[Stripe Webhook] Failed to unpublish portfolio:', portfolioError.message)
    return
  }

  console.log(`[Stripe Webhook] User ${targetUserId} subscription deleted, portfolio unpublished`)
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id ?? null

  if (!customerId) {
    console.error(
      '[Stripe Webhook] Cannot resolve customer for failed invoice:',
      invoice.id,
    )
    return
  }

  console.warn(
    `[Stripe Webhook] Payment failed for customer ${customerId}, invoice ${invoice.id}`,
  )

  await sendPaymentFailedEmail(invoice, customerId, supabase)
}
