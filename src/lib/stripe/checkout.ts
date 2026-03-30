import { stripe } from './client'
import { getTemplatePriceId } from './prices'
import { APP_URL } from '@/lib/constants'

interface CheckoutResult {
  url: string | null
  error: string | null
}

/**
 * Create a Stripe Checkout session for a subscription (Starter or Pro plan).
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
