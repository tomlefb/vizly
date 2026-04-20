// =============================================================================
// checkout.ts — Subscription management helpers
// =============================================================================
//
// Tout est in-app : pas de Stripe Checkout hébergé, pas de Billing Portal.
// La page /billing rend sa propre UI de gestion (update CB, annulation,
// réactivation, téléchargement de factures).

import { stripe } from './client'
import type Stripe from 'stripe'

/**
 * Update an existing subscription to a new price IMMEDIATELY — utilisé
 * pour les upgrades (Starter→Pro, monthly→yearly au sein du même plan).
 * Les downgrades passent par `scheduleChangeAtPeriodEnd` à la place pour
 * que les features Pro restent accessibles jusqu'à la fin de la période
 * payée. L'aiguillage upgrade vs downgrade se fait côté action
 * (`changeSubscriptionPlanAction`) via `classifySubscriptionChange`.
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
 * Programmer un changement de plan/interval à la fin de la période en cours
 * via Stripe Subscription Schedules. Utilisé pour tous les downgrades
 * (Pro→Starter, yearly→monthly d'un même plan). L'abonnement reste sur
 * son plan courant jusqu'à `current_period_end`, puis Stripe bascule
 * automatiquement vers le nouveau price (event `customer.subscription.updated`
 * avec items modifiés — le webhook détecte alors le bascule effectif).
 *
 * Idempotence : si un schedule existe déjà sur la subscription (rare :
 * l'UI refuse normalement un 2e click downgrade quand un est déjà actif),
 * on update le schedule existant pour remplacer la phase future au lieu
 * de créer un doublon.
 *
 * Renvoie le schedule créé/mis à jour pour que l'action puisse :
 *   - stocker `stripe_schedule_id` + `pending_plan/interval/effective_at` en DB
 *   - fire l'email "Ton plan passera en X le {date}" au clic
 */
export async function scheduleChangeAtPeriodEnd(params: {
  subscriptionId: string
  newPriceId: string
}): Promise<{ schedule: Stripe.SubscriptionSchedule | null; error: string | null }> {
  try {
    const subscription = await stripe.subscriptions.retrieve(params.subscriptionId)
    const currentItem = subscription.items.data[0]

    if (!currentItem) {
      return { schedule: null, error: 'Aucun item trouve dans l\'abonnement actuel' }
    }

    if (currentItem.price.id === params.newPriceId) {
      return { schedule: null, error: 'Tu es deja sur ce plan' }
    }

    // Stripe attache schedule.id à la subscription une fois créé. Si on
    // retrouve déjà une valeur, on réutilise ce schedule pour éviter les
    // doublons (Stripe refuse d'en créer un 2e sur la même sub).
    const existingScheduleRef = subscription.schedule
    const existingScheduleId =
      typeof existingScheduleRef === 'string'
        ? existingScheduleRef
        : (existingScheduleRef?.id ?? null)

    let schedule: Stripe.SubscriptionSchedule
    if (existingScheduleId) {
      schedule = await stripe.subscriptionSchedules.retrieve(existingScheduleId)
    } else {
      schedule = await stripe.subscriptionSchedules.create({
        from_subscription: params.subscriptionId,
      })
    }

    const currentPhase = schedule.phases[0]
    if (!currentPhase) {
      return { schedule: null, error: 'Planning d\'abonnement invalide (aucune phase courante)' }
    }

    // Reconstruit les items de la phase courante en conservant le price
    // en cours. Stripe renvoie `price` parfois en string parfois expandé
    // en objet selon le mode de retrieve — on normalise en string id.
    const currentPhaseItems = currentPhase.items.map((item) => ({
      price: typeof item.price === 'string' ? item.price : item.price.id,
      quantity: item.quantity ?? 1,
    }))

    const updated = await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: 'release',
      phases: [
        {
          items: currentPhaseItems,
          start_date: currentPhase.start_date,
          end_date: currentPhase.end_date ?? undefined,
        },
        {
          items: [{ price: params.newPriceId, quantity: 1 }],
        },
      ],
    })

    return { schedule: updated, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de la programmation du changement de plan'
    return { schedule: null, error: message }
  }
}

/**
 * Libère un Subscription Schedule : supprime la phase future et remet la
 * subscription sur un rythme normal (plan courant perdure). Utilisé quand
 * l'user revient sur son downgrade (re-click Pro) ou quand il choisit
 * d'annuler complètement l'abo (dans ce cas on release + cancel_at_period_end).
 */
export async function releaseSubscriptionSchedule(params: {
  scheduleId: string
}): Promise<{ error: string | null }> {
  try {
    await stripe.subscriptionSchedules.release(params.scheduleId)
    return { error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de l\'annulation du changement de plan'
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
