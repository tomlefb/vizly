import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

// apiVersion is pinned explicitly (not left as the SDK default) for two reasons:
//  1. It documents which API surface the codebase was written and tested
//     against, so a future SDK bump that ships a newer apiVersion as default
//     does not silently change runtime behavior.
//  2. The TypeScript types from `stripe@^22.0.1` are generated against this
//     version, so pinning here keeps types and runtime in lockstep.
//
// '2026-03-25.dahlia' is the version natively shipped by stripe@22.0.1 (see
// node_modules/stripe/cjs/apiVersion.js). When bumping the SDK, re-check that
// file and update this constant in the same commit.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})
