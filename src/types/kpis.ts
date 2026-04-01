/** Available KPI visualization types */
export type KpiType =
  | 'number'       // Big number with label
  | 'percentage'   // Circular ring
  | 'progress'     // Horizontal progress bar
  | 'stars'        // Star rating (x/5)
  | 'trend'        // Number with up/down arrow
  | 'counter'      // Number in a card
  | 'comparison'   // Before/after numbers
  | 'bars'         // Mini bar chart (multiple values)
  | 'donut'        // Donut chart
  | 'timeline'     // Horizontal milestones

/** A single KPI item */
export interface KpiItem {
  id: string
  type: KpiType
  label: string
  value: number
  /** Max value for progress/percentage (default 100) */
  maxValue: number
  /** Unit displayed after the value (€, %, +, etc.) */
  unit: string
  /** Secondary value (for comparison, trend) */
  secondaryValue?: number
  /** Secondary label */
  secondaryLabel?: string
  /** Extra data points for bars/timeline */
  dataPoints?: Array<{ label: string; value: number }>
}

/** KPI type metadata for the editor picker */
export const KPI_TYPES: Array<{ type: KpiType; label: string; description: string; icon: string }> = [
  { type: 'number', label: 'Nombre', description: 'Grand chiffre avec label', icon: '123' },
  { type: 'percentage', label: 'Pourcentage', description: 'Anneau circulaire', icon: '%' },
  { type: 'progress', label: 'Barre', description: 'Barre de progression', icon: '▰▱' },
  { type: 'stars', label: 'Etoiles', description: 'Note sur 5 etoiles', icon: '★' },
  { type: 'trend', label: 'Tendance', description: 'Chiffre avec fleche', icon: '↑' },
  { type: 'counter', label: 'Compteur', description: 'Chiffre dans une card', icon: '#' },
  { type: 'comparison', label: 'Comparaison', description: 'Avant / Apres', icon: '⇄' },
  { type: 'bars', label: 'Mini barres', description: 'Graphique en barres', icon: '▐' },
  { type: 'donut', label: 'Donut', description: 'Diagramme circulaire', icon: '◔' },
  { type: 'timeline', label: 'Timeline', description: 'Jalons horizontaux', icon: '→' },
]

/** Parse KPIs from JSON */
export function parseKpis(raw: unknown): KpiItem[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is KpiItem =>
    typeof item === 'object' &&
    item !== null &&
    typeof (item as Record<string, unknown>).id === 'string' &&
    typeof (item as Record<string, unknown>).type === 'string' &&
    typeof (item as Record<string, unknown>).label === 'string'
  ).map((item) => ({
    id: item.id,
    type: item.type,
    label: item.label,
    value: typeof item.value === 'number' ? item.value : 0,
    maxValue: typeof item.maxValue === 'number' ? item.maxValue : 100,
    unit: typeof item.unit === 'string' ? item.unit : '',
    secondaryValue: typeof item.secondaryValue === 'number' ? item.secondaryValue : undefined,
    secondaryLabel: typeof item.secondaryLabel === 'string' ? item.secondaryLabel : undefined,
    dataPoints: Array.isArray(item.dataPoints) ? item.dataPoints : undefined,
  }))
}

export function generateKpiId(): string {
  return `kpi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}
