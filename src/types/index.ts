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
import type { CustomBlock } from './custom-blocks'
import type { KpiItem } from './kpis'
import type { LayoutBlock } from './layout-blocks'

export interface TemplateProps {
  portfolio: {
    title: string
    bio: string | null
    photo_url: string | null
    primary_color: string
    secondary_color: string
    background_color: string
    font: string
    font_body: string
    social_links: Record<string, string> | null
    contact_email: string | null
    contact_form_enabled?: boolean
    contact_form_title?: string
    contact_form_description?: string
    slug?: string | null
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
  customBlocks: CustomBlock[]
  kpis: KpiItem[]
  layoutBlocks: LayoutBlock[]
  isPremium: boolean
  // When true, templates render non-interactive previews: anchor tags
  // become spans so the template can be safely nested inside a parent
  // <Link> (dashboard cards, /mes-templates grid) without producing a
  // nested <a> and triggering a DOM validation warning. Live portfolio
  // renders leave this unset so social and mailto links stay clickable.
  isPreview?: boolean
}
