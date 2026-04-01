import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
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

export async function generateMetadata({
  params,
}: PortfolioPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('title, bio, photo_url')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (!portfolio) {
    return { title: 'Portfolio introuvable' }
  }

  const title = portfolio.title || slug
  const description =
    portfolio.bio || `Portfolio de ${title} sur Vizly`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      ...(portfolio.photo_url ? { images: [portfolio.photo_url] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
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

  // Load projects and user plan in parallel
  const [projectsResult, userResult] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('display_order', { ascending: true }),
    supabase
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
      font: portfolio.font,
      social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      contact_email: portfolio.contact_email,
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

  return <TemplateComponent {...templateProps} />
}
