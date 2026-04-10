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
