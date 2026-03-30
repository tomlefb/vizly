export const APP_NAME = 'Vizly'
export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vizly.fr'
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? `https://${process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vizly.fr'}`

export const PLANS = {
  free: {
    name: 'Gratuit',
    price: 0,
    features: [
      'Création + preview du portfolio',
      '4 templates gratuits',
    ],
    limitations: ['Pas de mise en ligne'],
  },
  starter: {
    name: 'Starter',
    price: 4.99,
    priceId: process.env.STRIPE_PRICE_STARTER ?? '',
    features: [
      'Création + preview du portfolio',
      '4 templates gratuits',
      'Mise en ligne (pseudo.vizly.fr)',
      'Badge "Fait avec Vizly"',
    ],
    limitations: [],
  },
  pro: {
    name: 'Pro',
    price: 9.99,
    priceId: process.env.STRIPE_PRICE_PRO ?? '',
    features: [
      'Création + preview du portfolio',
      '4 templates gratuits',
      'Mise en ligne (pseudo.vizly.fr)',
      'Badge "Fait avec Vizly"',
      'Projets illimités',
      'Domaine personnalisé',
      'Formulaire de contact',
      'Analytics (nombre de vues)',
    ],
    limitations: [],
  },
} as const

export type PlanType = keyof typeof PLANS

export const TEMPLATES = {
  free: ['minimal', 'dark', 'classique', 'colore'] as const,
  premium: ['creatif', 'brutalist', 'elegant', 'bento'] as const,
}

export const TEMPLATE_PRICES: Record<string, string> = {
  creatif: process.env.STRIPE_PRICE_TEMPLATE_CREATIF ?? '',
  brutalist: process.env.STRIPE_PRICE_TEMPLATE_BRUTALIST ?? '',
  elegant: process.env.STRIPE_PRICE_TEMPLATE_ELEGANT ?? '',
  bento: process.env.STRIPE_PRICE_TEMPLATE_BENTO ?? '',
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
export const MAX_IMAGES_PER_PROJECT = 5
export const MAX_BIO_LENGTH = 500
export const MAX_PROJECT_DESCRIPTION_LENGTH = 1000
export const SLUG_MIN_LENGTH = 3
export const SLUG_MAX_LENGTH = 30

export const SOCIAL_PLATFORMS = [
  'linkedin',
  'github',
  'dribbble',
  'instagram',
  'twitter',
  'website',
] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]
