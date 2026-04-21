import type { MetadataRoute } from 'next'

// Host canonical unique — doit rester aligné avec `CANONICAL_URL` dans
// `src/app/layout.tsx`. On n'utilise pas APP_URL ici pour éviter qu'une
// variable d'env mal configurée émette un robots.txt pointant vers un host
// non-canonical (www vs non-www) et crée des doublons dans Search Console.
const CANONICAL_URL = 'https://www.vizly.fr'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/dashboard',
          '/editor',
          '/settings',
          '/billing',
          '/domaines',
          '/statistiques',
          '/mes-templates',
          '/login',
          '/register',
          '/forgot-password',
        ],
      },
    ],
    sitemap: `${CANONICAL_URL}/sitemap.xml`,
    host: CANONICAL_URL,
  }
}
