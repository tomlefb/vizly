'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/client'
import {
  getSubscriptionPriceId,
  classifySubscriptionChange,
  type BillingInterval,
} from '@/lib/stripe/prices'
import {
  updateExistingSubscription,
  cancelSubscriptionAtPeriodEnd,
  reactivateSubscription,
  createSetupIntentForCard,
  setSubscriptionDefaultPaymentMethod,
  scheduleChangeAtPeriodEnd,
  releaseSubscriptionSchedule,
} from '@/lib/stripe/checkout'
import { sendEmail } from '@/lib/emails/send'
import {
  createSubscriptionWithPaymentIntent,
  createTemplatePaymentIntent,
  validatePromotionCode,
  type PromotionDiscount,
} from '@/lib/stripe/elements'
import { getCustomerInvoiceSettings } from '@/lib/stripe/invoice-metadata'
import { TEMPLATES, PLANS } from '@/lib/constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BillingStatus {
  plan: 'free' | 'starter' | 'pro'
  purchasedTemplates: string[]
  error: string | null
}

export interface BillingSubscriptionSummary {
  status: string
  interval: 'monthly' | 'yearly'
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  // Downgrade programmé via Subscription Schedule. Les 3 champs sont
  // remplis ensemble (contrainte DB) ou tous null.
  pending_plan: 'starter' | 'pro' | null
  pending_interval: 'monthly' | 'yearly' | null
  pending_effective_at: string | null
}

export interface BillingInvoiceSummary {
  id: string
  number: string | null
  amount_paid: number
  currency: string
  hosted_invoice_url: string | null
  invoice_pdf: string | null
  paid_at: string
}

export interface BillingDetails {
  plan: 'free' | 'starter' | 'pro'
  subscription: BillingSubscriptionSummary | null
  invoices: BillingInvoiceSummary[]
  purchasedTemplates: string[]
  error: string | null
}

export interface AccountOverview {
  plan: 'free' | 'starter' | 'pro'
  interval: 'monthly' | 'yearly' | null
  priceCents: number | null
  nextBillingDate: string | null
  cancelAtPeriodEnd: boolean
  cardLast4: string | null
  cardBrand: string | null
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
 * Read the rich billing snapshot for the authenticated user — plan,
 * full subscription state (status, interval, periods, cancellation),
 * paid invoices history, and purchased premium templates.
 *
 * 100% local DB, zero Stripe live calls. The `subscriptions` and
 * `invoices` tables are kept in sync by the webhook handlers
 * (Phase 3 pipeline). RLS on both tables already restricts SELECT
 * to the user's own rows, so the request is naturally scoped.
 *
 * Source-of-truth contract (Phase 7.5):
 *
 *   - `users.plan` is the canonical source for the displayed plan.
 *     Always present — it has been on the schema since migration 001.
 *
 *   - `subscriptions` row is an OPTIONAL ENRICHMENT, not authoritative.
 *     It carries `interval`, `current_period_end`, `cancel_at_period_end`
 *     etc. Some legacy users (pre-Phase-1, or webhook hydration miss)
 *     have `users.plan = 'pro'` with NO `subscriptions` row. The UI
 *     must handle this fallback gracefully — show the plan + features
 *     from PLANS constants, hide the "next billing" / cancel state.
 *
 * Used by /billing (Phase 7 rewrite). The lighter `getBillingStatus`
 * stays around for `useEditorState`, which only needs `plan` +
 * `purchasedTemplates` and shouldn't pay for the extra round-trips.
 */
export async function getBillingDetails(): Promise<BillingDetails> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        plan: 'free',
        subscription: null,
        invoices: [],
        purchasedTemplates: [],
        error: 'Non authentifie',
      }
    }

    const [userRes, subRes, invoicesRes, templatesRes] = await Promise.all([
      supabase.from('users').select('plan').eq('id', user.id).single(),
      supabase
        .from('subscriptions')
        .select(
          'status, interval, current_period_end, cancel_at_period_end, canceled_at, pending_plan, pending_interval, pending_effective_at',
        )
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('invoices')
        .select(
          'stripe_invoice_id, number, amount_paid, currency, hosted_invoice_url, invoice_pdf, paid_at',
        )
        .eq('user_id', user.id)
        .order('paid_at', { ascending: false }),
      supabase
        .from('purchased_templates')
        .select('template_id')
        .eq('user_id', user.id),
    ])

    if (userRes.error) {
      return {
        plan: 'free',
        subscription: null,
        invoices: [],
        purchasedTemplates: [],
        error: userRes.error.message,
      }
    }

    const plan = (userRes.data?.plan ?? 'free') as 'free' | 'starter' | 'pro'

    // The `subscriptions` row is only present for users who paid at least
    // once. A canceled-then-resubscribed user gets the latest row via
    // onConflict='user_id' upsert in the webhook (see Phase 3 notes).
    const subRow = subRes.data
    const subscription: BillingSubscriptionSummary | null =
      subRow && (subRow.interval === 'monthly' || subRow.interval === 'yearly')
        ? {
            status: subRow.status,
            interval: subRow.interval,
            current_period_end: subRow.current_period_end,
            cancel_at_period_end: subRow.cancel_at_period_end,
            canceled_at: subRow.canceled_at,
            pending_plan:
              subRow.pending_plan === 'starter' || subRow.pending_plan === 'pro'
                ? subRow.pending_plan
                : null,
            pending_interval:
              subRow.pending_interval === 'monthly' || subRow.pending_interval === 'yearly'
                ? subRow.pending_interval
                : null,
            pending_effective_at: subRow.pending_effective_at,
          }
        : null

    const invoices: BillingInvoiceSummary[] = (invoicesRes.data ?? [])
      .filter((row) => row.paid_at !== null)
      .map((row) => ({
        id: row.stripe_invoice_id,
        number: row.number,
        amount_paid: row.amount_paid,
        currency: row.currency,
        hosted_invoice_url: row.hosted_invoice_url,
        invoice_pdf: row.invoice_pdf,
        paid_at: row.paid_at as string,
      }))

    const purchasedTemplates = (templatesRes.data ?? []).map((t) => t.template_id)

    return {
      plan,
      subscription,
      invoices,
      purchasedTemplates,
      error: null,
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur lors de la recuperation du statut'
    return {
      plan: 'free',
      subscription: null,
      invoices: [],
      purchasedTemplates: [],
      error: message,
    }
  }
}

// ---------------------------------------------------------------------------
// Helper : retrouve le stripe_subscription_id actif de l'utilisateur courant.
// Source de vérité Phase 3 : table subscriptions. Fallback legacy users row.
// ---------------------------------------------------------------------------

async function getActiveSubscriptionIdForUser(
  userId: string,
): Promise<{ subscriptionId: string | null; customerId: string | null; error: string | null }> {
  const supabase = await createClient()

  const { data: localSub } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .maybeSingle()

  let subscriptionId = localSub?.stripe_subscription_id ?? null

  const { data: userRow } = await supabase
    .from('users')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('id', userId)
    .single()

  if (!subscriptionId) {
    subscriptionId = userRow?.stripe_subscription_id ?? null
  }

  const customerId = userRow?.stripe_customer_id ?? null

  if (!subscriptionId) {
    return {
      subscriptionId: null,
      customerId,
      error: 'Aucun abonnement actif trouvé.',
    }
  }

  return { subscriptionId, customerId, error: null }
}

// ---------------------------------------------------------------------------
// cancelSubscriptionAction — programme l'annulation à la fin de la période
// ---------------------------------------------------------------------------

type CancelSubscriptionResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Annule un changement de plan/interval programmé (release le Subscription
 * Schedule Stripe + purge les pending_* de la DB). L'user reste sur son
 * plan courant comme avant le clic Downgrade.
 */
export async function cancelScheduledChangeAction(): Promise<CancelSubscriptionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'not_authenticated' }

    const { data: localSub } = await supabase
      .from('subscriptions')
      .select('stripe_schedule_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!localSub?.stripe_schedule_id) {
      return { ok: false, error: 'no_scheduled_change' }
    }

    const { error: releaseError } = await releaseSubscriptionSchedule({
      scheduleId: localSub.stripe_schedule_id,
    })
    if (releaseError) return { ok: false, error: releaseError }

    const admin = createAdminClient()
    await admin
      .from('subscriptions')
      .update({
        stripe_schedule_id: null,
        pending_plan: null,
        pending_interval: null,
        pending_effective_at: null,
      })
      .eq('user_id', user.id)

    revalidatePath('/billing')
    return { ok: true }
  } catch (err) {
    console.error('[cancelScheduledChangeAction]', err)
    return { ok: false, error: 'unknown_error' }
  }
}

export async function cancelSubscriptionAction(): Promise<CancelSubscriptionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'not_authenticated' }

    const { subscriptionId, error: lookupError } =
      await getActiveSubscriptionIdForUser(user.id)
    if (!subscriptionId) {
      return { ok: false, error: lookupError ?? 'no_active_subscription' }
    }

    // Si un downgrade est programmé, Stripe refuse `cancel_at_period_end`
    // tant qu'un Subscription Schedule actif existe. On release d'abord,
    // puis on programme l'annulation → comportement attendu : l'abo
    // s'arrête au period_end comme si l'user avait simplement cliqué Cancel.
    const { data: localSub } = await supabase
      .from('subscriptions')
      .select('stripe_schedule_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (localSub?.stripe_schedule_id) {
      const { error: releaseError } = await releaseSubscriptionSchedule({
        scheduleId: localSub.stripe_schedule_id,
      })
      if (releaseError) return { ok: false, error: releaseError }

      const admin = createAdminClient()
      await admin
        .from('subscriptions')
        .update({
          stripe_schedule_id: null,
          pending_plan: null,
          pending_interval: null,
          pending_effective_at: null,
        })
        .eq('user_id', user.id)
    }

    const { error } = await cancelSubscriptionAtPeriodEnd({ subscriptionId })
    if (error) return { ok: false, error }

    revalidatePath('/billing')
    return { ok: true }
  } catch (err) {
    console.error('[cancelSubscriptionAction]', err)
    return { ok: false, error: 'unknown_error' }
  }
}

// ---------------------------------------------------------------------------
// reactivateSubscriptionAction — annule l'annulation programmée
// ---------------------------------------------------------------------------

export async function reactivateSubscriptionAction(): Promise<CancelSubscriptionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'not_authenticated' }

    const { subscriptionId, error: lookupError } =
      await getActiveSubscriptionIdForUser(user.id)
    if (!subscriptionId) {
      return { ok: false, error: lookupError ?? 'no_active_subscription' }
    }

    const { error } = await reactivateSubscription({ subscriptionId })
    if (error) return { ok: false, error }

    revalidatePath('/billing')
    return { ok: true }
  } catch (err) {
    console.error('[reactivateSubscriptionAction]', err)
    return { ok: false, error: 'unknown_error' }
  }
}

// ---------------------------------------------------------------------------
// createUpdatePaymentMethodIntentAction — renvoie le clientSecret d'un SetupIntent
// ---------------------------------------------------------------------------

type SetupIntentResult =
  | { ok: true; clientSecret: string }
  | { ok: false; error: string }

export async function createUpdatePaymentMethodIntentAction(): Promise<SetupIntentResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'not_authenticated' }

    const { customerId, error: lookupError } =
      await getActiveSubscriptionIdForUser(user.id)
    if (!customerId) {
      return { ok: false, error: lookupError ?? 'no_stripe_customer' }
    }

    const { clientSecret, error } = await createSetupIntentForCard({ customerId })
    if (error || !clientSecret) {
      return { ok: false, error: error ?? 'unknown_error' }
    }

    return { ok: true, clientSecret }
  } catch (err) {
    console.error('[createUpdatePaymentMethodIntentAction]', err)
    return { ok: false, error: 'unknown_error' }
  }
}

// ---------------------------------------------------------------------------
// confirmPaymentMethodUpdateAction — attache la nouvelle CB à la souscription
// ---------------------------------------------------------------------------
//
// Appelée APRÈS que le client ait confirmé le SetupIntent via PaymentElement.
// On relit le SetupIntent côté serveur pour récupérer son payment_method,
// puis on le pose comme default_payment_method sur la sub + le customer.
// Cela garantit que les prochaines factures sont prélevées sur cette CB.

export async function confirmPaymentMethodUpdateAction(params: {
  setupIntentId: string
}): Promise<CancelSubscriptionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'not_authenticated' }

    const { subscriptionId, customerId, error: lookupError } =
      await getActiveSubscriptionIdForUser(user.id)
    if (!subscriptionId || !customerId) {
      return { ok: false, error: lookupError ?? 'no_active_subscription' }
    }

    const setupIntent = await stripe.setupIntents.retrieve(
      params.setupIntentId,
    )

    // Defensive : le SetupIntent doit appartenir au même customer.
    if (setupIntent.customer !== customerId) {
      return { ok: false, error: 'setup_intent_customer_mismatch' }
    }

    const paymentMethodId =
      typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id

    if (!paymentMethodId) {
      return { ok: false, error: 'no_payment_method_on_setup_intent' }
    }

    const { error } = await setSubscriptionDefaultPaymentMethod({
      customerId,
      subscriptionId,
      paymentMethodId,
    })
    if (error) return { ok: false, error }

    return { ok: true }
  } catch (err) {
    console.error('[confirmPaymentMethodUpdateAction]', err)
    return { ok: false, error: 'unknown_error' }
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
 * Change the plan of an EXISTING active subscription (Starter ↔ Pro, ou
 * interval switch monthly ↔ yearly).
 *
 * Routage upgrade vs downgrade :
 *
 *   - UPGRADE immédiat (Starter→Pro, monthly→yearly du même plan) :
 *     `updateExistingSubscription` bascule les items Stripe tout de suite.
 *     Le webhook `customer.subscription.updated` fire avec les nouveaux
 *     items → email `plan-changed/upgrade` envoyé depuis le webhook.
 *
 *   - DOWNGRADE programmé (Pro→Starter, yearly→monthly du même plan) :
 *     `scheduleChangeAtPeriodEnd` crée un Stripe Subscription Schedule
 *     avec une phase future qui bascule au `period_end`. La sub ne change
 *     PAS maintenant, l'user garde ses features Pro jusqu'à cette date.
 *     Email `plan-changed/downgrade` (isImmediate=false) envoyé DIRECTEMENT
 *     d'ici au clic, pas du webhook (le webhook n'observera un vrai
 *     item change qu'au period_end). Les champs pending_* de la row
 *     subscriptions sont remplis pour que l'UI /billing affiche "Ton
 *     plan passera en X le {date}".
 *
 *   - CAS RE-UPGRADE (user avec downgrade scheduled qui re-click son plan
 *     courant) : on `releaseSubscriptionSchedule` pour annuler le changement
 *     et revenir à l'état pre-downgrade. Pas d'email (rien n'a changé).
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
    // the user's active stripe_subscription_id + schedule state. Fallback
    // on the legacy users.stripe_subscription_id column pour les subs
    // anciennes qui n'ont pas encore de row locale.
    const { data: localSub } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_schedule_id')
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

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const currentItem = subscription.items.data[0]
    if (!currentItem) {
      return { ok: false, error: 'no_current_item' }
    }
    const currentPriceId = currentItem.price.id

    const classification = classifySubscriptionChange(currentPriceId, newPriceId)

    // --- Cas 1 : l'user a un schedule actif (downgrade programmé) et
    // click sur un plan qui correspond à sa subscription COURANTE →
    // on release le schedule (= il reste sur son plan actuel).
    if (localSub?.stripe_schedule_id && classification === 'same') {
      const { error: releaseError } = await releaseSubscriptionSchedule({
        scheduleId: localSub.stripe_schedule_id,
      })
      if (releaseError) return { ok: false, error: releaseError }

      // Le webhook subscription_schedule.released ne met pas à jour la row
      // locale (on ne hooke pas cet event) — on clear manuellement ici.
      const admin = createAdminClient()
      await admin
        .from('subscriptions')
        .update({
          stripe_schedule_id: null,
          pending_plan: null,
          pending_interval: null,
          pending_effective_at: null,
        })
        .eq('user_id', user.id)

      revalidatePath('/billing')
      return { ok: true, message: 'Changement de plan annulé.' }
    }

    if (classification === 'same') {
      return { ok: false, error: 'Tu es deja sur ce plan' }
    }

    // --- Cas 2 : upgrade immédiat (webhook prendra le relai pour l'email)
    if (classification === 'upgrade') {
      // Si un schedule downgrade existe, le release d'abord : l'user qui
      // upgrade vers Pro pendant qu'un downgrade vers Starter était planifié
      // a clairement changé d'avis.
      if (localSub?.stripe_schedule_id) {
        await releaseSubscriptionSchedule({
          scheduleId: localSub.stripe_schedule_id,
        })
        const admin = createAdminClient()
        await admin
          .from('subscriptions')
          .update({
            stripe_schedule_id: null,
            pending_plan: null,
            pending_interval: null,
            pending_effective_at: null,
          })
          .eq('user_id', user.id)
      }

      const { error: updateError } = await updateExistingSubscription({
        subscriptionId,
        newPriceId,
      })
      if (updateError) return { ok: false, error: updateError }
      revalidatePath('/billing')
      return { ok: true, message: 'Plan mis à jour.' }
    }

    // --- Cas 3 : downgrade programmé → Subscription Schedule + email au clic
    const { schedule, error: scheduleError } = await scheduleChangeAtPeriodEnd({
      subscriptionId,
      newPriceId,
    })
    if (scheduleError || !schedule) {
      return { ok: false, error: scheduleError ?? 'schedule_failed' }
    }

    const periodEndTs = currentItem.current_period_end
    if (!periodEndTs) {
      return { ok: false, error: 'no_period_end' }
    }
    const effectiveAtIso = new Date(periodEndTs * 1000).toISOString()

    // Persiste l'état "downgrade programmé" en DB pour l'UI /billing.
    const admin = createAdminClient()
    await admin
      .from('subscriptions')
      .update({
        stripe_schedule_id: schedule.id,
        pending_plan: plan,
        pending_interval: interval,
        pending_effective_at: effectiveAtIso,
      })
      .eq('user_id', user.id)

    // Envoi de l'email "ton plan passera en X le {date}" — best-effort,
    // un échec Resend ne doit pas bloquer le succès Stripe. Le template
    // dépend du type de downgrade : plan change vs simple interval change
    // au sein du même plan.
    const { data: userRow } = await supabase
      .from('users')
      .select('email, name, plan')
      .eq('id', user.id)
      .single()

    if (userRow && (userRow.plan === 'starter' || userRow.plan === 'pro')) {
      const newPrice = await stripe.prices.retrieve(newPriceId)
      const currentPlanName: 'Starter' | 'Pro' =
        userRow.plan === 'pro' ? 'Pro' : 'Starter'
      const newPlanName: 'Starter' | 'Pro' = plan === 'pro' ? 'Pro' : 'Starter'
      const periodEndIso = new Date(periodEndTs * 1000).toISOString().slice(0, 10)
      const nextBillingDate = new Date(periodEndTs * 1000)
      if (interval === 'yearly') {
        nextBillingDate.setUTCFullYear(nextBillingDate.getUTCFullYear() + 1)
      } else {
        nextBillingDate.setUTCMonth(nextBillingDate.getUTCMonth() + 1)
      }
      const nextBillingIso = nextBillingDate.toISOString().slice(0, 10)

      const isPlanChange = userRow.plan !== plan
      const emailResult = isPlanChange
        ? await sendEmail({
            template: 'plan-changed',
            to: userRow.email,
            data: {
              name: userRow.name ?? '',
              previousPlanName: currentPlanName,
              newPlanName,
              changeType: 'downgrade',
              newAmount: newPrice.unit_amount ?? 0,
              currency: newPrice.currency,
              newBillingPeriod: interval,
              effectiveDate: periodEndIso,
              isImmediate: false,
              nextBillingDate: nextBillingIso,
            },
          })
        : await sendEmail({
            template: 'billing-period-changed',
            to: userRow.email,
            data: {
              name: userRow.name ?? '',
              planName: currentPlanName,
              previousBillingPeriod: interval === 'monthly' ? 'yearly' : 'monthly',
              newBillingPeriod: interval,
              newAmount: newPrice.unit_amount ?? 0,
              currency: newPrice.currency,
              effectiveDate: periodEndIso,
              isImmediate: false,
              nextBillingDate: nextBillingIso,
            },
          })
      if (!emailResult.ok) {
        console.error(
          '[changeSubscriptionPlanAction] scheduled-change email failed:',
          emailResult.error,
        )
      }
    }

    revalidatePath('/billing')
    return { ok: true, message: 'Changement programmé à la fin de la période.' }
  } catch (err) {
    console.error('[changeSubscriptionPlanAction]', err)
    return { ok: false, error: 'unknown_error' }
  }
}

// ---------------------------------------------------------------------------
// getAccountOverview — snapshot compact utilisé par /settings
// ---------------------------------------------------------------------------
//
// Renvoie uniquement ce dont la card "Abonnement" de la page Settings a besoin :
// plan + prix courant + date de prochaine facture + 4 derniers chiffres de la CB
// + état d'annulation. Fait un call Stripe pour le last4 (customers.retrieve
// avec expand sur le default_payment_method). Pour les pages où ce call est
// trop lourd, préférer getBillingStatus (strictement DB).

export async function getAccountOverview(): Promise<AccountOverview> {
  const fallback: AccountOverview = {
    plan: 'free',
    interval: null,
    priceCents: null,
    nextBillingDate: null,
    cancelAtPeriodEnd: false,
    cardLast4: null,
    cardBrand: null,
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return fallback

    const [userRes, subRes] = await Promise.all([
      supabase
        .from('users')
        .select('plan, stripe_customer_id')
        .eq('id', user.id)
        .single(),
      supabase
        .from('subscriptions')
        .select('interval, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    const plan = (userRes.data?.plan ?? 'free') as 'free' | 'starter' | 'pro'
    if (plan === 'free') return { ...fallback, plan }

    const subRow = subRes.data
    const interval: BillingInterval | null =
      subRow?.interval === 'monthly' || subRow?.interval === 'yearly'
        ? subRow.interval
        : null

    // Récupération du last4 de la carte par défaut du customer. On expand
    // invoice_settings.default_payment_method pour éviter un second round-trip.
    // Si aucune CB par défaut : on tombe sur null, la card Settings affichera
    // simplement le plan/date sans la ligne CB.
    let cardLast4: string | null = null
    let cardBrand: string | null = null
    if (userRes.data?.stripe_customer_id) {
      try {
        const customer = await stripe.customers.retrieve(
          userRes.data.stripe_customer_id,
          { expand: ['invoice_settings.default_payment_method'] },
        )
        if (!customer.deleted) {
          const dpm = customer.invoice_settings?.default_payment_method
          if (dpm && typeof dpm !== 'string' && dpm.card) {
            cardLast4 = dpm.card.last4
            cardBrand = dpm.card.brand
          }
        }
      } catch (err) {
        console.error('[getAccountOverview] customer fetch failed:', err)
      }
    }

    const priceCents: number | null = interval
      ? PLANS[plan].priceCents[interval]
      : null

    return {
      plan,
      interval,
      priceCents,
      nextBillingDate: subRow?.current_period_end ?? null,
      cancelAtPeriodEnd: subRow?.cancel_at_period_end ?? false,
      cardLast4,
      cardBrand,
    }
  } catch (err) {
    console.error('[getAccountOverview]', err)
    return fallback
  }
}
