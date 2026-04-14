// =============================================================================
// client-browser.ts — Stripe.js loader for browser-side code
// =============================================================================
// This file is the BROWSER-side counterpart to src/lib/stripe/client.ts.
//
// client.ts holds the SERVER SDK with the secret key and must NEVER be
// bundled into a client-side bundle. Importing it from a "use client"
// component would leak the secret key into the JS bundle delivered to
// browsers — a critical PCI/security failure.
//
// This file holds only the publishable key loader (Stripe.js script tag
// loader) and is safe to import from any "use client" component. The
// publishable key is by design exposed in the browser bundle.
//
// Singleton pattern: loadStripe() returns a Promise that injects and loads
// the Stripe.js script tag once. We cache the Promise at module level so
// that repeated calls (each modal mount, each PaymentElement instance,
// each react-stripe-js <Elements> wrapper) reuse the same Stripe.js
// instance without re-injecting the script tag — re-injecting would
// silently work but waste a network round-trip and reset internal state.

import { loadStripe, type Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

/**
 * Get the Stripe.js singleton Promise. Lazy: the script tag is only
 * injected on the first call. Subsequent calls return the cached Promise.
 *
 * Throws (synchronously) if NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing
 * from the environment — that's a configuration bug, not a runtime
 * condition the caller can recover from. Better a clear early error than
 * a cryptic Stripe.js init failure deep inside the PaymentElement.
 */
export function getStripe(): Promise<Stripe | null> {
  if (stripePromise === null) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!publishableKey) {
      throw new Error(
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. ' +
          'Add it to .env.local with your Stripe publishable key (pk_test_... or pk_live_...).'
      )
    }
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}
