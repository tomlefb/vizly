// Alias: Stripe webhook is configured to hit /api/webhooks/stripe
// but our handler lives at /api/stripe-webhook. Re-export it.
export { POST } from '@/app/api/stripe-webhook/route'
