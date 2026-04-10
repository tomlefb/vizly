import type { LucideIcon } from 'lucide-react'
import {
  Code2,
  Link2,
  Camera,
  AtSign,
  Globe,
  Pen,
} from 'lucide-react'
import { DEFAULT_SECTIONS, type SectionBlock } from '@/types/sections'
import type { TemplateProps } from '@/types'

// ------------------------------------------------------------------
// Social icons — shared across all templates
// ------------------------------------------------------------------

export interface SocialIconEntry {
  icon: LucideIcon
  label: string
}

export const SOCIAL_ICONS: Record<string, SocialIconEntry> = {
  github: { icon: Code2, label: 'GitHub' },
  linkedin: { icon: Link2, label: 'LinkedIn' },
  instagram: { icon: Camera, label: 'Instagram' },
  twitter: { icon: AtSign, label: 'Twitter' },
  dribbble: { icon: Pen, label: 'Dribbble' },
  website: { icon: Globe, label: 'Website' },
}

// ------------------------------------------------------------------
// Section helpers — shared across all templates
// ------------------------------------------------------------------

export function getVisibleSections(sections: SectionBlock[] | undefined): SectionBlock[] {
  return [...(sections ?? DEFAULT_SECTIONS)]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)
}

export function getSortedProjects(projects: TemplateProps['projects']) {
  return [...projects].sort((a, b) => a.display_order - b.display_order)
}

export function getSocialEntries(socialLinks: Record<string, string> | null) {
  if (!socialLinks) return []
  return Object.entries(socialLinks).filter(([, url]) => url)
}
