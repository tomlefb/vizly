'use server'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { getSubscriptionPriceId, type BillingInterval } from '@/lib/stripe/prices'
import {
  createSubscriptionCheckout,
  updateExistingSubscription,
  createTemplateCheckout,
  createBillingPortalSession,
} from '@/lib/stripe/checkout'
import { TEMPLATES } from '@/lib/constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckoutResult {
  url: string | null
  error: string | null
}

interface SubscriptionUpdateResult {
  url: string | null
  updated: boolean
  error: string | null
}

interface BillingStatus {
  plan: 'free' | 'starter' | 'pro'
  purchasedTemplates: string[]
  error: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get or create a Stripe Customer for the authenticated user.
 * Stores the customer ID in the users table for future lookups.
 */
async function getOrCreateCustomerId(
  userId: string,
  email: string
): Promise<{ customerId: string; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (user?.stripe_customer_id) {
      return { customerId: user.stripe_customer_id, error: null }
    }

    // Create a new Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    })

    // Persist the customer ID
    await supabase
      .from('users')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId)

    return { customerId: customer.id, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de la creation du client Stripe'
    return { customerId: '', error: message }
  }
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Create or update a subscription for the user.
 *
 * - If the user has NO active subscription → create a new Checkout session.
 * - If the user already HAS a subscription → update it in-place (upgrade/downgrade/interval change).
 *   This ensures only ONE subscription exists at a time.
 */
export async function createSubscriptionCheckoutAction(
  plan: 'starter' | 'pro',
  interval: BillingInterval = 'monthly'
): Promise<SubscriptionUpdateResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { url: null, updated: false, error: 'Non authentifie' }
    }

    const priceId = getSubscriptionPriceId(plan, interval)

    if (!priceId) {
      return { url: null, updated: false, error: `Price ID introuvable pour le plan ${plan} (${interval})` }
    }

    // Check if user already has an active subscription
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    const { customerId, error: customerError } = await getOrCreateCustomerId(
      user.id,
      user.email ?? ''
    )

    if (customerError) {
      return { url: null, updated: false, error: customerError }
    }

    // User has an active subscription → update it in-place
    if (userData?.stripe_subscription_id) {
      const { error: updateError } = await updateExistingSubscription({
        subscriptionId: userData.stripe_subscription_id,
        newPriceId: priceId,
      })

      if (updateError) {
        return { url: null, updated: false, error: updateError }
      }

      // Subscription updated — Stripe fires customer.subscription.updated webhook
      // which will update the plan in DB
      return { url: null, updated: true, error: null }
    }

    // No active subscription → create a new Checkout session
    const result = await createSubscriptionCheckout({
      customerId,
      priceId,
      userId: user.id,
    })

    return { url: result.url, updated: false, error: result.error }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de la creation du checkout'
    return { url: null, updated: false, error: message }
  }
}

/**
 * Create a Stripe Checkout session for purchasing a premium template.
 */
export async function createTemplateCheckoutAction(
  templateId: string
): Promise<CheckoutResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { url: null, error: 'Non authentifie' }
    }

    // Validate that this is a valid premium template
    const premiumTemplates: readonly string[] = TEMPLATES.premium
    if (!premiumTemplates.includes(templateId)) {
      return {
        url: null,
        error: `"${templateId}" n'est pas un template premium valide`,
      }
    }

    // Check if user already purchased this template
    const { data: existing } = await supabase
      .from('purchased_templates')
      .select('id')
      .eq('user_id', user.id)
      .eq('template_id', templateId)
      .limit(1)
      .maybeSingle()

    if (existing) {
      return { url: null, error: 'Ce template a deja ete achete' }
    }

    const { customerId, error: customerError } = await getOrCreateCustomerId(
      user.id,
      user.email ?? ''
    )

    if (customerError) {
      return { url: null, error: customerError }
    }

    return await createTemplateCheckout({
      customerId,
      templateId,
      userId: user.id,
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de la creation du checkout'
    return { url: null, error: message }
  }
}

/**
 * Get the current billing status for the authenticated user:
 * their plan and list of purchased premium template IDs.
 */
export async function getBillingStatus(): Promise<BillingStatus> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { plan: 'free', purchasedTemplates: [], error: 'Non authentifie' }
    }

    // Fetch user plan
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (userError) {
      return { plan: 'free', purchasedTemplates: [], error: userError.message }
    }

    const plan = (userData?.plan ?? 'free') as 'free' | 'starter' | 'pro'

    // Fetch purchased templates
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchased_templates')
      .select('template_id')
      .eq('user_id', user.id)

    if (purchasesError) {
      return { plan, purchasedTemplates: [], error: purchasesError.message }
    }

    const purchasedTemplates = (purchases ?? []).map((p) => p.template_id)

    return { plan, purchasedTemplates, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de la recuperation du statut'
    return { plan: 'free', purchasedTemplates: [], error: message }
  }
}

/**
 * Create a Stripe Billing Portal session so the user can manage
 * their subscription (upgrade, downgrade, cancel, update payment method).
 */
export async function createBillingPortalAction(): Promise<CheckoutResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { url: null, error: 'Non authentifie' }
    }

    // Get customer ID from DB
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!userData?.stripe_customer_id) {
      return {
        url: null,
        error: 'Aucun compte Stripe associe. Souscrivez un plan d\'abord.',
      }
    }

    return await createBillingPortalSession({
      customerId: userData.stripe_customer_id,
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de la creation du portail'
    return { url: null, error: message }
  }
}
