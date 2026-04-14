// =============================================================================
// elements.ts — Stripe Elements server helpers (PaymentElement-based flow)
// =============================================================================
// Pure-Stripe lib for the new full-custom checkout. Three exports:
//
//   - createSubscriptionWithPaymentIntent  (subs in default_incomplete mode)
//   - createTemplatePaymentIntent          (one-shot template purchase)
//   - validatePromotionCode                (validate promo before applying)
//
// This module deliberately does NOT import from @/lib/supabase or any
// domain-layer code. It stays pure-Stripe so it can be:
//   1. Unit-tested with a single mock (the Stripe SDK), no Supabase mock
//   2. Reused from cron jobs / admin scripts without dragging Supabase in
//   3. Reasoned about as "creates Stripe objects" with no domain rules
//
// All domain checks (auth, "has user already bought this template?",
// "does user have a sub already?") live in the Server Action wrapper in
// src/actions/billing.ts. See Q1 verdict in STRIPE_MIGRATION_NOTES.md.
//
// API version note: written and tested against Stripe API 2026-03-25.dahlia
// (pinned in src/lib/stripe/client.ts). Notably, the canonical path to
// retrieve the client_secret of a default_incomplete subscription is now
// `latest_invoice.confirmation_secret.client_secret` — the legacy
// `latest_invoice.payment_intent` field has been removed from the top-level
// Invoice interface in dahlia. See STRIPE_MIGRATION_NOTES.md "Q2".

import { stripe } from './client'
import { getTemplatePriceId } from './prices'
import { TEMPLATES } from '@/lib/constants'

// ---------------------------------------------------------------------------
// validatePromotionCode
// ---------------------------------------------------------------------------

/**
 * Discriminated reasons returned to the caller when a promo is rejected.
 * The Server Action in billing.ts maps these to user-facing strings, and
 * the Phase 4 modal will eventually map those strings to French copy in
 * Vizly's voice. This module stays language-agnostic.
 */
export type PromotionCodeReason =
  | 'not_found'
  | 'expired'
  | 'max_redemptions_reached'
  | 'unknown_error'

export interface PromotionCodeValidation {
  valid: boolean
  promotionCodeId?: string
  percentOff?: number
  amountOff?: number
  currency?: string
  reason?: PromotionCodeReason
}

/**
 * Look up an active Stripe promotion code by its user-facing code text.
 * Returns a discriminated result instead of throwing — invalid codes are
 * a normal user flow, not exceptional.
 *
 * Note: Stripe distinguishes Coupon (the discount math) from PromotionCode
 * (the user-facing wrapper). This helper resolves the PromotionCode and
 * extracts the underlying Coupon's discount info so the caller can display
 * "−15%" or "−2,00 €" without a second round-trip.
 */
export async function validatePromotionCode(
  code: string,
): Promise<PromotionCodeValidation> {
  try {
    // dahlia: PromotionCode.coupon is now nested under PromotionCode.promotion.coupon
    // and is NOT auto-expanded by list endpoints. We expand explicitly so we
    // receive the full Coupon object (percent_off, amount_off, currency)
    // rather than just the coupon ID string.
    const list = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
      expand: ['data.promotion.coupon'],
    })
    const pc = list.data[0]
    if (!pc) return { valid: false, reason: 'not_found' }

    if (pc.expires_at && pc.expires_at * 1000 < Date.now()) {
      return { valid: false, reason: 'expired' }
    }
    if (
      pc.max_redemptions !== null &&
      pc.max_redemptions !== undefined &&
      pc.times_redeemed >= pc.max_redemptions
    ) {
      return { valid: false, reason: 'max_redemptions_reached' }
    }

    // After expand, promotion.coupon is the full Coupon object (not a string).
    // Defensive guard for the string-or-null case so TS is happy and we
    // catch any unexpected shape early.
    const coupon = pc.promotion.coupon
    if (!coupon || typeof coupon === 'string') {
      console.error(
        '[validatePromotionCode] expand failed: promotion.coupon is',
        typeof coupon,
      )
      return { valid: false, reason: 'unknown_error' }
    }

    return {
      valid: true,
      promotionCodeId: pc.id,
      percentOff: coupon.percent_off ?? undefined,
      amountOff: coupon.amount_off ?? undefined,
      currency: coupon.currency ?? undefined,
    }
  } catch (err) {
    console.error('[validatePromotionCode] Stripe error:', err)
    return { valid: false, reason: 'unknown_error' }
  }
}

// ---------------------------------------------------------------------------
// createSubscriptionWithPaymentIntent
// ---------------------------------------------------------------------------

/**
 * Create a Stripe Subscription in `default_incomplete` mode and return the
 * client_secret needed to confirm the first invoice via PaymentElement
 * client-side.
 *
 * The `payment_behavior: 'default_incomplete'` setting (audit debt #16)
 * is critical for SCA: it lets Stripe create the subscription with status
 * `incomplete`, generate the first invoice, finalize it, attach a
 * PaymentIntent, and return the PI's client_secret — all without trying
 * to charge the customer's saved payment method. The frontend then drives
 * the SCA challenge via stripe.confirmPayment(), and on success Stripe
 * activates the subscription.
 *
 * @throws If the subscription is created but no client_secret can be
 * extracted from latest_invoice.confirmation_secret. This is a fatal
 * misconfiguration (most likely a price configured for a method that
 * doesn't generate a PaymentIntent, e.g. send_invoice collection).
 *
 * `promotionCode` is the Stripe **promotion_code ID** (e.g. `promo_1Abc...`),
 * NOT the user-facing code text. Resolve via validatePromotionCode first.
 */
export async function createSubscriptionWithPaymentIntent(params: {
  userId: string
  customerId: string
  priceId: string
  promotionCode?: string
}): Promise<{ subscriptionId: string; clientSecret: string }> {
  const subscription = await stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
      // payment_method_types intentionnellement omis : on laisse Stripe
      // utiliser les méthodes activées dans le Dashboard compte via
      // inference automatique (Dynamic Payment Methods). Active Card,
      // Link, Apple Pay, Google Pay et toute autre méthode future via
      // Dashboard → Settings → Payment methods, pas via le code.
      //
      // Pourquoi : en Phase 4 (test visuel), l'ancienne config
      // `payment_method_types: ['card']` restreignait l'affichage au
      // seul formulaire carte et supprimait la tab Link. Le pattern
      // moderne Stripe (Dynamic Payment Methods) est explicitement de
      // NE PAS spécifier payment_method_types pour laisser Stripe
      // détecter automatiquement via la config compte + le browser.
      // Commentaire du type TS confirme : "If not set, Stripe attempts
      // to automatically determine the types to use..."
    },
    // dahlia: expand latest_invoice.confirmation_secret explicitly. The
    // confirmation_secret field is NOT included in the default response
    // payload despite the TS type declaring it as `?: ... | null` (which
    // suggests inline). Runtime verified via /tmp/stripe-diag.mjs during
    // Phase 4 debug: without this explicit expand, confirmation_secret
    // comes back as `undefined` even for finalized invoices. See
    // STRIPE_MIGRATION_NOTES.md "Post-mortem Phase 4".
    expand: ['latest_invoice.confirmation_secret'],
    metadata: {
      userId: params.userId,
      type: 'subscription',
    },
    automatic_tax: {
      // Tuyauterie Stripe Tax prête mais désactivée en franchise en base
      // de TVA. Flip STRIPE_TAX_ENABLED=true le jour où Vizly sort de la
      // franchise — aucun autre changement de code requis.
      enabled: process.env.STRIPE_TAX_ENABLED === 'true',
    },
    collection_method: 'charge_automatically',
    ...(params.promotionCode && {
      discounts: [{ promotion_code: params.promotionCode }],
    }),
  })

  const invoice = subscription.latest_invoice
  if (!invoice || typeof invoice === 'string') {
    throw new Error(
      'Stripe subscription created but latest_invoice was not expanded — bug in expand config',
    )
  }

  // confirmation_secret.type is 'payment_intent' for default_incomplete subs.
  // Add an assertion here if Stripe introduces other confirmation types in the future.
  const clientSecret = invoice.confirmation_secret?.client_secret
  if (!clientSecret) {
    throw new Error(
      'Stripe subscription created but no confirmation_secret returned — check price configuration',
    )
  }

  return {
    subscriptionId: subscription.id,
    clientSecret,
  }
}

// ---------------------------------------------------------------------------
// createTemplatePaymentIntent
// ---------------------------------------------------------------------------

/**
 * Discount info passed in by the Server Action after it has resolved the
 * promotion code via validatePromotionCode. We need the actual discount
 * math here because PaymentIntents (unlike Subscriptions) do NOT support
 * promotion_codes natively — we have to compute the discounted amount
 * server-side and pass an adjusted `amount` to Stripe.
 */
export interface PromotionDiscount {
  percentOff?: number
  amountOff?: number
  currency?: string
}

/**
 * Create a one-shot Stripe PaymentIntent for a premium template purchase.
 *
 * This function is pure-Stripe + constants: it verifies that the template
 * is in TEMPLATES.premium (a constants check, no DB), retrieves the price
 * from Stripe (single source of truth — never hardcode), optionally
 * applies a discount, and creates the PaymentIntent.
 *
 * It does NOT check whether the user has already purchased the template —
 * that DB-level check lives in createTemplateIntentAction (Server Action)
 * to keep this module Supabase-free. See Q1 verdict.
 *
 * Throws (with stable string messages) on:
 *   - Template not in TEMPLATES.premium → 'Template not eligible for purchase'
 *   - Stripe price misconfigured (no unit_amount, wrong currency)
 *   - Promo code currency mismatch → 'invalid_promotion_code_currency'
 *   - Discounted amount below Stripe EUR minimum (50 cents) → 'discount_too_large'
 *
 * The Server Action wrapper maps these stable messages to client-facing
 * error strings.
 */
export async function createTemplatePaymentIntent(params: {
  userId: string
  customerId: string
  templateId: string
  promotionCode?: string
  promotionDiscount?: PromotionDiscount
}): Promise<{ paymentIntentId: string; clientSecret: string }> {
  // 1. Constants check — is this template in the premium list?
  const premiumTemplates = TEMPLATES.premium as readonly string[]
  if (!premiumTemplates.includes(params.templateId)) {
    throw new Error('Template not eligible for purchase')
  }

  // 2. Resolve Stripe price ID from env-mapped constants.
  const priceId = getTemplatePriceId(params.templateId)
  if (!priceId) {
    throw new Error(
      `No Stripe price configured for template "${params.templateId}"`,
    )
  }

  // 3. Single source of truth for amount: read from the Stripe Price.
  // Never hardcode. If you change the price in Dashboard, this stays
  // correct without redeploy.
  const price = await stripe.prices.retrieve(priceId)
  if (!price.unit_amount) {
    throw new Error(
      `Stripe price ${priceId} has no unit_amount — must be a fixed-amount price`,
    )
  }
  if (price.currency !== 'eur') {
    throw new Error(
      `Stripe price ${priceId} currency is "${price.currency}" — Vizly only sells in EUR`,
    )
  }

  let amount = price.unit_amount
  let discountAmountCents = 0

  // 4. Apply the discount math if a promo was passed in.
  if (params.promotionDiscount) {
    const { percentOff, amountOff, currency } = params.promotionDiscount
    if (percentOff !== undefined) {
      const discounted = Math.round(amount * (1 - percentOff / 100))
      discountAmountCents = amount - discounted
      amount = discounted
    } else if (amountOff !== undefined) {
      // Hard reject mismatched currency rather than silently skip or
      // auto-convert. Forces the admin to create a EUR coupon explicitly.
      if (currency && currency !== 'eur') {
        throw new Error('invalid_promotion_code_currency')
      }
      const discounted = Math.max(0, amount - amountOff)
      discountAmountCents = amount - discounted
      amount = discounted
    }

    // Stripe minimum for an EUR card PaymentIntent is 50 cents. Below
    // that, Stripe rejects the create with a cryptic error. We pre-empt
    // here so the caller gets a stable 'discount_too_large' message.
    // Note: amount === 0 is also rejected here — see Q4 verdict (a 0€ PI
    // would fire a different webhook event that breaks the Phase 3
    // handlers).
    if (amount < 50) {
      throw new Error('discount_too_large')
    }
  }

  // 5. Create the PaymentIntent. automatic_payment_methods.enabled = true
  // lets Stripe surface CB + Apple Pay + Google Pay + Link automatically
  // based on the merchant's Dashboard config and the device.
  //
  // automatic_tax is NOT set on PaymentIntents in the same way as on
  // Subscriptions — for one-shot tax, you'd use stripe.taxCalculations.
  // Since Vizly is in franchise en base de TVA (no tax collected), this
  // is moot for now. TODO if STRIPE_TAX_ENABLED is ever flipped to true,
  // wire in a TaxCalculation here before the PI create.
  const pi = await stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    customer: params.customerId,
    metadata: {
      userId: params.userId,
      templateId: params.templateId,
      type: 'template',
      ...(params.promotionCode && {
        promotion_code_applied: params.promotionCode,
        discount_amount_cents: String(discountAmountCents),
      }),
    },
    automatic_payment_methods: { enabled: true },
  })

  if (!pi.client_secret) {
    throw new Error(
      'Stripe payment intent created but no client_secret returned — should never happen',
    )
  }

  return {
    paymentIntentId: pi.id,
    clientSecret: pi.client_secret,
  }
}
