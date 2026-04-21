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

// ------------------------------------------------------------------
// Color helpers — shared across templates
// ------------------------------------------------------------------

/** Returns the relative luminance of a hex color. Result in [0, 1]. */
export function getLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return 0.5
  const toLin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const r = toLin(parseInt(clean.substring(0, 2), 16))
  const g = toLin(parseInt(clean.substring(2, 4), 16))
  const b = toLin(parseInt(clean.substring(4, 6), 16))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** True if the color is light enough that dark text reads well on it. */
export function isLightColor(hex: string): boolean {
  return getLuminance(hex) > 0.55
}

/** Mix a hex color with white. amount 0=hex, 1=white. */
export function lightenHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  const lr = Math.round(r + (255 - r) * amount)
  const lg = Math.round(g + (255 - g) * amount)
  const lb = Math.round(b + (255 - b) * amount)
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`
}

/** Mix a hex color with black. amount 0=hex, 1=black. */
export function darkenHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  const lr = Math.round(r * (1 - amount))
  const lg = Math.round(g * (1 - amount))
  const lb = Math.round(b * (1 - amount))
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`
}
