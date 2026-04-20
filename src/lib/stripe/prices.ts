export const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER ?? '',
  starter_yearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? '',
  pro: process.env.STRIPE_PRICE_PRO ?? '',
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? '',
  template_creatif: process.env.STRIPE_PRICE_TEMPLATE_CREATIF ?? '',
  template_brutalist: process.env.STRIPE_PRICE_TEMPLATE_BRUTALIST ?? '',
  template_elegant: process.env.STRIPE_PRICE_TEMPLATE_ELEGANT ?? '',
  template_bento: process.env.STRIPE_PRICE_TEMPLATE_BENTO ?? '',
} as const

export type StripePriceKey = keyof typeof STRIPE_PRICES

export type BillingInterval = 'monthly' | 'yearly'

/**
 * Get the Stripe price ID for a premium template.
 * @param templateId - The template identifier (e.g. "creatif", "brutalist")
 * @returns The Stripe price ID, or null if not found.
 */
export function getTemplatePriceId(templateId: string): string | null {
  const key = `template_${templateId}` as string
  if (key in STRIPE_PRICES) {
    return STRIPE_PRICES[key as StripePriceKey] || null
  }
  return null
}

/**
 * Get the price ID for a plan + interval combination.
 */
export function getSubscriptionPriceId(
  plan: 'starter' | 'pro',
  interval: BillingInterval
): string {
  if (plan === 'starter') {
    return interval === 'yearly' ? STRIPE_PRICES.starter_yearly : STRIPE_PRICES.starter
  }
  return interval === 'yearly' ? STRIPE_PRICES.pro_yearly : STRIPE_PRICES.pro
}

/**
 * Determine the plan name from a Stripe price ID.
 * Recognizes both monthly and yearly price IDs.
 * @returns 'starter' | 'pro' | null
 */
export function getPlanFromPriceId(
  priceId: string
): 'starter' | 'pro' | null {
  if (priceId === STRIPE_PRICES.starter || priceId === STRIPE_PRICES.starter_yearly) return 'starter'
  if (priceId === STRIPE_PRICES.pro || priceId === STRIPE_PRICES.pro_yearly) return 'pro'
  return null
}

/**
 * Determine BOTH the plan name AND the billing interval from a Stripe
 * price ID. Used by the webhook dispatcher to detect plan-changed vs
 * billing-period-changed events.
 *
 * @returns { plan, interval } or null if the priceId is not a Vizly subscription price
 */
export function getPlanAndIntervalFromPriceId(
  priceId: string
): { plan: 'starter' | 'pro'; interval: BillingInterval } | null {
  if (priceId === STRIPE_PRICES.starter) return { plan: 'starter', interval: 'monthly' }
  if (priceId === STRIPE_PRICES.starter_yearly) return { plan: 'starter', interval: 'yearly' }
  if (priceId === STRIPE_PRICES.pro) return { plan: 'pro', interval: 'monthly' }
  if (priceId === STRIPE_PRICES.pro_yearly) return { plan: 'pro', interval: 'yearly' }
  return null
}

/**
 * Compare deux price IDs de subscription pour décider si le changement
 * est un "upgrade" (immédiat) ou un "downgrade" (programmé à period_end).
 *
 * Règle : plus de features ET/OU engagement plus long = upgrade immédiat.
 * Inversement, moins de features OU engagement plus court = downgrade
 * programmé. Le rank est `plan * 10 + interval` (pro=2, starter=1,
 * yearly=2, monthly=1) — strictement décroissant = downgrade.
 *
 * Retourne `null` si l'un des deux priceIds n'est pas reconnu (cas qui
 * ne devrait pas arriver en prod — la UI ne propose que les 4 plans Vizly).
 */
export function classifySubscriptionChange(
  currentPriceId: string,
  newPriceId: string,
): 'upgrade' | 'downgrade' | 'same' | null {
  const current = getPlanAndIntervalFromPriceId(currentPriceId)
  const next = getPlanAndIntervalFromPriceId(newPriceId)
  if (!current || !next) return null

  const rank = (m: { plan: 'starter' | 'pro'; interval: BillingInterval }) =>
    (m.plan === 'pro' ? 2 : 1) * 10 + (m.interval === 'yearly' ? 2 : 1)

  const currentRank = rank(current)
  const nextRank = rank(next)

  if (nextRank === currentRank) return 'same'
  return nextRank > currentRank ? 'upgrade' : 'downgrade'
}

/**
 * Determine the template ID from a Stripe price ID.
 * @returns The template id (e.g. "creatif") or null.
 */
export function getTemplateFromPriceId(priceId: string): string | null {
  for (const [key, value] of Object.entries(STRIPE_PRICES)) {
    if (key.startsWith('template_') && value === priceId) {
      return key.replace('template_', '')
    }
  }
  return null
}
