export const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER ?? '',
  pro: process.env.STRIPE_PRICE_PRO ?? '',
  template_creatif: process.env.STRIPE_PRICE_TEMPLATE_CREATIF ?? '',
  template_brutalist: process.env.STRIPE_PRICE_TEMPLATE_BRUTALIST ?? '',
  template_elegant: process.env.STRIPE_PRICE_TEMPLATE_ELEGANT ?? '',
  template_bento: process.env.STRIPE_PRICE_TEMPLATE_BENTO ?? '',
} as const

export type StripePriceKey = keyof typeof STRIPE_PRICES

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
 * Determine the plan name from a Stripe price ID.
 * @returns 'starter' | 'pro' | null
 */
export function getPlanFromPriceId(
  priceId: string
): 'starter' | 'pro' | null {
  if (priceId === STRIPE_PRICES.starter) return 'starter'
  if (priceId === STRIPE_PRICES.pro) return 'pro'
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
