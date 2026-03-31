/** Available section block IDs */
export type SectionId = 'hero' | 'bio' | 'socials' | 'projects' | 'skills' | 'contact'

/** A section block with visibility and order */
export interface SectionBlock {
  id: SectionId
  visible: boolean
  order: number
}

/** Labels for each section shown in the UI */
export const SECTION_LABELS: Record<SectionId, string> = {
  hero: 'En-tete (nom + photo)',
  bio: 'Biographie',
  socials: 'Reseaux sociaux',
  projects: 'Projets',
  skills: 'Competences',
  contact: 'Formulaire de contact',
}

/** Default sections for new portfolios */
export const DEFAULT_SECTIONS: SectionBlock[] = [
  { id: 'hero', visible: true, order: 0 },
  { id: 'bio', visible: true, order: 1 },
  { id: 'socials', visible: true, order: 2 },
  { id: 'projects', visible: true, order: 3 },
  { id: 'skills', visible: true, order: 4 },
  { id: 'contact', visible: false, order: 5 },
]

/** Parse sections from JSON (DB or form), fallback to defaults */
export function parseSections(raw: unknown): SectionBlock[] {
  if (!Array.isArray(raw)) return [...DEFAULT_SECTIONS]

  const parsed: SectionBlock[] = []
  const validIds = new Set<SectionId>(['hero', 'bio', 'socials', 'projects', 'skills', 'contact'])
  const seenIds = new Set<string>()

  for (const item of raw) {
    if (
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      typeof item.id === 'string' &&
      validIds.has(item.id as SectionId) &&
      !seenIds.has(item.id)
    ) {
      seenIds.add(item.id)
      parsed.push({
        id: item.id as SectionId,
        visible: typeof item.visible === 'boolean' ? item.visible : true,
        order: typeof item.order === 'number' ? item.order : parsed.length,
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
