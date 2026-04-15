// =============================================================================
// checkout.ts — Subscription management helpers
// =============================================================================
//
// Phase 6 cleanup: this file used to host `createSubscriptionCheckout` and
// `createTemplateCheckout` which created Stripe-hosted Checkout Sessions and
// returned a redirect URL. Both have been removed — Phase 4 / Phase 5 modals
// (SubscriptionCheckoutModal, TemplatePurchaseModal) now collect the payment
// in-app via PaymentElement, no Checkout Session involved.
//
// What remains:
//   - updateExistingSubscription: in-place plan/interval change for users who
//     already have an active subscription. Used by changeSubscriptionPlanAction
//     in src/actions/billing.ts. Doesn't need a client-side confirmation step
//     because no new payment method is collected.
//   - createBillingPortalSession: creates a Stripe-hosted Billing Portal
//     session for "manage my subscription" actions (update card, cancel,
//     download invoices). Used by createBillingPortalAction. The portal
//     stays hosted by design — the Phase 7 /billing rewrite custom-renders
//     the recap, but invoice management / cancellation flows stay in the
//     official Stripe Portal for now.
//
// The file name `checkout.ts` is preserved despite the content shift to
// avoid touching imports across the codebase. A rename to e.g.
// `subscription-management.ts` would be polish-only and is deferred to
// Phase 7 if the /billing rewrite touches the imports anyway.

import { stripe } from './client'
import { APP_URL } from '@/lib/constants'

/**
 * Update an existing subscription to a new price (upgrade, downgrade, or
 * interval change). Replaces the current subscription item — no stacking.
 * Proration is applied automatically by Stripe Billing.
 *
 * Returns the (French) error message verbatim so the calling Server Action
 * can surface it to the modal — including the "Tu es deja sur ce plan"
 * idempotency check, which the UI uses to disable the current-plan CTA.
 */
export async function updateExistingSubscription(params: {
  subscriptionId: string
  newPriceId: string
}): Promise<{ error: string | null }> {
  try {
    const subscription = await stripe.subscriptions.retrieve(params.subscriptionId)
    const currentItem = subscription.items.data[0]

    if (!currentItem) {
      return { error: 'Aucun item trouve dans l\'abonnement actuel' }
    }

    // If already on this price, nothing to do
    if (currentItem.price.id === params.newPriceId) {
      return { error: 'Tu es deja sur ce plan' }
    }

    await stripe.subscriptions.update(params.subscriptionId, {
      items: [
        {
          id: currentItem.id,
          price: params.newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    })

    return { error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de la mise a jour de l\'abonnement'
    return { error: message }
  }
}

interface BillingPortalResult {
  url: string | null
  error: string | null
}

/**
 * Create a Stripe Billing Portal session so the user can manage their
 * subscription — update card, cancel, download past invoices. The portal
 * stays Stripe-hosted by design. Phase 7 may custom-render some of these
 * surfaces in /billing, but cancellation + card update flows stay here.
 */
export async function createBillingPortalSession(params: {
  customerId: string
}): Promise<BillingPortalResult> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: `${APP_URL}/dashboard`,
    })

    return { url: session.url, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de la creation du portail'
    return { url: null, error: message }
  }
}
