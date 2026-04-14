// =============================================================================
// CheckoutErrorMessage.ts — Stripe + Server Action error code → French copy
// =============================================================================
// Maps stable error codes (from Stripe.js confirmPayment errors and from our
// Server Action discriminated unions) to user-facing French messages in
// Vizly's editorial voice.
//
// Voice rules (apply to every message in this file):
//   - Tutoiement systématique
//   - Point final à chaque message
//   - Jamais de "désolé", "malheureusement", "oups"
//   - Ton factuel, pas dramatique
//   - Une action claire à la fin ("Réessaie", "Essaie une autre carte")
//
// This is a pure module (no React, no side effects) so it's trivially
// testable and reusable from any client component (including the
// TemplatePurchaseModal in Phase 5).

import type { StripeError } from '@stripe/stripe-js'

/**
 * Stripe payment error codes returned by stripe.confirmPayment when a card
 * is declined or a payment method fails. Source: Stripe error code reference.
 * https://docs.stripe.com/error-codes
 */
export const STRIPE_ERROR_MESSAGES: Record<string, string> = {
  card_declined: 'Ta carte a été refusée. Essaie avec une autre carte.',
  insufficient_funds: "Il n'y a pas assez de fonds sur cette carte.",
  expired_card: 'Cette carte a expiré.',
  incorrect_cvc: 'Le code de sécurité ne correspond pas.',
  incorrect_number: 'Le numéro de carte est incorrect.',
  invalid_cvc: "Le code de sécurité n'est pas valide.",
  invalid_expiry_month: "Le mois d'expiration n'est pas valide.",
  invalid_expiry_year: "L'année d'expiration n'est pas valide.",
  invalid_number: "Le numéro de carte n'est pas valide.",
  processing_error: 'Le paiement a échoué côté banque. Réessaie dans un instant.',
  authentication_required: "Ta banque a refusé l'authentification 3D Secure. Réessaie ou utilise une autre carte.",
  card_velocity_exceeded: 'Cette carte a atteint sa limite de transactions. Essaie plus tard ou avec une autre carte.',
  generic_decline: "Le paiement n'a pas pu aboutir. Essaie une autre carte.",
}

/**
 * Server Action error codes returned by createSubscriptionIntentAction,
 * createTemplateIntentAction, and validatePromotionCodeAction (Phase 2
 * discriminated unions, see src/actions/billing.ts).
 */
export const SERVER_ACTION_ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Tu dois être connecté pour continuer.',
  subscription_already_active: 'Tu as déjà un abonnement actif.',
  template_already_purchased: 'Tu as déjà acheté ce template.',
  template_not_eligible: "Ce template n'est pas disponible à l'achat.",
  invalid_promotion_code: "Ce code promo n'est pas valide.",
  invalid_promotion_code_currency: "Ce code promo n'est pas applicable à cet achat.",
  discount_too_large: "Ce code promo ne peut pas s'appliquer à cet achat.",
  not_found: "Ce code promo n'existe pas.",
  expired: 'Ce code promo a expiré.',
  max_redemptions_reached: 'Ce code promo a atteint sa limite.',
  customer_creation_failed: "Impossible de créer ton compte de paiement. Réessaie dans un instant.",
  price_not_configured: "Ce plan n'est pas correctement configuré. Contacte-nous.",
  unknown_error: 'Une erreur est survenue. Réessaie dans un instant.',
}

/**
 * Resolve a code (Stripe or Server Action) to a French message.
 *
 * Lookup order:
 *   1. Stripe payment errors (most common case from confirmPayment)
 *   2. Server Action errors (from createSubscriptionIntentAction etc.)
 *   3. fallbackMessage if provided (rare — only for unmapped codes where
 *      Stripe gave us a message we can't translate)
 *   4. Generic Vizly fallback
 */
export function getErrorMessage(
  code: string | undefined,
  fallbackMessage?: string,
): string {
  if (!code) {
    return fallbackMessage ?? "Le paiement n'a pas pu aboutir. Tu peux réessayer."
  }
  return (
    STRIPE_ERROR_MESSAGES[code] ??
    SERVER_ACTION_ERROR_MESSAGES[code] ??
    fallbackMessage ??
    "Le paiement n'a pas pu aboutir. Tu peux réessayer."
  )
}

// ---------------------------------------------------------------------------
// Client-side validation error classification
// ---------------------------------------------------------------------------

/**
 * Stripe error codes that represent a client-side field validation failure
 * (user typed incomplete/invalid card data). Stripe's PaymentElement displays
 * these errors inline under the relevant field natively — we must NOT promote
 * them to the global error state, which would unmount the form and erase
 * the user's input mid-typing.
 *
 * The `type: 'validation_error'` variant of StripeError already covers most
 * of these, but some Stripe SDK versions occasionally return these codes
 * with `type: 'card_error'` or `type: 'invalid_request_error'`, so we also
 * check the code explicitly as a defense-in-depth.
 */
const VALIDATION_ERROR_CODES = new Set<string>([
  'incomplete_number',
  'incomplete_cvc',
  'incomplete_expiry',
  'incomplete_zip',
  'invalid_number',
  'invalid_expiry_month',
  'invalid_expiry_month_past',
  'invalid_expiry_year',
  'invalid_expiry_year_past',
  'invalid_cvc',
])

/**
 * True if the error is a client-side validation error that Stripe's
 * PaymentElement is already displaying inline under the relevant field.
 * The caller should bounce the state back to `ready` without unmounting
 * the form, so the user can fix their input without losing context.
 *
 * False for real server-side errors (card_declined, insufficient_funds,
 * processing_error, api_error, etc.) which warrant the global error state
 * with a "Réessayer" button and potentially a fresh intent fetch.
 */
export function isValidationError(error: StripeError): boolean {
  if (error.type === 'validation_error') return true
  if (error.code && VALIDATION_ERROR_CODES.has(error.code)) return true
  return false
}
