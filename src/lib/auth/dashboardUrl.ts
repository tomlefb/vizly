type ReadableSearchParams = { get(key: string): string | null }

/**
 * Builds the post-auth dashboard URL, preserving the `plan` and
 * `interval` query params coming from the pricing CTA. Used by both
 * /login and /register so the checkout modal re-opens after OAuth or
 * OTP verification.
 */
export function getDashboardUrl(searchParams: ReadableSearchParams): string {
  const plan = searchParams.get('plan')
  if (plan !== 'starter' && plan !== 'pro') return '/dashboard'
  const interval = searchParams.get('interval') === 'yearly' ? 'yearly' : 'monthly'
  return `/dashboard?plan=${plan}&interval=${interval}`
}
