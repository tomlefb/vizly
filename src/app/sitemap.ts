import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { BLOG_POSTS } from '@/lib/blog'
import { APP_URL } from '@/lib/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = APP_URL

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/templates`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/legal/cgu`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/confidentialite`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/mentions`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Blog articles
  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Published portfolios
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

  return [...staticPages, ...blogPages, ...portfolioPages]
}
