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
import { isSafeUrl } from '@/lib/sanitize'

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
  return Object.entries(socialLinks).filter(([, url]) => url && isSafeUrl(url))
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

/** Mix two hex colors. amount 0 = a, 1 = b. */
export function mixHex(a: string, b: string, amount: number): string {
  const clean = (h: string) => h.replace('#', '')
  const ca = clean(a)
  const cb = clean(b)
  if (ca.length !== 6 || cb.length !== 6) return a
  const ar = parseInt(ca.substring(0, 2), 16)
  const ag = parseInt(ca.substring(2, 4), 16)
  const ab = parseInt(ca.substring(4, 6), 16)
  const br = parseInt(cb.substring(0, 2), 16)
  const bg = parseInt(cb.substring(2, 4), 16)
  const bb = parseInt(cb.substring(4, 6), 16)
  const r = Math.round(ar + (br - ar) * amount)
  const g = Math.round(ag + (bg - ag) * amount)
  const bC = Math.round(ab + (bb - ab) * amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bC.toString(16).padStart(2, '0')}`
}

/**
 * Derives a complete text/surface/border palette from the 4 user-picked colors
 * (primary/accent, heading, body, background). When heading or body don't
 * contrast enough with the bg (e.g. dark-on-dark, light-on-light) we fall
 * back to a natural anchor so nothing becomes invisible.
 *
 * - `title`: strong text for H1/H2/H3 (user-picked heading, contrast-checked)
 * - `body`: paragraph text (user-picked body, contrast-checked)
 * - `muted`: secondary text (labels, descriptions)
 * - `meta`: tertiary text (captions, metadata, placeholders)
 * - `borderStrong`: active dividers (hover state, focus)
 * - `border`: default dividers (card borders)
 * - `borderLight`: very subtle dividers (at-rest card borders)
 * - `surface`: card background (contrast against page bg)
 * - `surfaceWarm`: alternating section background (subtle warm tone)
 */
export interface TemplatePalette {
  primary: string
  heading: string
  body: string
  bg: string
  title: string
  muted: string
  meta: string
  borderStrong: string
  border: string
  borderLight: string
  surface: string
  surfaceWarm: string
  accentSoft: string
  bgIsDark: boolean
}

/** Pick the heading/body user value if it contrasts with bg, else the natural anchor. */
function resolveContrast(value: string, bg: string): string {
  const bgLum = getLuminance(bg)
  const valLum = getLuminance(value)
  if (Math.abs(valLum - bgLum) >= 0.25) return value
  return bgLum > 0.55 ? '#1A1A1A' : '#F0F0F5'
}

export function getTemplatePalette(
  primary: string,
  heading: string,
  body: string,
  bg: string,
): TemplatePalette {
  const bgIsDark = !isLightColor(bg)
  const resolvedHeading = resolveContrast(heading, bg)
  const resolvedBody = resolveContrast(body, bg)

  // Surface: card/input bg — lift away from page bg.
  const surface = bgIsDark ? mixHex(bg, '#FFFFFF', 0.06) : '#FFFFFF'
  const surfaceWarm = mixHex(bg, resolvedBody, 0.04)

  // Muted/meta/borders derive from body (more neutral than heading).
  return {
    primary,
    heading: resolvedHeading,
    body: resolvedBody,
    bg,
    title: resolvedHeading,
    muted: mixHex(resolvedBody, bg, 0.38),
    meta: mixHex(resolvedBody, bg, 0.62),
    borderStrong: mixHex(resolvedBody, bg, 0.72),
    border: mixHex(resolvedBody, bg, 0.84),
    borderLight: mixHex(resolvedBody, bg, 0.92),
    surface,
    surfaceWarm,
    accentSoft: mixHex(primary, bg, 0.88),
    bgIsDark,
  }
}
