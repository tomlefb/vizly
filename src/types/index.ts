import type { Database } from '@/lib/supabase/types'

export type User = Database['public']['Tables']['users']['Row']
export type Portfolio = Database['public']['Tables']['portfolios']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type PurchasedTemplate =
  Database['public']['Tables']['purchased_templates']['Row']

export type PortfolioInsert =
  Database['public']['Tables']['portfolios']['Insert']
export type PortfolioUpdate =
  Database['public']['Tables']['portfolios']['Update']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

import type { SectionBlock } from './sections'

export interface TemplateProps {
  portfolio: {
    title: string
    bio: string | null
    photo_url: string | null
    primary_color: string
    secondary_color: string
    font: string
    social_links: Record<string, string> | null
    contact_email: string | null
  }
  projects: Array<{
    id: string
    title: string
    description: string | null
    images: string[]
    external_link: string | null
    tags: string[]
    display_order: number
  }>
  skills: string[]
  sections: SectionBlock[]
  isPremium: boolean
}
