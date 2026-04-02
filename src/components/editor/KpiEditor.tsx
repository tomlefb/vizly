'use client'

import { useCallback } from 'react'
import { Plus, Trash2, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateKpiId, type KpiItem } from '@/types/kpis'

interface KpiEditorProps {
  kpis: KpiItem[]
  onChange: (kpis: KpiItem[]) => void
  primaryColor: string
}

export function KpiEditor({ kpis, onChange }: KpiEditorProps) {
  const addKpi = useCallback(() => {
    onChange([...kpis, {
      id: generateKpiId(),
      type: 'number',
      label: '',
      value: 0,
      maxValue: 100,
      unit: '',
    }])
  }, [kpis, onChange])

  const updateKpi = useCallback((index: number, updates: Partial<KpiItem>) => {
    const updated = [...kpis]
    const kpi = updated[index]
    if (kpi) {
      updated[index] = { ...kpi, ...updates }
      onChange(updated)
    }
  }, [kpis, onChange])

  const removeKpi = useCallback((index: number) => {
    onChange(kpis.filter((_, i) => i !== index))
  }, [kpis, onChange])

  return (
    <section className="border border-border rounded-[var(--radius-lg)] p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
          <BarChart3 className="h-3.5 w-3.5 text-accent" />
        </div>
        <div>
          <h2 className="text-base font-medium text-foreground font-[family-name:var(--font-satoshi)]">
            Chiffres cles
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Ajoute tes KPI pour impressionner
          </p>
        </div>
      </div>

      {/* KPIs — compact inline rows */}
      {kpis.length > 0 && (
        <div className="space-y-2">
          {kpis.map((kpi, index) => (
            <div key={kpi.id} className="flex items-center gap-2 group">
              <input
                type="text"
                value={kpi.value || ''}
                onChange={(e) => {
                  const raw = e.target.value
                  const num = parseFloat(raw)
                  updateKpi(index, { value: isNaN(num) ? 0 : num })
                }}
                placeholder="42"
                className="w-20 rounded-[var(--radius-sm)] border border-border bg-white px-3 py-2 text-base font-bold text-foreground text-center placeholder:text-muted-foreground/30 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
              />
              <input
                type="text"
                value={kpi.label}
                onChange={(e) => updateKpi(index, { label: e.target.value })}
                placeholder="clients satisfaits"
                className="flex-1 rounded-[var(--radius-sm)] border border-border bg-white px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
              />
              <button
                type="button"
                onClick={() => removeKpi(index)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/5 transition-all"
                aria-label="Supprimer le KPI"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        type="button"
        onClick={addKpi}
        className="flex items-center justify-center gap-1.5 w-full border border-dashed border-accent/30 rounded-[var(--radius-md)] py-2.5 text-[12px] font-medium text-accent transition-all duration-200 hover:border-accent hover:bg-accent-light/50"
      >
        <Plus className="h-3.5 w-3.5" />
        Ajouter un KPI
      </button>
    </section>
  )
}
