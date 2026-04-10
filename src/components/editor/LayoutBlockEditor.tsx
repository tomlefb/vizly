'use client'

import { useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Columns3, Type, BarChart3, ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { RichTextEditor } from './RichTextEditor'
import { KpiRenderer } from '@/components/templates/KpiRenderer'
import { generateLayoutId, type LayoutBlock, type LayoutColumn, type ColumnContentType } from '@/types/layout-blocks'
import { KPI_TYPES, generateKpiId, type KpiItem, type KpiType } from '@/types/kpis'

interface LayoutBlockEditorProps {
  blocks: LayoutBlock[]
  onChange: (blocks: LayoutBlock[]) => void
  primaryColor: string
}

const EMPTY_COLUMN: LayoutColumn = { type: 'empty' }

const COLUMN_TYPE_OPTIONS: Array<{ type: ColumnContentType; label: string; icon: typeof Type }> = [
  { type: 'text', label: 'Texte', icon: Type },
  { type: 'kpi', label: 'KPI', icon: BarChart3 },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'empty', label: 'Vide', icon: X },
]

export function LayoutBlockEditor({ blocks, onChange, primaryColor }: LayoutBlockEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingBlock, setEditingBlock] = useState<LayoutBlock>({
    id: '', columnCount: 2, columns: [{ ...EMPTY_COLUMN }, { ...EMPTY_COLUMN }],
  })

  const openNew = useCallback(() => {
    setEditingIndex(null)
    setEditingBlock({
      id: generateLayoutId(),
      columnCount: 2,
      columns: [{ ...EMPTY_COLUMN }, { ...EMPTY_COLUMN }],
    })
    setIsEditing(true)
  }, [])

  const openEdit = useCallback((index: number) => {
    const block = blocks[index]
    if (block) {
      setEditingIndex(index)
      setEditingBlock(JSON.parse(JSON.stringify(block)))
      setIsEditing(true)
    }
  }, [blocks])

  const handleSave = useCallback(() => {
    if (editingIndex !== null) {
      const updated = [...blocks]
      updated[editingIndex] = editingBlock
      onChange(updated)
    } else {
      onChange([...blocks, editingBlock])
    }
    setIsEditing(false)
  }, [editingBlock, editingIndex, blocks, onChange])

  const handleDelete = useCallback((index: number) => {
    onChange(blocks.filter((_, i) => i !== index))
  }, [blocks, onChange])

  const setColumnCount = useCallback((count: 1 | 2 | 3) => {
    const cols = [...editingBlock.columns]
    while (cols.length < count) cols.push({ ...EMPTY_COLUMN })
    setEditingBlock({ ...editingBlock, columnCount: count, columns: cols.slice(0, count) })
  }, [editingBlock])

  const updateColumn = useCallback((colIndex: number, updates: Partial<LayoutColumn>) => {
    const cols = [...editingBlock.columns]
    const col = cols[colIndex]
    if (col) {
      cols[colIndex] = { ...col, ...updates }
      setEditingBlock({ ...editingBlock, columns: cols })
    }
  }, [editingBlock])

  const setColumnType = useCallback((colIndex: number, type: ColumnContentType) => {
    const newCol: LayoutColumn = { type }
    if (type === 'kpi') {
      newCol.kpi = { id: generateKpiId(), type: 'number' as KpiType, label: '', value: 0, maxValue: 100, unit: '' }
    }
    const cols = [...editingBlock.columns]
    cols[colIndex] = newCol
    setEditingBlock({ ...editingBlock, columns: cols })
  }, [editingBlock])

  return (
    <section className="bg-white border border-border/60 rounded-[var(--radius-lg)] p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
          <Columns3 className="h-3.5 w-3.5 text-accent" />
        </div>
        <div>
          <h2 className="text-base font-medium text-foreground font-[family-name:var(--font-satoshi)]">
            Sections en colonnes
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Crée des sections avec 1, 2 ou 3 colonnes
          </p>
        </div>
      </div>

      {/* Existing blocks */}
      {blocks.length > 0 && (
        <div className="space-y-2">
          {blocks.map((block, index) => (
            <div key={block.id} className="flex items-center gap-3 bg-white rounded-[var(--radius-md)] border border-border px-4 py-3 group">
              <Columns3 className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground">
                  {block.columnCount} colonne{block.columnCount > 1 ? 's' : ''} — {block.columns.filter((c) => c.type !== 'empty').length} contenu{block.columns.filter((c) => c.type !== 'empty').length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted truncate">
                  {block.columns.map((c) => c.type === 'text' ? (c.title || 'Texte') : c.type === 'kpi' ? 'KPI' : c.type === 'image' ? 'Image' : 'Vide').join(' | ')}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => openEdit(index)} className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:text-foreground hover:bg-surface-warm transition-colors" aria-label="Modifier">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => handleDelete(index)} className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors" aria-label="Supprimer">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={openNew} className="flex items-center justify-center gap-1.5 w-full border border-dashed border-accent/30 rounded-[var(--radius-md)] py-2.5 text-[12px] font-medium text-accent transition-all duration-200 hover:border-accent hover:bg-accent-light/50">
        <Plus className="h-4 w-4" />
        Ajouter une section colonnes
      </button>

      {/* Edit modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 backdrop-blur-sm p-4 pt-[5vh]"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setIsEditing(false) }}>
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="w-full max-w-3xl rounded-[var(--radius-xl)] border border-border bg-background shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="text-base font-semibold font-[family-name:var(--font-satoshi)]">
                  {editingIndex !== null ? 'Modifier la section' : 'Nouvelle section colonnes'}
                </h3>
                <button type="button" onClick={() => setIsEditing(false)} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:text-foreground hover:bg-surface-warm transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Column count picker — visual mini-schemas */}
                <div className="space-y-2">
                  <label className="block text-[13px] font-medium text-muted">Nombre de colonnes</label>
                  <div className="flex gap-3">
                    {([1, 2, 3] as const).map((n) => {
                      const isActive = editingBlock.columnCount === n
                      return (
                        <button key={n} type="button" onClick={() => setColumnCount(n)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] border-2 p-2.5 transition-all w-[72px]',
                            isActive
                              ? 'border-accent bg-accent-light'
                              : 'border-border hover:border-accent/30'
                          )}>
                          {/* Mini-schema */}
                          <div className="flex gap-1 w-[48px] h-[32px]">
                            {Array.from({ length: n }).map((_, i) => (
                              <div key={i} className={cn(
                                'flex-1 rounded-sm transition-colors',
                                isActive ? 'bg-accent/40' : 'bg-border'
                              )} />
                            ))}
                          </div>
                          <span className={cn(
                            'text-[11px] font-medium',
                            isActive ? 'text-accent' : 'text-muted-foreground'
                          )}>{n} col{n > 1 ? 's' : ''}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Column editors */}
                <div className={cn('grid gap-4', editingBlock.columnCount === 1 ? 'grid-cols-1' : editingBlock.columnCount === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
                  {editingBlock.columns.slice(0, editingBlock.columnCount).map((col, i) => (
                    <div key={i} className="space-y-3 rounded-[var(--radius-lg)] border border-border p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Colonne {i + 1}</p>

                      {/* Type picker */}
                      <div className="grid grid-cols-2 gap-1">
                        {COLUMN_TYPE_OPTIONS.map((opt) => (
                          <button key={opt.type} type="button" onClick={() => setColumnType(i, opt.type)}
                            className={cn(
                              'flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2 py-1.5 text-xs font-medium transition-all',
                              col.type === opt.type ? 'border-accent bg-accent/5 text-accent' : 'border-border text-muted-foreground hover:border-accent/30'
                            )}>
                            <opt.icon className="h-3 w-3" />
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Content editor per type */}
                      {col.type === 'text' && (
                        <div className="space-y-2">
                          <input type="text" value={col.title ?? ''} onChange={(e) => updateColumn(i, { title: e.target.value })}
                            placeholder="Titre (optionnel)" className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5 text-xs" />
                          <RichTextEditor value={col.content ?? ''} onChange={(html) => updateColumn(i, { content: html })} placeholder="Contenu..." />
                        </div>
                      )}

                      {col.type === 'kpi' && col.kpi && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-1">
                            {KPI_TYPES.slice(0, 6).map((t) => (
                              <button key={t.type} type="button"
                                onClick={() => updateColumn(i, { kpi: { ...col.kpi!, type: t.type } })}
                                className={cn('text-[10px] rounded border px-1.5 py-1 transition-all',
                                  col.kpi?.type === t.type ? 'border-accent text-accent bg-accent/5' : 'border-border text-muted-foreground')}>
                                {t.icon} {t.label}
                              </button>
                            ))}
                          </div>
                          <input type="text" value={col.kpi.label} onChange={(e) => updateColumn(i, { kpi: { ...col.kpi!, label: e.target.value } })}
                            placeholder="Label" className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5 text-xs" />
                          <div className="flex gap-2">
                            <input type="number" value={col.kpi.value} onChange={(e) => updateColumn(i, { kpi: { ...col.kpi!, value: parseFloat(e.target.value) || 0 } })}
                              placeholder="Valeur" className="flex-1 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5 text-xs" />
                            <input type="text" value={col.kpi.unit} onChange={(e) => updateColumn(i, { kpi: { ...col.kpi!, unit: e.target.value } })}
                              placeholder="Unite" className="w-16 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5 text-xs" />
                          </div>
                          <div className="rounded-[var(--radius-sm)] bg-surface-warm/50 p-2">
                            <KpiRenderer kpi={col.kpi} primaryColor={primaryColor} />
                          </div>
                        </div>
                      )}

                      {col.type === 'image' && (
                        <div className="space-y-2">
                          <input type="url" value={col.imageUrl ?? ''} onChange={(e) => updateColumn(i, { imageUrl: e.target.value })}
                            placeholder="URL de l'image" className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5 text-xs" />
                          <input type="text" value={col.imageAlt ?? ''} onChange={(e) => updateColumn(i, { imageAlt: e.target.value })}
                            placeholder="Description (alt)" className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5 text-xs" />
                          {col.imageUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={col.imageUrl} alt={col.imageAlt ?? ''} className="w-full rounded-[var(--radius-sm)] border border-border object-cover max-h-32" />
                          )}
                        </div>
                      )}

                      {col.type === 'empty' && (
                        <p className="text-xs text-muted-foreground/50 italic text-center py-4">Colonne vide</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
                <button type="button" onClick={() => setIsEditing(false)} className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-warm transition-colors">
                  Annuler
                </button>
                <button type="button" onClick={handleSave}
                  className="rounded-[var(--radius-md)] px-5 py-2 text-sm font-semibold bg-accent text-white hover:bg-accent-hover transition-all active:scale-[0.98]">
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
