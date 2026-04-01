import type { KpiItem } from './kpis'

/** Content type for a layout column */
export type ColumnContentType = 'text' | 'kpi' | 'image' | 'empty'

/** A single column within a layout block */
export interface LayoutColumn {
  type: ColumnContentType
  /** For text: title */
  title?: string
  /** For text: HTML content */
  content?: string
  /** For kpi: embedded KPI data */
  kpi?: KpiItem
  /** For image: URL */
  imageUrl?: string
  /** For image: alt text */
  imageAlt?: string
}

/** A layout block with 1-3 columns */
export interface LayoutBlock {
  id: string
  columnCount: 1 | 2 | 3
  columns: LayoutColumn[]
}

/** Parse layout blocks from JSON */
export function parseLayoutBlocks(raw: unknown): LayoutBlock[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is LayoutBlock =>
    typeof item === 'object' &&
    item !== null &&
    typeof (item as Record<string, unknown>).id === 'string' &&
    Array.isArray((item as Record<string, unknown>).columns)
  ).map((item) => ({
    id: item.id,
    columnCount: ([1, 2, 3] as const).includes(item.columnCount) ? item.columnCount : item.columns.length as 1 | 2 | 3,
    columns: (item.columns as LayoutColumn[]).map((col) => ({
      type: col.type ?? 'empty',
      title: col.title,
      content: col.content,
      kpi: col.kpi,
      imageUrl: col.imageUrl,
      imageAlt: col.imageAlt,
    })),
  }))
}

export function generateLayoutId(): string {
  return `layout-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}
