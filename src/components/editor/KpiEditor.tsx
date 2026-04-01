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
    <section className="bg-surface-warm border border-border rounded-[var(--radius-lg)] p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
          <BarChart3 className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h2 className="text-[20px] font-medium text-foreground font-[family-name:var(--font-satoshi)]">
            Chiffres cles
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Ajoute tes KPI pour impressionner
          </p>
        </div>
      </div>

      {/* KPI cards — inline editing */}
      {kpis.length > 0 && (
        <div className="space-y-3">
          {kpis.map((kpi, index) => (
            <div key={kpi.id} className="bg-white border border-border rounded-[var(--radius-md)] p-4 space-y-3 group">
              {/* Inputs row: value (short) + label (wide) */}
              <div className="flex items-start gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Valeur
                  </label>
                  <input
                    type="text"
                    value={kpi.value || ''}
                    onChange={(e) => {
                      const raw = e.target.value
                      const num = parseFloat(raw)
                      updateKpi(index, { value: isNaN(num) ? 0 : num, unit: raw.replace(/[0-9.,\-+]/g, '').trim() || kpi.unit })
                    }}
                    placeholder="42"
                    className="w-[100px] rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-[20px] font-bold text-foreground text-center placeholder:text-muted-foreground/30 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Label
                  </label>
                  <input
                    type="text"
                    value={kpi.label}
                    onChange={(e) => updateKpi(index, { label: e.target.value })}
                    placeholder="clients satisfaits"
                    className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Unite
                  </label>
                  <input
                    type="text"
                    value={kpi.unit}
                    onChange={(e) => updateKpi(index, { unit: e.target.value })}
                    placeholder="%"
                    className="w-[60px] rounded-[var(--radius-sm)] border border-border bg-surface px-2 py-2 text-[15px] text-foreground text-center placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeKpi(index)}
                  className="mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/5 transition-all"
                  aria-label="Supprimer le KPI"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Live mini-preview */}
              {(kpi.value || kpi.label) && (
                <div className="flex items-baseline gap-2 bg-surface-warm rounded-[var(--radius-sm)] px-3 py-2">
                  <span className="text-[24px] font-bold text-accent leading-none">
                    {kpi.value}{kpi.unit}
                  </span>
                  {kpi.label && (
                    <span className="text-[13px] text-muted">{kpi.label}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add button — dashed terracotta */}
      <button
        type="button"
        onClick={addKpi}
        className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-accent/30 rounded-[var(--radius-lg)] py-3 text-[13px] font-medium text-accent transition-all duration-200 hover:border-accent hover:bg-accent-light"
      >
        <Plus className="h-4 w-4" />
        Ajouter un KPI
      </button>
    </section>
  )
}
