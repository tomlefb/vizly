// Types shared between the sendEmail helper, React Email templates,
// and the call sites (server actions, webhooks, route handlers).
//
// Each entry in EmailDataMap is the strongly-typed payload the matching
// template expects. Adding a new template = add a key here, add an entry
// to the registry in send.ts, and create the component in emails/.

export type EmailLocale = 'fr' | 'en'

export type EmailTemplate =
  | 'welcome'
  | 'portfolio-published'
  | 'payment-succeeded'
  | 'plan-changed'
  | 'billing-period-changed'
  | 'payment-failed'
  | 'subscription-cancelled'
  | 'renewal-reminder'
  | 'contact-notification'

export interface EmailDataMap {
  welcome: {
    name: string
  }
  'portfolio-published': {
    name: string
    portfolioTitle: string
    portfolioUrl: string
    portfolioSlug: string
  }
  'payment-succeeded': {
    name: string
    planName: string
    billingPeriod: 'monthly' | 'yearly'
    amount: number
    currency: string
    paidAt: string
    nextBillingDate: string
    invoiceNumber?: string
    invoiceUrl?: string
  }
  'plan-changed': {
    name: string
    // Literal union: this template only handles Starter ↔ Pro transitions.
    // Free → paid uses payment-succeeded, paid → free uses subscription-cancelled.
    // The strict types make the typecheck refuse 'Gratuit'.
    previousPlanName: 'Starter' | 'Pro'
    newPlanName: 'Starter' | 'Pro'
    changeType: 'upgrade' | 'downgrade'
    newAmount: number
    currency: string
    newBillingPeriod: 'monthly' | 'yearly'
    // effectiveDate: when the plan change TAKES EFFECT for the user — the day
    // their features actually swap. For upgrade (immediate), this is today.
    // For downgrade (Stripe applies at period end), this is the end of the
    // current billing period.
    effectiveDate: string
    // true → upgrade (applies now), false → downgrade (applies at period end).
    // Drives the "Date d'effet" cell display: "Immédiat" vs the formatted date.
    isImmediate: boolean
    // nextBillingDate: when the NEXT PAYMENT will be charged — distinct from
    // effectiveDate. For an upgrade with no proration, this is one full
    // period after today. For a downgrade, this is one full period after
    // effectiveDate (= old period end + new period). They can be identical
    // (immediate upgrade with proration disabled and aligned cycles) or
    // different (typical downgrade case).
    nextBillingDate: string
    // Nombre de portfolios dépubliés automatiquement suite au downgrade
    // Pro → Starter (Starter = 1 portfolio max). Optionnel, uniquement
    // renseigné pour un downgrade — l'upgrade laisse ça absent. Si > 0,
    // le template affiche un bloc d'avertissement.
    unpublishedCount?: number
  }
  'billing-period-changed': {
    name: string
    // Plan stays the SAME — only the billing cycle changes. If the plan also
    // changes simultaneously, that's a plan-changed event, not this one.
    planName: 'Starter' | 'Pro'
    previousBillingPeriod: 'monthly' | 'yearly'
    newBillingPeriod: 'monthly' | 'yearly'
    newAmount: number
    currency: string
    // For monthly→yearly (immediate): today. For yearly→monthly (period end): end of current period.
    effectiveDate: string
    isImmediate: boolean
    nextBillingDate: string
  }
  'payment-failed': {
    name: string
    // Literal union: only paid plans can have a payment fail. Gratuit users
    // have no Stripe subscription so this template should never be sent for them.
    planName: 'Starter' | 'Pro'
    // Smallest currency unit (cents). The amount Stripe tried and failed to charge.
    amount: number
    currency: string
    // ISO 8601 — when the failed charge attempt happened.
    attemptedAt: string
    // ISO 8601 — Stripe-provided next retry date if available. The template
    // falls back to a localised "in the coming days" string when absent.
    nextAttemptDate?: string
    // ISO 8601 — CALCULATED by the Phase 4 webhook handler from Stripe's
    // Smart Retries config (typically ~7-14 days after the first failure).
    // NOT directly read from invoice fields. Critical, never optional.
    gracePeriodEndDate: string
  }
  'subscription-cancelled': {
    name: string
    // Literal union: only paid plans can be cancelled. Gratuit users have
    // no subscription, so this template should never fire for them.
    previousPlanName: 'Starter' | 'Pro'
    // ISO 8601 — end of current paid period (the day features stop being
    // active and all portfolios get unpublished). In the corrected Phase 4
    // flow, this email fires when the user clicks "Cancel subscription",
    // so effectiveDate is in the FUTURE (typically weeks ahead).
    effectiveDate: string
  }
  'renewal-reminder': {
    name: string
    // Literal union: only paid plans get a renewal reminder.
    planName: 'Starter' | 'Pro'
    // Literal 'yearly' ONLY — NOT a union with 'monthly'. Monthly subs
    // don't get a J-7 reminder (that would be spam). This constraint is
    // enforced at compile time: passing billingPeriod: 'monthly' here
    // fails typecheck with TS 2322 "not assignable to type 'yearly'".
    // Protection against "accidental monthly reminder" bugs in the
    // Phase 4 cron implementation.
    billingPeriod: 'yearly'
    amount: number
    currency: string
    // ISO 8601 — the exact date Stripe will charge the user's card.
    renewalDate: string
  }
  'contact-notification': {
    senderName: string
    senderEmail: string
    message: string
    // Optional: present when sent via a published portfolio's contact form,
    // absent when sent via the general /legal/contact page.
    portfolioName?: string
  }
}

// Discriminated union built by mapping over EmailTemplate keys.
// Lets switch (params.template) narrow params.data inside each case.
export type SendEmailParams = {
  [K in EmailTemplate]: {
    template: K
    to: string
    locale?: EmailLocale
    data: EmailDataMap[K]
    replyTo?: string
  }
}[EmailTemplate]

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string }
