'use server'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { getSubscriptionPriceId, type BillingInterval } from '@/lib/stripe/prices'
import {
  updateExistingSubscription,
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
// Stripe Elements server actions (PaymentElement-based)
// ===========================================================================
//
// The three actions below are the single path for starting a Stripe
// payment flow from the client. Phase 6 removed the legacy
// createSubscriptionCheckoutAction / createTemplateCheckoutAction which
// used to redirect to the hosted Stripe Checkout — everything now runs
// in-app via PaymentElement.
//
// All three return a discriminated union { ok: true, ... } | { ok: false, error }
// so consumers MUST handle both branches. We never throw across the
// Server Action boundary — Stripe error stack traces stay server-side,
// the client gets a stable string error code that the modals map to
// French copy in Vizly's voice.

type SubscriptionIntentResult =
  | { ok: true; clientSecret: string; subscriptionId: string }
  | { ok: false; error: string }

type TemplateIntentResult =
  | {
      ok: true
      clientSecret: string
      paymentIntentId: string
      /**
       * Final charged amount + currency from the Stripe Price (post any
       * promo discount). Surfaced so the TemplatePurchaseModal can display
       * the authoritative price in the recap and the "Payer X,XX €" CTA
       * without a separate round-trip or a stale constants lookup.
       */
      pricing: { amountCents: number; currency: string }
    }
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
 * Defensive duplicate-sub check: query the local subscriptions table
 * (Phase 3 source of truth, populated by the webhook). The legacy
 * users.stripe_subscription_id fallback was removed in Phase 6.
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

    // Defensive duplicate-sub check using the local subscriptions table
    // (Phase 3 source of truth, populated by the webhook). Phase 6 removed
    // the legacy users.stripe_subscription_id fallback that existed during
    // the Phase 2→6 transition — by Phase 6, all active subs live in the
    // local table, the legacy column is no longer authoritative.
    //
    // Subscription statuses that indicate a real active commitment from the
    // user, blocking the creation of a new subscription. Excluded on purpose
    // (non-blocking):
    //   - 'incomplete': checkout in progress or abandoned <24h. Stripe will
    //     garbage-collect automatically. Blocking here would prevent
    //     legitimate flows like applying a promo code (which recreates the
    //     intent) or retrying a checkout after closing the modal.
    //   - 'incomplete_expired': checkout abandoned >24h, already expired
    //     by Stripe.
    //   - 'canceled': user cancelled, fully allowed to re-subscribe.
    const BLOCKING_STATUSES = new Set([
      'active',
      'trialing',
      'past_due',
      'unpaid',
    ])

    const { data: localSub } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (localSub !== null && BLOCKING_STATUSES.has(localSub.status)) {
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
      const { paymentIntentId, clientSecret, pricing } =
        await createTemplatePaymentIntent({
          userId: user.id,
          customerId,
          templateId,
          promotionCode: promotionCodeId,
          promotionDiscount,
        })
      return { ok: true, clientSecret, paymentIntentId, pricing }
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

// ---------------------------------------------------------------------------
// changeSubscriptionPlanAction (Phase 6 — upgrade/downgrade flow)
// ---------------------------------------------------------------------------

type ChangeSubscriptionPlanResult =
  | { ok: true; message: string }
  | { ok: false; error: string }

/**
 * Change the plan of an EXISTING active subscription (upgrade/downgrade
 * Starter ↔ Pro, or interval switch monthly ↔ yearly). This is a direct
 * Stripe mutation via `updateExistingSubscription` — it does NOT need a
 * client-side PaymentElement confirmation because no new payment method
 * is being collected. The new charge (with proration) happens server-side
 * via Stripe Billing.
 *
 * Distinct from `createSubscriptionIntentAction` which is for the
 * "no sub yet → create one and confirm via PaymentElement" flow.
 *
 * Sync side-effects:
 *   - Stripe fires `customer.subscription.updated` webhook → Phase 3
 *     handler updates the local `subscriptions` table + dispatches the
 *     `plan-changed` or `billing-period-changed` email
 *   - This action returns immediately without waiting — UI shows a
 *     success message and the user sees the updated plan after a refresh
 */
export async function changeSubscriptionPlanAction({
  plan,
  interval,
}: {
  plan: 'starter' | 'pro'
  interval: BillingInterval
}): Promise<ChangeSubscriptionPlanResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'not_authenticated' }

    // Read the local subscriptions table (Phase 3 source of truth) to find
    // the user's active stripe_subscription_id. Fallback on the legacy
    // users.stripe_subscription_id column for the Phase 6 cleanup window
    // — to be removed once Phase 7 confirms the legacy column is unused.
    const { data: localSub } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let subscriptionId = localSub?.stripe_subscription_id ?? null

    if (!subscriptionId) {
      const { data: legacyUser } = await supabase
        .from('users')
        .select('stripe_subscription_id')
        .eq('id', user.id)
        .single()
      subscriptionId = legacyUser?.stripe_subscription_id ?? null
    }

    if (!subscriptionId) {
      return { ok: false, error: 'no_active_subscription' }
    }

    const newPriceId = getSubscriptionPriceId(plan, interval)
    if (!newPriceId) {
      return { ok: false, error: 'price_not_configured' }
    }

    const { error: updateError } = await updateExistingSubscription({
      subscriptionId,
      newPriceId,
    })

    if (updateError) {
      // updateExistingSubscription returns a French message like
      // "Tu es deja sur ce plan" — pass it through for the modal to display.
      return { ok: false, error: updateError }
    }

    return { ok: true, message: 'Plan mis à jour.' }
  } catch (err) {
    console.error('[changeSubscriptionPlanAction]', err)
    return { ok: false, error: 'unknown_error' }
  }
}
