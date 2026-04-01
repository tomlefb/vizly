/** A custom text block added by the user */
export interface CustomBlock {
  id: string
  title: string
  subtitle: string
  /** HTML content with basic formatting */
  content: string
  order: number
}

/** Parse custom blocks from JSON (DB), fallback to empty */
export function parseCustomBlocks(raw: unknown): CustomBlock[] {
  if (!Array.isArray(raw)) return []

  return raw.filter((item): item is CustomBlock =>
    typeof item === 'object' &&
    item !== null &&
    typeof (item as Record<string, unknown>).id === 'string' &&
    typeof (item as Record<string, unknown>).title === 'string' &&
    typeof (item as Record<string, unknown>).content === 'string'
  ).map((item, i) => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle ?? '',
    content: item.content,
    order: typeof item.order === 'number' ? item.order : i,
  }))
}

/** Generate a unique ID for a new block */
export function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
