import { NextResponse, type NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { getPlanFromPriceId } from '@/lib/stripe/prices'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

/**
 * Stripe webhook handler.
 *
 * Handles:
 * - checkout.session.completed (subscription + one-shot template purchases)
 * - customer.subscription.updated (plan changes)
 * - customer.subscription.deleted (cancellation -> unpublish portfolio)
 * - invoice.payment_failed (log for now, email later via Resend)
 */
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
        await handleSubscriptionUpdated(event.data.object, supabase)
        break
      }

      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event.data.object, supabase)
        break
      }

      case 'invoice.payment_failed': {
        await handlePaymentFailed(event.data.object)
        break
      }

      default: {
        // Unhandled event type -- acknowledge without processing
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook handler error'
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, message)
    // Return 200 anyway to prevent Stripe from retrying
    // The error is logged for debugging
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

/**
 * Subscription checkout completed:
 * - Determine plan from the subscription's price
 * - Update user: plan, stripe_customer_id, stripe_subscription_id
 */
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

  // Retrieve the full subscription to get the price ID
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0]?.price.id

  if (!priceId) {
    console.error('[Stripe Webhook] No price found in subscription items')
    return
  }

  const plan = getPlanFromPriceId(priceId)
  if (!plan) {
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
      plan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    })
    .eq('id', userId)

  if (error) {
    console.error('[Stripe Webhook] Failed to update user plan:', error.message)
    return
  }

  console.log(`[Stripe Webhook] User ${userId} upgraded to ${plan}`)
}

/**
 * Template purchase completed:
 * - Insert into purchased_templates (idempotent via unique constraint)
 */
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
 * Subscription updated:
 * - Determine new plan from price
 * - Update user plan in DB
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createAdminClient>
) {
  const userId = subscription.metadata?.userId
  if (!userId) {
    // Try to find user by stripe_subscription_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .limit(1)
      .maybeSingle()

    if (!user) {
      console.error('[Stripe Webhook] Cannot find user for subscription:', subscription.id)
      return
    }

    await updateUserPlanFromSubscription(subscription, user.id, supabase)
    return
  }

  await updateUserPlanFromSubscription(subscription, userId, supabase)
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

/**
 * Subscription deleted (cancelled):
 * - Reset user plan to 'free'
 * - Unpublish their portfolio
 * - (Future: send warning email via Resend)
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createAdminClient>
) {
  const userId = subscription.metadata?.userId

  let targetUserId = userId

  if (!targetUserId) {
    // Fallback: find user by stripe_subscription_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .limit(1)
      .maybeSingle()

    if (!user) {
      console.error('[Stripe Webhook] Cannot find user for deleted subscription:', subscription.id)
      return
    }

    targetUserId = user.id
  }

  // Reset plan to free and clear subscription ID
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

  // Unpublish portfolio
  const { error: portfolioError } = await supabase
    .from('portfolios')
    .update({ published: false })
    .eq('user_id', targetUserId)

  if (portfolioError) {
    console.error('[Stripe Webhook] Failed to unpublish portfolio:', portfolioError.message)
    return
  }

  // TODO: Send warning email via Resend
  console.log(`[Stripe Webhook] User ${targetUserId} subscription deleted, portfolio unpublished`)
}

/**
 * Invoice payment failed:
 * - Log for now
 * - (Future: send reminder email via Resend)
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id ?? 'unknown'

  // TODO: Send reminder email via Resend
  console.warn(
    `[Stripe Webhook] Payment failed for customer ${customerId}, invoice ${invoice.id}`
  )
}
