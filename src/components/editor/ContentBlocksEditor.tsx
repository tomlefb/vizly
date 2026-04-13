'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Type,
  BarChart3,
  Columns,
  ChevronDown,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RichTextEditor } from './RichTextEditor'
import { KpiRenderer } from '@/components/templates/KpiRenderer'
import type { CustomBlock } from '@/types/custom-blocks'
import type { KpiItem } from '@/types/kpis'
import type { LayoutBlock, LayoutColumn, ColumnContentType } from '@/types/layout-blocks'
import { generateBlockId } from '@/types/custom-blocks'
import { generateKpiId, KPI_TYPES } from '@/types/kpis'
import { generateLayoutId } from '@/types/layout-blocks'

// ------------------------------------------------------------------
// Types & constants
// ------------------------------------------------------------------

type ModalType = 'block' | 'kpi' | 'layout' | null

type ContentItem =
  | { kind: 'block'; index: number; data: CustomBlock }
  | { kind: 'kpi'; index: number; data: KpiItem }
  | { kind: 'layout'; index: number; data: LayoutBlock }

const inputClass =
  'w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]'

const BLOCK_TYPES = [
  { kind: 'block' as const, icon: Type, label: 'Texte', desc: 'Un titre et un paragraphe' },
  { kind: 'kpi' as const, icon: BarChart3, label: 'Chiffres cles', desc: 'Tes KPI et stats' },
  { kind: 'layout' as const, icon: Columns, label: 'Colonnes', desc: 'Contenu cote a cote en 2 ou 3 colonnes' },
]

const COLUMN_CONTENT_TYPES: { value: ColumnContentType; label: string }[] = [
  { value: 'text', label: 'Texte' },
  { value: 'image', label: 'Image' },
  { value: 'kpi', label: 'KPI' },
  { value: 'empty', label: 'Vide' },
]

function stripHtml(html: string): string {
  if (typeof document !== 'undefined') {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent ?? ''
  }
  return html.replace(/<[^>]*>/g, '')
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

interface ContentBlocksEditorProps {
  customBlocks: CustomBlock[]
  onCustomBlocksChange: (blocks: CustomBlock[]) => void
  kpis: KpiItem[]
  onKpisChange: (kpis: KpiItem[]) => void
  layoutBlocks: LayoutBlock[]
  onLayoutBlocksChange: (blocks: LayoutBlock[]) => void
}

export function ContentBlocksEditor({
  customBlocks, onCustomBlocksChange,
  kpis, onKpisChange,
  layoutBlocks, onLayoutBlocksChange,
}: ContentBlocksEditorProps) {
  const [modalType, setModalType] = useState<ModalType>(null)
  const [editingIndex, setEditingIndex] = useState(-1)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [editingBlock, setEditingBlock] = useState<CustomBlock>({ id: '', title: '', subtitle: '', content: '', order: 0 })
  const [editingKpi, setEditingKpi] = useState<KpiItem>({ id: '', type: 'number', label: '', value: 0, maxValue: 100, unit: '' })
  const [editingLayout, setEditingLayout] = useState<LayoutBlock>({ id: '', columnCount: 2, columns: [] })

  useEffect(() => {
    if (!showDropdown) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showDropdown])

  const closeModal = useCallback(() => {
    setModalType(null); setEditingIndex(-1)
  }, [])

  const contentItems: ContentItem[] = [
    ...customBlocks.map((b, i) => ({ kind: 'block' as const, index: i, data: b })),
    ...kpis.map((k, i) => ({ kind: 'kpi' as const, index: i, data: k })),
    ...layoutBlocks.map((l, i) => ({ kind: 'layout' as const, index: i, data: l })),
  ]

  // ── Block handlers ──

  const openAddBlock = useCallback(() => {
    setEditingBlock({ id: generateBlockId(), title: '', subtitle: '', content: '', order: customBlocks.length })
    setEditingIndex(-1); setModalType('block'); setShowDropdown(false)
  }, [customBlocks.length])

  const openEditBlock = useCallback((i: number) => {
    const b = customBlocks[i]; if (!b) return; setEditingBlock({ ...b }); setEditingIndex(i); setModalType('block')
  }, [customBlocks])

  const saveBlock = useCallback(() => {
    if (!editingBlock.title.trim()) return
    if (editingIndex >= 0) { const u = [...customBlocks]; u[editingIndex] = editingBlock; onCustomBlocksChange(u) }
    else { onCustomBlocksChange([...customBlocks, editingBlock]) }
    closeModal()
  }, [editingIndex, editingBlock, customBlocks, onCustomBlocksChange, closeModal])

  const deleteBlock = useCallback((i: number) => { onCustomBlocksChange(customBlocks.filter((_, j) => j !== i)) }, [customBlocks, onCustomBlocksChange])

  // ── KPI handlers ──

  const openAddKpi = useCallback(() => {
    setEditingKpi({ id: generateKpiId(), type: 'number', label: '', value: 0, maxValue: 100, unit: '' })
    setEditingIndex(-1); setModalType('kpi'); setShowDropdown(false)
  }, [])

  const openEditKpi = useCallback((i: number) => {
    const k = kpis[i]; if (!k) return; setEditingKpi({ ...k }); setEditingIndex(i); setModalType('kpi')
  }, [kpis])

  const saveKpi = useCallback(() => {
    if (!editingKpi.label.trim()) return
    if (editingIndex >= 0) { const u = [...kpis]; u[editingIndex] = editingKpi; onKpisChange(u) }
    else { onKpisChange([...kpis, editingKpi]) }
    closeModal()
  }, [editingIndex, editingKpi, kpis, onKpisChange, closeModal])

  const deleteKpi = useCallback((i: number) => { onKpisChange(kpis.filter((_, j) => j !== i)) }, [kpis, onKpisChange])

  // ── Layout handlers ──

  const openAddLayout = useCallback(() => {
    setEditingLayout({
      id: generateLayoutId(), columnCount: 2,
      columns: [{ type: 'text', title: '', content: '' }, { type: 'text', title: '', content: '' }],
    })
    setEditingIndex(-1); setModalType('layout'); setShowDropdown(false)
  }, [])

  const openEditLayout = useCallback((i: number) => {
    const l = layoutBlocks[i]; if (!l) return
    setEditingLayout({ ...l, columns: l.columns.map((c) => ({ ...c, kpi: c.kpi ? { ...c.kpi } : undefined })) })
    setEditingIndex(i); setModalType('layout')
  }, [layoutBlocks])

  const saveLayout = useCallback(() => {
    if (editingIndex >= 0) { const u = [...layoutBlocks]; u[editingIndex] = editingLayout; onLayoutBlocksChange(u) }
    else { onLayoutBlocksChange([...layoutBlocks, editingLayout]) }
    closeModal()
  }, [editingIndex, editingLayout, layoutBlocks, onLayoutBlocksChange, closeModal])

  const deleteLayout = useCallback((i: number) => { onLayoutBlocksChange(layoutBlocks.filter((_, j) => j !== i)) }, [layoutBlocks, onLayoutBlocksChange])

  const setLayoutColumnCount = useCallback((count: 2 | 3) => {
    const columns: LayoutColumn[] = Array.from({ length: count }, (_, i) =>
      editingLayout.columns[i] ?? { type: 'text' as const, title: '', content: '' }
    )
    setEditingLayout({ ...editingLayout, columnCount: count, columns })
  }, [editingLayout])

  const updateLayoutColumn = useCallback((colIdx: number, updates: Partial<LayoutColumn>) => {
    const cols = editingLayout.columns.map((c, i) => i === colIdx ? { ...c, ...updates } : c)
    setEditingLayout({ ...editingLayout, columns: cols })
  }, [editingLayout])

  const setColumnType = useCallback((colIdx: number, newType: ColumnContentType) => {
    const base: LayoutColumn = { type: newType }
    if (newType === 'text') { base.title = ''; base.content = '' }
    if (newType === 'kpi') { base.kpi = { id: generateKpiId(), type: 'number', label: '', value: 0, maxValue: 100, unit: '' } }
    if (newType === 'image') { base.imageUrl = ''; base.imageAlt = '' }
    updateLayoutColumn(colIdx, base)
  }, [updateLayoutColumn])

  // ── Content item dispatch ──

  const deleteContentItem = useCallback((item: ContentItem) => {
    if (item.kind === 'block') deleteBlock(item.index)
    else if (item.kind === 'kpi') deleteKpi(item.index)
    else deleteLayout(item.index)
  }, [deleteBlock, deleteKpi, deleteLayout])

  const editContentItem = useCallback((item: ContentItem) => {
    if (item.kind === 'block') openEditBlock(item.index)
    else if (item.kind === 'kpi') openEditKpi(item.index)
    else openEditLayout(item.index)
  }, [openEditBlock, openEditKpi, openEditLayout])

  // ── Modal footer ──

  function ModalFooter({ onSave, disabled, label }: { onSave: () => void; disabled: boolean; label: string }) {
    return (
      <div className="shrink-0 px-8 py-4 bg-white border-t border-[#E5E7EB] flex items-center justify-end gap-3">
        <button type="button" onClick={closeModal} className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors">Annuler</button>
        <button type="button" onClick={onSave} disabled={disabled} className={cn('h-10 rounded-lg px-5 text-sm font-medium transition-colors duration-150', disabled ? 'bg-[#D4634E]/50 text-white/60 cursor-not-allowed' : 'bg-[#D4634E] text-white hover:bg-[#C05640]')}>
          {label}
        </button>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="flex-1 mt-8 lg:mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold leading-7 text-[#111827]">Blocs de contenu</h2>
        <div className="relative" ref={dropdownRef}>
          <button type="button" onClick={() => setShowDropdown(!showDropdown)} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#D4634E] hover:text-[#C05640] transition-colors">
            <Plus className="h-4 w-4" /> Ajouter <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-150', showDropdown && 'rotate-180')} />
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-[260px] rounded-xl border border-[#E5E7EB] bg-white p-1.5 z-10 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
              {BLOCK_TYPES.map((bt) => (
                <button key={bt.kind} type="button" onClick={() => { if (bt.kind === 'block') openAddBlock(); else if (bt.kind === 'kpi') openAddKpi(); else openAddLayout() }} className="flex items-start gap-3 w-full rounded-lg px-3 py-2.5 text-left hover:bg-[#F3F4F6] transition-colors duration-150">
                  <bt.icon className="h-4 w-4 text-[#6B7280] mt-0.5 shrink-0" strokeWidth={1.5} />
                  <div><p className="text-sm font-medium text-[#111827]">{bt.label}</p><p className="text-[13px] text-[#9CA3AF]">{bt.desc}</p></div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {contentItems.length === 0 ? (
        <p className="text-sm text-[#9CA3AF] py-8">Aucun bloc de contenu</p>
      ) : (
        <div className="space-y-2">
          {contentItems.map((item) => {
            const key = `${item.kind}-${item.index}`
            let icon: React.ReactNode, title: string, preview: string
            if (item.kind === 'block') { icon = <Type className="h-3.5 w-3.5 text-[#6B7280]" strokeWidth={1.5} />; title = item.data.title || 'Sans titre'; preview = stripHtml(item.data.content).slice(0, 60) }
            else if (item.kind === 'kpi') { icon = <BarChart3 className="h-3.5 w-3.5 text-[#6B7280]" strokeWidth={1.5} />; title = `${item.data.value}${item.data.unit}`; preview = item.data.label }
            else { icon = <Columns className="h-3.5 w-3.5 text-[#6B7280]" strokeWidth={1.5} />; title = `${item.data.columnCount} colonnes`; preview = item.data.columns.map((c) => c.title || c.type).join(' / ') }
            return (
              <div key={key} className="group flex items-center gap-2.5 rounded-xl border border-[#E5E7EB] bg-white p-3 transition-[border-color] duration-150 hover:border-[#D1D5DB]">
                <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-[#F9FAFB]">{icon}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-[#111827] truncate">{title}</p>{preview && <p className="text-[13px] text-[#9CA3AF] truncate">{preview}</p>}</div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => editContentItem(item)} className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors" aria-label="Modifier"><Pencil className="h-3 w-3" /></button>
                  <button type="button" onClick={() => deleteContentItem(item)} className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#DC2626] hover:bg-[#F3F4F6] transition-colors" aria-label="Supprimer"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {modalType && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} onKeyDown={() => {}} role="presentation" />
          <div className={cn('relative w-full max-h-[85vh] flex flex-col bg-white rounded-xl overflow-hidden mx-4', modalType === 'layout' ? 'max-w-[1060px]' : 'max-w-[560px]')}>
            <div className="flex-1 overflow-y-auto p-8 space-y-5">
              <button type="button" onClick={closeModal} className="absolute top-4 right-4 z-10 flex h-7 w-7 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>

              {/* Block modal */}
              {modalType === 'block' && (
                <>
                  <h3 className="text-[18px] font-semibold text-[#111827]">{editingIndex >= 0 ? 'Modifier le bloc texte' : 'Nouveau bloc texte'}</h3>
                  <div><label className="block text-sm text-[#6B7280] mb-1.5">Titre</label><input type="text" value={editingBlock.title} onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })} placeholder="Titre du bloc" className={inputClass} /></div>
                  <div><label className="block text-sm text-[#6B7280] mb-1.5">Sous-titre</label><input type="text" value={editingBlock.subtitle} onChange={(e) => setEditingBlock({ ...editingBlock, subtitle: e.target.value })} placeholder="Optionnel" className={inputClass} /></div>
                  <div><label className="block text-sm text-[#6B7280] mb-1.5">Contenu</label><RichTextEditor value={editingBlock.content} onChange={(v) => setEditingBlock({ ...editingBlock, content: v })} /></div>
                </>
              )}

              {/* KPI modal */}
              {modalType === 'kpi' && (
                <>
                  <h3 className="text-[18px] font-semibold text-[#111827]">{editingIndex >= 0 ? 'Modifier le chiffre cle' : 'Nouveau chiffre cle'}</h3>
                  <div>
                    <label className="block text-sm text-[#6B7280] mb-1.5">Type de visualisation</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {KPI_TYPES.slice(0, 10).map((t) => (
                        <button key={t.type} type="button" onClick={() => setEditingKpi({ ...editingKpi, type: t.type })}
                          className={cn('flex flex-col items-center gap-1 rounded-lg py-2 px-1 text-center transition-colors duration-150', editingKpi.type === t.type ? 'bg-[#111827] text-white' : 'border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6]')}>
                          <span className="text-sm">{t.icon}</span>
                          <span className="text-[10px] leading-tight">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><label className="block text-sm text-[#6B7280] mb-1.5">Label</label><input type="text" value={editingKpi.label} onChange={(e) => setEditingKpi({ ...editingKpi, label: e.target.value })} placeholder="clients satisfaits" className={inputClass} /></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm text-[#6B7280] mb-1.5">Valeur</label><input type="number" value={editingKpi.value || ''} onChange={(e) => setEditingKpi({ ...editingKpi, value: parseFloat(e.target.value) || 0 })} placeholder="42" className={inputClass} /></div>
                    <div><label className="block text-sm text-[#6B7280] mb-1.5">Max</label><input type="number" value={editingKpi.maxValue || ''} onChange={(e) => setEditingKpi({ ...editingKpi, maxValue: parseFloat(e.target.value) || 100 })} placeholder="100" className={inputClass} /></div>
                    <div><label className="block text-sm text-[#6B7280] mb-1.5">Unite</label><input type="text" value={editingKpi.unit} onChange={(e) => setEditingKpi({ ...editingKpi, unit: e.target.value })} placeholder="%" className={inputClass} /></div>
                  </div>
                  <div>
                    <label className="block text-sm text-[#6B7280] mb-1.5">Apercu</label>
                    <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6 flex items-center justify-center min-h-[100px]">
                      <KpiRenderer kpi={editingKpi} primaryColor="#D4634E" />
                    </div>
                  </div>
                </>
              )}

              {/* Layout modal */}
              {modalType === 'layout' && (
                <>
                  <h3 className="text-[18px] font-semibold text-[#111827]">{editingIndex >= 0 ? 'Modifier les colonnes' : 'Nouvelles colonnes'}</h3>
                  <div>
                    <label className="block text-sm text-[#6B7280] mb-1.5">Nombre de colonnes</label>
                    <div className="flex gap-2">
                      {([2, 3] as const).map((n) => (
                        <button key={n} type="button" onClick={() => setLayoutColumnCount(n)} className={cn('h-10 px-5 rounded-lg text-sm font-medium transition-colors duration-150', editingLayout.columnCount === n ? 'bg-[#111827] text-white' : 'border border-[#E5E7EB] text-[#111827] hover:bg-[#F3F4F6]')}>
                          {n} colonnes
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={cn('grid gap-4', editingLayout.columnCount === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
                    {editingLayout.columns.map((col, colIdx) => (
                      <div key={colIdx} className="space-y-2 rounded-lg border border-[#E5E7EB] p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-medium text-[#6B7280]">Colonne {colIdx + 1}</p>
                          <select value={col.type} onChange={(e) => setColumnType(colIdx, e.target.value as ColumnContentType)} className="text-[12px] text-[#6B7280] border border-[#E5E7EB] rounded-md px-2 py-1 bg-white focus:outline-none">
                            {COLUMN_CONTENT_TYPES.map((ct) => (<option key={ct.value} value={ct.value}>{ct.label}</option>))}
                          </select>
                        </div>
                        {col.type === 'text' && (
                          <div className="space-y-2">
                            <input type="text" value={col.title ?? ''} onChange={(e) => updateLayoutColumn(colIdx, { title: e.target.value })} placeholder="Titre" className={inputClass} />
                            <input type="text" value={(col as LayoutColumn & { subtitle?: string }).subtitle ?? ''} onChange={(e) => updateLayoutColumn(colIdx, { subtitle: e.target.value } as Partial<LayoutColumn>)} placeholder="Sous-titre (optionnel)" className={inputClass} />
                            <RichTextEditor value={col.content ?? ''} onChange={(v) => updateLayoutColumn(colIdx, { content: v })} />
                          </div>
                        )}
                        {col.type === 'image' && (
                          <div className="space-y-2">
                            <div
                              className="flex flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-[#E5E7EB] bg-[#F9FAFB] py-6 cursor-pointer hover:border-[#D1D5DB] transition-[border-color] duration-150"
                              onClick={() => {
                                const input = document.createElement('input')
                                input.type = 'file'
                                input.accept = 'image/jpeg,image/png,image/webp'
                                input.onchange = async (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0]
                                  if (!file) return
                                  const body = new FormData(); body.append('file', file)
                                  try {
                                    const res = await fetch('/api/upload', { method: 'POST', body })
                                    const result = (await res.json()) as { url?: string }
                                    if (result.url) updateLayoutColumn(colIdx, { imageUrl: result.url })
                                  } catch { /* skip */ }
                                }
                                input.click()
                              }}
                              onKeyDown={() => {}}
                              role="button"
                              tabIndex={0}
                            >
                              {col.imageUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={col.imageUrl} alt={col.imageAlt ?? ''} className="w-full h-24 object-cover rounded-lg" />
                              ) : (
                                <>
                                  <Upload className="h-5 w-5 text-[#9CA3AF]" />
                                  <p className="text-[12px] text-[#9CA3AF]">Cliquer pour importer</p>
                                </>
                              )}
                            </div>
                            <input type="text" value={col.imageAlt ?? ''} onChange={(e) => updateLayoutColumn(colIdx, { imageAlt: e.target.value })} placeholder="Texte alternatif" className={inputClass} />
                          </div>
                        )}
                        {col.type === 'kpi' && col.kpi && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-5 gap-1">
                              {KPI_TYPES.slice(0, 10).map((t) => (
                                <button key={t.type} type="button" onClick={() => updateLayoutColumn(colIdx, { kpi: { ...col.kpi!, type: t.type } })}
                                  className={cn('flex flex-col items-center gap-0.5 rounded-md py-1 text-center transition-colors duration-150', col.kpi!.type === t.type ? 'bg-[#111827] text-white' : 'border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6]')}>
                                  <span className="text-[10px]">{t.icon}</span>
                                  <span className="text-[8px] leading-tight">{t.label}</span>
                                </button>
                              ))}
                            </div>
                            <input type="text" value={col.kpi.label} onChange={(e) => updateLayoutColumn(colIdx, { kpi: { ...col.kpi!, label: e.target.value } })} placeholder="Label" className={inputClass} />
                            <div className="grid grid-cols-3 gap-2">
                              <input type="number" value={col.kpi.value || ''} onChange={(e) => updateLayoutColumn(colIdx, { kpi: { ...col.kpi!, value: parseFloat(e.target.value) || 0 } })} placeholder="Valeur" className={inputClass} />
                              <input type="number" value={col.kpi.maxValue || ''} onChange={(e) => updateLayoutColumn(colIdx, { kpi: { ...col.kpi!, maxValue: parseFloat(e.target.value) || 100 } })} placeholder="Max" className={inputClass} />
                              <input type="text" value={col.kpi.unit} onChange={(e) => updateLayoutColumn(colIdx, { kpi: { ...col.kpi!, unit: e.target.value } })} placeholder="Unite" className={inputClass} />
                            </div>
                            <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3 flex items-center justify-center min-h-[60px]">
                              <KpiRenderer kpi={col.kpi} primaryColor="#D4634E" />
                            </div>
                          </div>
                        )}
                        {col.type === 'empty' && (
                          <p className="text-[13px] text-[#9CA3AF] py-4 text-center">Vide — espace libre</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sticky footer */}
            {modalType === 'block' && <ModalFooter onSave={saveBlock} disabled={!editingBlock.title.trim()} label={editingIndex >= 0 ? 'Enregistrer' : 'Ajouter'} />}
            {modalType === 'kpi' && <ModalFooter onSave={saveKpi} disabled={!editingKpi.label.trim()} label={editingIndex >= 0 ? 'Enregistrer' : 'Ajouter'} />}
            {modalType === 'layout' && <ModalFooter onSave={saveLayout} disabled={false} label={editingIndex >= 0 ? 'Enregistrer' : 'Ajouter'} />}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
