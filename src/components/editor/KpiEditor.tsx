'use client'

import { useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, BarChart3 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { KPI_TYPES, generateKpiId, type KpiItem, type KpiType } from '@/types/kpis'
import { KpiRenderer } from '@/components/templates/KpiRenderer'

interface KpiEditorProps {
  kpis: KpiItem[]
  onChange: (kpis: KpiItem[]) => void
  primaryColor: string
}

const DEFAULT_KPI: KpiItem = {
  id: '', type: 'number', label: '', value: 0, maxValue: 100, unit: '',
}

export function KpiEditor({ kpis, onChange, primaryColor }: KpiEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingKpi, setEditingKpi] = useState<KpiItem>({ ...DEFAULT_KPI })

  const openNew = useCallback(() => {
    setEditingIndex(null)
    setEditingKpi({ ...DEFAULT_KPI, id: generateKpiId() })
    setIsEditing(true)
  }, [])

  const openEdit = useCallback((index: number) => {
    const kpi = kpis[index]
    if (kpi) {
      setEditingIndex(index)
      setEditingKpi({ ...kpi })
      setIsEditing(true)
    }
  }, [kpis])

  const handleSave = useCallback(() => {
    if (!editingKpi.label.trim()) return
    if (editingIndex !== null) {
      const updated = [...kpis]
      updated[editingIndex] = editingKpi
      onChange(updated)
    } else {
      onChange([...kpis, editingKpi])
    }
    setIsEditing(false)
  }, [editingKpi, editingIndex, kpis, onChange])

  const handleDelete = useCallback((index: number) => {
    onChange(kpis.filter((_, i) => i !== index))
  }, [kpis, onChange])

  const needsDataPoints = editingKpi.type === 'bars' || editingKpi.type === 'timeline'
  const needsSecondary = editingKpi.type === 'comparison' || editingKpi.type === 'trend'

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
          <BarChart3 className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
            Chiffres cles
          </h2>
          <p className="text-sm text-muted-foreground">
            Ajoute des KPI et graphiques a ton portfolio
          </p>
        </div>
      </div>

      {/* Preview of existing KPIs */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((kpi, index) => (
            <div key={kpi.id} className="relative group bg-gray-50 rounded-lg p-4">
              <KpiRenderer kpi={kpi} primaryColor={primaryColor} />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => openEdit(index)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-white hover:bg-foreground transition-colors"
                  aria-label="Modifier">
                  <Pencil className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => handleDelete(index)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                  aria-label="Supprimer">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={openNew}
        className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-500 transition-all duration-200 hover:border-accent hover:text-accent hover:bg-accent/5">
        <Plus className="h-4 w-4" />
        Ajouter un KPI
      </button>

      {/* Edit modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 backdrop-blur-sm p-4 pt-[8vh]"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setIsEditing(false) }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="w-full max-w-lg rounded-[var(--radius-xl)] border border-border bg-background shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="text-base font-semibold font-[family-name:var(--font-satoshi)]">
                  {editingIndex !== null ? 'Modifier le KPI' : 'Nouveau KPI'}
                </h3>
                <button type="button" onClick={() => setIsEditing(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:text-foreground hover:bg-surface-warm transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
                {/* Type picker */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Type de graphique</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {KPI_TYPES.map((t) => (
                      <button key={t.type} type="button"
                        onClick={() => setEditingKpi({ ...editingKpi, type: t.type })}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-[var(--radius-md)] border p-2 text-center transition-all',
                          editingKpi.type === t.type
                            ? 'border-accent bg-accent/5 text-accent'
                            : 'border-border text-muted-foreground hover:border-accent/30'
                        )}>
                        <span className="text-lg leading-none">{t.icon}</span>
                        <span className="text-[10px] font-medium leading-tight">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Label */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">Label <span className="text-destructive">*</span></label>
                  <input type="text" value={editingKpi.label}
                    onChange={(e) => setEditingKpi({ ...editingKpi, label: e.target.value })}
                    placeholder="Ex: Projets realises"
                    className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
                </div>

                {/* Value + Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Valeur</label>
                    <input type="number" value={editingKpi.value}
                      onChange={(e) => setEditingKpi({ ...editingKpi, value: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Unite</label>
                    <input type="text" value={editingKpi.unit}
                      onChange={(e) => setEditingKpi({ ...editingKpi, unit: e.target.value })}
                      placeholder="%, €, +, k..."
                      className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
                  </div>
                </div>

                {/* Max value (for progress, percentage, donut) */}
                {['percentage', 'progress', 'donut'].includes(editingKpi.type) && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Valeur max</label>
                    <input type="number" value={editingKpi.maxValue}
                      onChange={(e) => setEditingKpi({ ...editingKpi, maxValue: parseFloat(e.target.value) || 100 })}
                      className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
                  </div>
                )}

                {/* Secondary value (comparison, trend) */}
                {needsSecondary && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-foreground">
                        {editingKpi.type === 'comparison' ? 'Valeur avant' : 'Variation'}
                      </label>
                      <input type="number" value={editingKpi.secondaryValue ?? 0}
                        onChange={(e) => setEditingKpi({ ...editingKpi, secondaryValue: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-foreground">
                        {editingKpi.type === 'comparison' ? 'Label avant' : 'Label variation'}
                      </label>
                      <input type="text" value={editingKpi.secondaryLabel ?? ''}
                        onChange={(e) => setEditingKpi({ ...editingKpi, secondaryLabel: e.target.value })}
                        placeholder={editingKpi.type === 'comparison' ? 'Avant' : 'vs mois dernier'}
                        className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
                    </div>
                  </div>
                )}

                {/* Data points (bars, timeline) */}
                {needsDataPoints && (
                  <DataPointsEditor
                    points={editingKpi.dataPoints ?? []}
                    onChange={(points) => setEditingKpi({ ...editingKpi, dataPoints: points })}
                  />
                )}

                {/* Live preview */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Apercu</label>
                  <div className="rounded-[var(--radius-md)] border border-border bg-surface-warm/50 p-3">
                    <KpiRenderer kpi={editingKpi} primaryColor={primaryColor} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
                <button type="button" onClick={() => setIsEditing(false)}
                  className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-warm transition-colors">
                  Annuler
                </button>
                <button type="button" onClick={handleSave} disabled={!editingKpi.label.trim()}
                  className={cn(
                    'rounded-[var(--radius-md)] px-5 py-2 text-sm font-semibold transition-all',
                    editingKpi.label.trim() ? 'bg-accent text-white hover:bg-accent-hover' : 'bg-surface-warm text-muted-foreground/40 cursor-not-allowed'
                  )}>
                  {editingIndex !== null ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/** Sub-component for editing data points (bars/timeline) */
function DataPointsEditor({ points, onChange }: {
  points: Array<{ label: string; value: number }>
  onChange: (points: Array<{ label: string; value: number }>) => void
}) {
  const addPoint = () => onChange([...points, { label: '', value: 0 }])
  const removePoint = (i: number) => onChange(points.filter((_, idx) => idx !== i))
  const updatePoint = (i: number, field: 'label' | 'value', val: string) => {
    const updated = [...points]
    const point = updated[i]
    if (!point) return
    if (field === 'value') point.value = parseFloat(val) || 0
    else point.label = val
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">Points de donnees</label>
      {points.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="text" value={p.label} onChange={(e) => updatePoint(i, 'label', e.target.value)}
            placeholder="Label" className="flex-1 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5 text-sm" />
          <input type="number" value={p.value} onChange={(e) => updatePoint(i, 'value', e.target.value)}
            className="w-20 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5 text-sm" />
          <button type="button" onClick={() => removePoint(i)} className="text-muted-foreground hover:text-destructive">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={addPoint}
        className="text-xs text-accent font-medium hover:text-accent-hover">
        + Ajouter un point
      </button>
    </div>
  )
}
