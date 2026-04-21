import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { BLOG_POSTS } from '@/lib/blog'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import { PERSONA_LANDINGS } from '@/lib/persona-landings'

// Host canonical unique — aligné avec `CANONICAL_URL` dans `src/app/layout.tsx`
// et `src/app/robots.ts`. Évite les doublons www/non-www dans l'index Google.
const CANONICAL_URL = 'https://www.vizly.fr'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = CANONICAL_URL
  const now = new Date()

  // Static pages marketing
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/tarifs`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/fonctionnalites`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/templates`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/legal/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/legal/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/legal/cgu`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/confidentialite`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/mentions`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Template detail pages (8 templates)
  const templatePages: MetadataRoute.Sitemap = TEMPLATE_CONFIGS.map((t) => ({
    url: `${base}/templates/${t.name}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Persona landing pages (SEO long-tail)
  const personaPages: MetadataRoute.Sitemap = PERSONA_LANDINGS.map((p) => ({
    url: `${base}/${p.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }))

  // Blog articles
  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Published portfolios (sous-domaines *.vizly.fr)
  let portfolioPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('portfolios')
      .select('slug, updated_at')
      .eq('published', true)
      .not('slug', 'is', null)

    if (data) {
      portfolioPages = data.map((p) => ({
        url: `https://${p.slug}.vizly.fr`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }
  } catch {
    // Skip portfolios if DB unavailable (build time)
  }

  return [
    ...staticPages,
    ...personaPages,
    ...templatePages,
    ...blogPages,
    ...portfolioPages,
  ]
}
