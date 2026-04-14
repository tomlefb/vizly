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
import {
  createSubscriptionWithPaymentIntent,
  createTemplatePaymentIntent,
  validatePromotionCode,
  type PromotionDiscount,
} from '@/lib/stripe/elements'
import { getCustomerInvoiceSettings } from '@/lib/stripe/invoice-metadata'
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

    // Create a new Stripe customer.
    //
    // The invoice_settings, address.country and preferred_locales fields
    // below are applied ONLY at creation. Existing customers (created
    // before Phase 2) will NOT be retroactively updated by this code path.
    // If we ever need to backfill them, write a one-time admin script
    // that loops over users.stripe_customer_id and calls
    // stripe.customers.update with the same fields. See STRIPE_MIGRATION_NOTES.md.
    //
    // address.country: 'FR' is a sane default for Vizly's launch market.
    // The real country can be collected later via a billing form and
    // updated via stripe.customers.update without breaking anything here.
    //
    // preferred_locales: ['fr'] makes Stripe-native emails (e.g. invoice
    // receipts, dispute notifications) display in French.
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
      invoice_settings: getCustomerInvoiceSettings(),
      address: { country: 'FR' },
      preferred_locales: ['fr'],
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

// ===========================================================================
// Phase 2 — Stripe Elements server actions (PaymentElement-based)
// ===========================================================================
//
// The three actions below are the new path for the Stripe Elements
// integration. They run in PARALLEL with the legacy
// createSubscriptionCheckoutAction / createTemplateCheckoutAction (which
// redirect to hosted Checkout) until Phase 6 cuts the UI over and the old
// path is deleted.
//
// All three return a discriminated union { ok: true, ... } | { ok: false, error }
// so consumers MUST handle both branches. We never throw across the
// Server Action boundary — Stripe error stack traces stay server-side,
// the client gets a stable string error code that the modal in Phase 4
// will map to French copy in Vizly's voice.

type SubscriptionIntentResult =
  | { ok: true; clientSecret: string; subscriptionId: string }
  | { ok: false; error: string }

type TemplateIntentResult =
  | { ok: true; clientSecret: string; paymentIntentId: string }
  | { ok: false; error: string }

type PromotionCodeValidationResult =
  | {
      ok: true
      discount: { percentOff?: number; amountOff?: number; currency?: string }
    }
  | { ok: false; error: string }

/**
 * Create a default_incomplete subscription and return its client_secret
 * so the frontend can confirm it via PaymentElement.
 *
 * Defensive duplicate-sub check: query BOTH the new local subscriptions
 * table AND the legacy users.stripe_subscription_id column. The local
 * table is populated starting at Phase 3 (webhook), but during the
 * Phase 2→6 transition window users with a legacy sub still need to be
 * blocked from creating a duplicate.
 *
 * TODO Phase 6: drop the hasLegacySub check once the legacy column is
 * retired and all subs live in the local table.
 */
export async function createSubscriptionIntentAction({
  plan,
  interval,
  promotionCode,
}: {
  plan: 'starter' | 'pro'
  interval: BillingInterval
  promotionCode?: string
}): Promise<SubscriptionIntentResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'not_authenticated' }

    // Defensive double-check during Phase 2→6 transition. See note above.
    const [localSubResult, legacyUserResult] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('users')
        .select('stripe_subscription_id')
        .eq('id', user.id)
        .single(),
    ])

    const hasLocalSub = localSubResult.data !== null
    const hasLegacySub =
      legacyUserResult.data?.stripe_subscription_id !== null &&
      legacyUserResult.data?.stripe_subscription_id !== undefined

    if (hasLocalSub || hasLegacySub) {
      return { ok: false, error: 'subscription_already_active' }
    }

    // Resolve the promotion code (if any) to its Stripe ID before passing
    // it to the lib helper. The lib expects an ID, not the user-facing
    // code text — Stripe distinguishes the two.
    let promotionCodeId: string | undefined
    if (promotionCode) {
      const validation = await validatePromotionCode(promotionCode)
      if (!validation.valid) {
        return { ok: false, error: 'invalid_promotion_code' }
      }
      promotionCodeId = validation.promotionCodeId
    }

    const { customerId, error: customerError } = await getOrCreateCustomerId(
      user.id,
      user.email ?? '',
    )
    if (customerError) {
      return { ok: false, error: 'customer_creation_failed' }
    }

    const priceId = getSubscriptionPriceId(plan, interval)
    if (!priceId) {
      return { ok: false, error: 'price_not_configured' }
    }

    const { subscriptionId, clientSecret } =
      await createSubscriptionWithPaymentIntent({
        userId: user.id,
        customerId,
        priceId,
        promotionCode: promotionCodeId,
      })

    return { ok: true, clientSecret, subscriptionId }
  } catch (err) {
    console.error('[createSubscriptionIntentAction]', err)
    return { ok: false, error: 'unknown_error' }
  }
}

/**
 * Create a one-shot PaymentIntent for purchasing a premium template.
 *
 * Domain-layer checks live in this Server Action (auth, "already
 * purchased?") to keep the lib helper in src/lib/stripe/elements.ts
 * pure-Stripe and Supabase-free. See Q1 verdict.
 */
export async function createTemplateIntentAction({
  templateId,
  promotionCode,
}: {
  templateId: string
  promotionCode?: string
}): Promise<TemplateIntentResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'not_authenticated' }

    // Defensive premium check against the local constants list, in
    // addition to the same check inside the lib helper. Rejecting early
    // here saves a Stripe round-trip on bad input.
    const premiumTemplates: readonly string[] = TEMPLATES.premium
    if (!premiumTemplates.includes(templateId)) {
      return { ok: false, error: 'template_not_eligible' }
    }

    // DB-level check: has this user already purchased this template?
    // Lives here (not in the lib) because the lib stays Supabase-free.
    const { data: existingPurchase } = await supabase
      .from('purchased_templates')
      .select('id')
      .eq('user_id', user.id)
      .eq('template_id', templateId)
      .maybeSingle()

    if (existingPurchase) {
      return { ok: false, error: 'template_already_purchased' }
    }

    // Resolve the promo code if provided. We need BOTH the ID (for
    // metadata on the PI) AND the discount info (for amount math —
    // PaymentIntents don't apply promo_codes natively).
    let promotionCodeId: string | undefined
    let promotionDiscount: PromotionDiscount | undefined
    if (promotionCode) {
      const validation = await validatePromotionCode(promotionCode)
      if (!validation.valid) {
        return { ok: false, error: 'invalid_promotion_code' }
      }
      promotionCodeId = validation.promotionCodeId
      promotionDiscount = {
        percentOff: validation.percentOff,
        amountOff: validation.amountOff,
        currency: validation.currency,
      }
    }

    const { customerId, error: customerError } = await getOrCreateCustomerId(
      user.id,
      user.email ?? '',
    )
    if (customerError) {
      return { ok: false, error: 'customer_creation_failed' }
    }

    try {
      const { paymentIntentId, clientSecret } = await createTemplatePaymentIntent({
        userId: user.id,
        customerId,
        templateId,
        promotionCode: promotionCodeId,
        promotionDiscount,
      })
      return { ok: true, clientSecret, paymentIntentId }
    } catch (libErr) {
      // Lib throws are domain errors with stable message strings we can
      // map directly. Anything else falls through to unknown_error.
      const message = libErr instanceof Error ? libErr.message : ''
      if (message === 'invalid_promotion_code_currency') {
        return { ok: false, error: 'invalid_promotion_code_currency' }
      }
      if (message === 'discount_too_large') {
        return { ok: false, error: 'discount_too_large' }
      }
      if (message === 'Template not eligible for purchase') {
        return { ok: false, error: 'template_not_eligible' }
      }
      console.error('[createTemplateIntentAction] lib error:', message, libErr)
      return { ok: false, error: 'unknown_error' }
    }
  } catch (err) {
    console.error('[createTemplateIntentAction]', err)
    return { ok: false, error: 'unknown_error' }
  }
}

/**
 * Validate a user-facing promo code against Stripe's promotion_codes
 * catalog. Used by the Phase 4 modal to display the discount preview
 * BEFORE the user confirms payment.
 *
 * Maps the lib's `reason` enum to a stable error string. The Phase 4
 * modal then maps these strings to French copy in Vizly's voice.
 */
export async function validatePromotionCodeAction(
  code: string,
): Promise<PromotionCodeValidationResult> {
  try {
    const validation = await validatePromotionCode(code)
    if (!validation.valid) {
      return { ok: false, error: validation.reason ?? 'unknown_error' }
    }
    return {
      ok: true,
      discount: {
        percentOff: validation.percentOff,
        amountOff: validation.amountOff,
        currency: validation.currency,
      },
    }
  } catch (err) {
    console.error('[validatePromotionCodeAction]', err)
    return { ok: false, error: 'unknown_error' }
  }
}
