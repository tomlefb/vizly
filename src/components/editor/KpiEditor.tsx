'use client'

import { useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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

  const inputBase =
    'h-10 rounded-[var(--radius-md)] border border-border-light bg-surface px-3 py-2 text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:border-foreground'

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
          Chiffres clés
        </h3>
        <p className="text-sm text-muted mt-1">
          Ajoute tes KPI pour impressionner
        </p>
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
                className={cn(inputBase, 'w-20 text-base font-bold text-center')}
              />
              <input
                type="text"
                value={kpi.label}
                onChange={(e) => updateKpi(index, { label: e.target.value })}
                placeholder="clients satisfaits"
                className={cn(inputBase, 'flex-1 text-sm')}
              />
              <button
                type="button"
                onClick={() => removeKpi(index)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-muted opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/5 transition-all"
                aria-label="Supprimer le KPI"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        type="button"
        onClick={addKpi}
        className="flex items-center justify-center gap-1.5 w-full h-10 border border-dashed border-border-light rounded-[var(--radius-md)] text-sm font-medium text-muted transition-colors duration-150 hover:border-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
        Ajouter un KPI
      </button>
    </section>
  )
}
