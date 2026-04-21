import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { templateMap } from '@/components/templates'
import { parseSections, parseSkills } from '@/types/sections'
import { parseCustomBlocks } from '@/types/custom-blocks'
import { parseKpis } from '@/types/kpis'
import { parseLayoutBlocks } from '@/types/layout-blocks'
import { TrackView } from '@/components/analytics/TrackView'
import type { TemplateProps } from '@/types'

export const revalidate = 60

interface PortfolioPageProps {
  params: Promise<{ slug: string }>
}

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vizly.fr'

// Truncate a description for the meta description / OG description.
// Matches the truncation logic used by the OG image so the visible card
// and the meta text stay aligned.
function truncateDescription(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  const sliced = cleaned.slice(0, max)
  const lastSpace = sliced.lastIndexOf(' ')
  const cut = lastSpace > max * 0.6 ? sliced.slice(0, lastSpace) : sliced
  return `${cut}…`
}

export async function generateMetadata({
  params,
}: PortfolioPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('title, bio, custom_domain, custom_domain_status')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (!portfolio) {
    return { title: 'Portfolio introuvable' }
  }

  const name = portfolio.title?.trim() || slug
  const fullTitle = `${name} — Portfolio`
  const description = portfolio.bio?.trim()
    ? truncateDescription(portfolio.bio, 160)
    : `Découvre le portfolio de ${name}, créé avec Vizly.`

  // Canonical URL — si l'utilisateur a configuré un custom domain vérifié,
  // on le préfère au subdomain vizly.fr : le middleware sert le portfolio
  // sur les deux hosts, donc sans cette préférence Google verrait deux URLs
  // avec le même contenu et choisirait au hasard.
  const customDomainVerified =
    portfolio.custom_domain_status === 'verified' && portfolio.custom_domain
      ? portfolio.custom_domain
      : null

  const url = customDomainVerified
    ? `https://${customDomainVerified}`
    : `https://${slug}.${APP_DOMAIN}`

  // Note: og:image and twitter:image are auto-detected by Next.js from the
  // sibling opengraph-image.tsx file. No need to reference them manually.
  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: 'Vizly',
      locale: 'fr_FR',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
  }
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Load portfolio
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (!portfolio) {
    notFound()
  }

  // Load projects and user plan in parallel.
  // User plan lookup uses the admin client because RLS on `users` only
  // allows reading your own row, and visitors on a public portfolio have
  // no auth — without this, userPlan always fell back to 'free' and Pro
  // features (contact form, no watermark) never activated on published
  // portfolios.
  const adminSupabase = createAdminClient()
  const [projectsResult, userResult] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('display_order', { ascending: true }),
    adminSupabase
      .from('users')
      .select('plan')
      .eq('id', portfolio.user_id)
      .single(),
  ])

  const projects = projectsResult.data ?? []
  const userPlan = userResult.data?.plan ?? 'free'

  // Determine if user is on a premium plan (pro = no badge)
  const isPremium = userPlan === 'pro'

  // Resolve social_links from Json to Record<string, string>
  const socialLinks: Record<string, string> =
    portfolio.social_links &&
    typeof portfolio.social_links === 'object' &&
    !Array.isArray(portfolio.social_links)
      ? (portfolio.social_links as Record<string, string>)
      : {}

  // Build TemplateProps from Supabase data
  const templateProps: TemplateProps = {
    portfolio: {
      title: portfolio.title,
      bio: portfolio.bio,
      photo_url: portfolio.photo_url,
      primary_color: portfolio.primary_color,
      secondary_color: portfolio.secondary_color,
      body_color: portfolio.body_color ?? portfolio.secondary_color,
      background_color: portfolio.background_color ?? '#FFFFFF',
      font: portfolio.font,
      font_body: portfolio.font_body ?? portfolio.font,
      social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      contact_email: portfolio.contact_email,
      contact_form_enabled: portfolio.contact_form_enabled ?? false,
      contact_form_title: portfolio.contact_form_title ?? 'Me contacter',
      contact_form_description: portfolio.contact_form_description ?? '',
      slug: portfolio.slug,
    },
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      images: Array.isArray(p.images) ? (p.images as string[]) : [],
      external_link: p.external_link,
      tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
      display_order: p.display_order,
    })),
    skills: parseSkills(portfolio.skills),
    sections: parseSections(portfolio.sections),
    customBlocks: parseCustomBlocks(portfolio.custom_blocks),
    kpis: parseKpis(portfolio.kpis),
    layoutBlocks: parseLayoutBlocks(portfolio.layout_blocks),
    isPremium,
  }

  // Select the template component — fallback to minimal if not found
  const TemplateComponent =
    templateMap[portfolio.template] ?? templateMap['minimal'] ?? Object.values(templateMap)[0]

  if (!TemplateComponent) {
    notFound()
  }

  return (
    <div style={{ backgroundColor: portfolio.background_color ?? '#FFFFFF' }}>
      <TrackView portfolioId={portfolio.id} />
      <TemplateComponent {...templateProps} />
    </div>
  )
}
