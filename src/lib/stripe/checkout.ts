// =============================================================================
// checkout.ts — Subscription management helpers
// =============================================================================
//
// Tout est in-app : pas de Stripe Checkout hébergé, pas de Billing Portal.
// La page /billing rend sa propre UI de gestion (update CB, annulation,
// réactivation, téléchargement de factures).

import { stripe } from './client'

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

/**
 * Programmer l'annulation d'une souscription à la fin de la période en cours.
 * L'abonnement reste actif jusqu'à `current_period_end`, puis Stripe émettra
 * `customer.subscription.deleted` qui fera passer users.plan à 'free'.
 */
export async function cancelSubscriptionAtPeriodEnd(params: {
  subscriptionId: string
}): Promise<{ error: string | null }> {
  try {
    const sub = await stripe.subscriptions.retrieve(params.subscriptionId)
    if (sub.cancel_at_period_end) {
      return { error: 'Ton abonnement est déjà programmé pour s\'annuler.' }
    }
    if (sub.status === 'canceled') {
      return { error: 'Ton abonnement est déjà annulé.' }
    }
    await stripe.subscriptions.update(params.subscriptionId, {
      cancel_at_period_end: true,
    })
    return { error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de l\'annulation'
    return { error: message }
  }
}

/**
 * Annuler une annulation programmée (cancel_at_period_end = false). Possible
 * uniquement tant que la souscription n'est pas encore passée en 'canceled'.
 */
export async function reactivateSubscription(params: {
  subscriptionId: string
}): Promise<{ error: string | null }> {
  try {
    const sub = await stripe.subscriptions.retrieve(params.subscriptionId)
    if (sub.status === 'canceled') {
      return {
        error:
          'Cet abonnement est déjà terminé. Tu peux en souscrire un nouveau.',
      }
    }
    if (!sub.cancel_at_period_end) {
      return { error: 'Ton abonnement est déjà actif.' }
    }
    await stripe.subscriptions.update(params.subscriptionId, {
      cancel_at_period_end: false,
    })
    return { error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de la réactivation'
    return { error: message }
  }
}

/**
 * Créer un SetupIntent pour collecter une nouvelle méthode de paiement
 * (mise à jour de CB). Le front confirme via PaymentElement, puis on attache
 * le payment_method résultant à la souscription comme default_payment_method
 * via `setSubscriptionDefaultPaymentMethod`.
 */
export async function createSetupIntentForCard(params: {
  customerId: string
}): Promise<{ clientSecret: string | null; error: string | null }> {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: params.customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    })
    if (!setupIntent.client_secret) {
      return {
        clientSecret: null,
        error: 'Stripe n\'a pas renvoyé de client_secret.',
      }
    }
    return { clientSecret: setupIntent.client_secret, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de la création du SetupIntent'
    return { clientSecret: null, error: message }
  }
}

/**
 * Attacher la nouvelle méthode de paiement (confirmée côté client via
 * PaymentElement + SetupIntent) comme moyen de paiement par défaut de la
 * souscription ET du customer. Aussi appliqué aux futures factures.
 */
export async function setSubscriptionDefaultPaymentMethod(params: {
  customerId: string
  subscriptionId: string
  paymentMethodId: string
}): Promise<{ error: string | null }> {
  try {
    await stripe.customers.update(params.customerId, {
      invoice_settings: { default_payment_method: params.paymentMethodId },
    })
    await stripe.subscriptions.update(params.subscriptionId, {
      default_payment_method: params.paymentMethodId,
    })
    return { error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la carte'
    return { error: message }
  }
}
