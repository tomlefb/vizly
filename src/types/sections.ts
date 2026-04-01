/** Available section block IDs — custom blocks use 'custom-{blockId}' format */
export type SectionId = 'hero' | 'bio' | 'socials' | 'projects' | 'skills' | 'kpis' | 'contact' | `custom-${string}` | `layout-${string}`

/** A section block with visibility, order, and optional width (1-12 grid columns) */
export interface SectionBlock {
  id: SectionId
  visible: boolean
  order: number
  width?: number
}

/** Labels for builtin sections shown in the UI */
const BUILTIN_LABELS: Record<string, string> = {
  hero: 'En-tete (nom + photo)',
  bio: 'Biographie',
  socials: 'Reseaux sociaux',
  projects: 'Projets',
  skills: 'Competences',
  kpis: 'Chiffres cles',
  contact: 'Formulaire de contact',
}

/** Get the label for a section (supports custom blocks) */
export function getSectionLabel(id: SectionId, customTitle?: string): string {
  if (id.startsWith('layout-')) return customTitle ?? 'Section colonnes'
  if (id.startsWith('custom-')) return customTitle ?? 'Bloc texte'
  return BUILTIN_LABELS[id] ?? id
}

/** Default sections for new portfolios */
export const DEFAULT_SECTIONS: SectionBlock[] = [
  { id: 'hero', visible: true, order: 0 },
  { id: 'bio', visible: true, order: 1 },
  { id: 'socials', visible: true, order: 2 },
  { id: 'projects', visible: true, order: 3 },
  { id: 'skills', visible: true, order: 4 },
  { id: 'kpis', visible: false, order: 5 },
  { id: 'contact', visible: false, order: 6 },
]

/** Parse sections from JSON (DB or form), fallback to defaults */
export function parseSections(raw: unknown): SectionBlock[] {
  if (!Array.isArray(raw)) return [...DEFAULT_SECTIONS]

  const parsed: SectionBlock[] = []
  const builtinIds = new Set(['hero', 'bio', 'socials', 'projects', 'skills', 'kpis', 'contact'])
  const seenIds = new Set<string>()

  for (const item of raw) {
    if (
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      typeof item.id === 'string' &&
      (builtinIds.has(item.id) || item.id.startsWith('custom-') || item.id.startsWith('layout-')) &&
      !seenIds.has(item.id)
    ) {
      seenIds.add(item.id)
      parsed.push({
        id: item.id as SectionId,
        visible: typeof item.visible === 'boolean' ? item.visible : true,
        order: typeof item.order === 'number' ? item.order : parsed.length,
        width: 'width' in item && typeof item.width === 'number' ? item.width : undefined,
      })
    }
  }

  // Add any missing sections at the end (hidden)
  for (const defaultSection of DEFAULT_SECTIONS) {
    if (!seenIds.has(defaultSection.id)) {
      parsed.push({
        ...defaultSection,
        visible: false,
        order: parsed.length,
      })
    }
  }

  return parsed.sort((a, b) => a.order - b.order)
}

/** Parse skills from JSON (DB), fallback to empty */
export function parseSkills(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === 'string')
}
