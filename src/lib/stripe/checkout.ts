import { stripe } from './client'
import { getTemplatePriceId } from './prices'
import { APP_URL } from '@/lib/constants'

interface CheckoutResult {
  url: string | null
  error: string | null
}

/**
 * Create a Stripe Checkout session for a NEW subscription (user has no active sub).
 */
export async function createSubscriptionCheckout(params: {
  customerId: string
  priceId: string
  userId: string
}): Promise<CheckoutResult> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: params.customerId,
      mode: 'subscription',
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/dashboard?checkout=success`,
      cancel_url: `${APP_URL}/editor`,
      metadata: {
        userId: params.userId,
        type: 'subscription',
      },
      subscription_data: {
        metadata: {
          userId: params.userId,
        },
      },
    })

    return { url: session.url, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de la creation du checkout'
    return { url: null, error: message }
  }
}

/**
 * Update an existing subscription to a new price (upgrade, downgrade, or interval change).
 * Replaces the current subscription item — no stacking.
 * Proration is applied automatically.
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

/**
 * Create a Stripe Checkout session for a one-shot template purchase.
 */
export async function createTemplateCheckout(params: {
  customerId: string
  templateId: string
  userId: string
}): Promise<CheckoutResult> {
  const priceId = getTemplatePriceId(params.templateId)

  if (!priceId) {
    return { url: null, error: `Template "${params.templateId}" introuvable ou pas de prix associe` }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: params.customerId,
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/editor?template_purchased=${params.templateId}`,
      cancel_url: `${APP_URL}/editor`,
      metadata: {
        userId: params.userId,
        templateId: params.templateId,
        type: 'template',
      },
    })

    return { url: session.url, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de la creation du checkout'
    return { url: null, error: message }
  }
}

/**
 * Create a Stripe Billing Portal session so the user can manage their subscription.
 */
export async function createBillingPortalSession(params: {
  customerId: string
}): Promise<CheckoutResult> {
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
