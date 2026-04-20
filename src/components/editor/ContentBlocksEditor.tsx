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
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { VzBtn } from '@/components/ui/vizly'
import { DEFAULT_PORTFOLIO_COLOR } from '@/lib/constants'
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
  'w-full h-10 rounded-[var(--radius-md)] border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:border-foreground'

const BLOCK_KINDS = [
  { kind: 'block' as const, icon: Type },
  { kind: 'kpi' as const, icon: BarChart3 },
  { kind: 'layout' as const, icon: Columns },
]

const COLUMN_CONTENT_KEYS: ColumnContentType[] = ['text', 'image', 'kpi', 'empty']

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
  const t = useTranslations('editor.contentBlocks')
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
      <div className="shrink-0 px-8 py-4 bg-surface border-t border-border-light flex items-center justify-end gap-3">
        <VzBtn variant="ghost" size="sm" onClick={closeModal}>{t('cancel')}</VzBtn>
        <VzBtn variant="primary" onClick={onSave} disabled={disabled}>{label}</VzBtn>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="flex-1 mt-8 lg:mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">{t('title')}</h3>
        <div className="relative" ref={dropdownRef}>
          <button type="button" onClick={() => setShowDropdown(!showDropdown)} className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-muted transition-colors">
            <Plus className="h-4 w-4" strokeWidth={1.5} /> {t('addLabel')} <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-150', showDropdown && 'rotate-180')} strokeWidth={1.5} />
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-[260px] rounded-[var(--radius-md)] border border-border-light bg-surface p-1.5 z-10 shadow-[var(--shadow-card-hover)]">
              {BLOCK_KINDS.map((bt) => (
                <button key={bt.kind} type="button" onClick={() => { if (bt.kind === 'block') openAddBlock(); else if (bt.kind === 'kpi') openAddKpi(); else openAddLayout() }} className="flex items-start gap-3 w-full rounded-[var(--radius-sm)] px-3 py-2.5 text-left hover:bg-surface-warm transition-colors duration-150">
                  <bt.icon className="h-4 w-4 text-muted mt-0.5 shrink-0" strokeWidth={1.5} />
                  <div><p className="text-sm font-medium text-foreground">{t(`types.${bt.kind}.label`)}</p><p className="text-xs text-muted-foreground">{t(`types.${bt.kind}.desc`)}</p></div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {contentItems.length === 0 ? (
        <p className="py-8 text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="space-y-2">
          {contentItems.map((item) => {
            const key = `${item.kind}-${item.index}`
            let icon: React.ReactNode, title: string, preview: string
            if (item.kind === 'block') { icon = <Type className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} />; title = item.data.title || t('untitled'); preview = stripHtml(item.data.content).slice(0, 60) }
            else if (item.kind === 'kpi') { icon = <BarChart3 className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} />; title = `${item.data.value}${item.data.unit}`; preview = item.data.label }
            else { icon = <Columns className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} />; title = t('columnsSummary', { count: item.data.columnCount }); preview = item.data.columns.map((c) => c.title || c.type).join(' / ') }
            return (
              <div key={key} className="group flex items-center gap-2.5 rounded-[var(--radius-md)] border border-border-light bg-surface p-3 transition-colors duration-150 hover:border-border">
                <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-surface-warm">{icon}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{title}</p>{preview && <p className="text-xs text-muted truncate">{preview}</p>}</div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => editContentItem(item)} className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-foreground hover:bg-surface-warm transition-colors" aria-label={t('editAriaLabel')}><Pencil className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
                  <button type="button" onClick={() => deleteContentItem(item)} className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-destructive hover:bg-destructive/5 transition-colors" aria-label={t('deleteAriaLabel')}><Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {modalType && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/30" onClick={closeModal} onKeyDown={() => {}} role="presentation" />
          <div className={cn('relative w-full max-h-[85vh] flex flex-col bg-surface rounded-[var(--radius-lg)] border border-border-light overflow-hidden mx-4', modalType === 'layout' ? 'max-w-[1060px]' : 'max-w-[560px]')}>
            <div className="flex-1 overflow-y-auto p-8 space-y-5">
              <button type="button" onClick={closeModal} className="absolute top-4 right-4 z-10 flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-foreground hover:bg-surface-warm transition-colors" aria-label={t('closeAriaLabel')}>
                <X className="h-4 w-4" />
              </button>

              {/* Block modal */}
              {modalType === 'block' && (
                <>
                  <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">{editingIndex >= 0 ? t('block.modalEditTitle') : t('block.modalNewTitle')}</h3>
                  <div><label className="mb-1.5 block text-sm font-medium text-foreground">{t('block.titleLabel')}</label><input type="text" value={editingBlock.title} onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })} placeholder={t('block.titlePlaceholder')} className={inputClass} /></div>
                  <div><label className="mb-1.5 block text-sm font-medium text-foreground">{t('block.subtitleLabel')}</label><input type="text" value={editingBlock.subtitle} onChange={(e) => setEditingBlock({ ...editingBlock, subtitle: e.target.value })} placeholder={t('block.subtitlePlaceholder')} className={inputClass} /></div>
                  <div><label className="mb-1.5 block text-sm font-medium text-foreground">{t('block.contentLabel')}</label><RichTextEditor value={editingBlock.content} onChange={(v) => setEditingBlock({ ...editingBlock, content: v })} /></div>
                </>
              )}

              {/* KPI modal */}
              {modalType === 'kpi' && (
                <>
                  <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">{editingIndex >= 0 ? t('kpi.modalEditTitle') : t('kpi.modalNewTitle')}</h3>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t('kpi.typeLabel')}</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {KPI_TYPES.slice(0, 10).map((t) => (
                        <button key={t.type} type="button" onClick={() => setEditingKpi({ ...editingKpi, type: t.type })}
                          className={cn('flex flex-col items-center gap-1 rounded-[var(--radius-sm)] py-2 px-1 text-center transition-colors duration-150', editingKpi.type === t.type ? 'bg-foreground text-white' : 'border border-border-light text-muted hover:bg-surface-warm')}>
                          <span className="text-sm">{t.icon}</span>
                          <span className="text-[10px] leading-tight">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><label className="mb-1.5 block text-sm font-medium text-foreground">{t('kpi.labelLabel')}</label><input type="text" value={editingKpi.label} onChange={(e) => setEditingKpi({ ...editingKpi, label: e.target.value })} placeholder={t('kpi.labelPlaceholder')} className={inputClass} /></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="mb-1.5 block text-sm font-medium text-foreground">{t('kpi.valueLabel')}</label><input type="number" value={editingKpi.value || ''} onChange={(e) => setEditingKpi({ ...editingKpi, value: parseFloat(e.target.value) || 0 })} placeholder={t('kpi.valuePlaceholder')} className={inputClass} /></div>
                    <div><label className="mb-1.5 block text-sm font-medium text-foreground">{t('kpi.maxLabel')}</label><input type="number" value={editingKpi.maxValue || ''} onChange={(e) => setEditingKpi({ ...editingKpi, maxValue: parseFloat(e.target.value) || 100 })} placeholder={t('kpi.maxPlaceholder')} className={inputClass} /></div>
                    <div><label className="mb-1.5 block text-sm font-medium text-foreground">{t('kpi.unitLabel')}</label><input type="text" value={editingKpi.unit} onChange={(e) => setEditingKpi({ ...editingKpi, unit: e.target.value })} placeholder={t('kpi.unitPlaceholder')} className={inputClass} /></div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t('kpi.previewLabel')}</label>
                    <div className="rounded-[var(--radius-lg)] border border-border-light bg-surface-warm p-6 flex items-center justify-center min-h-[100px]">
                      <KpiRenderer kpi={editingKpi} primaryColor={DEFAULT_PORTFOLIO_COLOR} />
                    </div>
                  </div>
                </>
              )}

              {/* Layout modal */}
              {modalType === 'layout' && (
                <>
                  <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">{editingIndex >= 0 ? t('layout.modalEditTitle') : t('layout.modalNewTitle')}</h3>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t('layout.columnCountLabel')}</label>
                    <div className="flex gap-2">
                      {([2, 3] as const).map((n) => (
                        <button key={n} type="button" onClick={() => setLayoutColumnCount(n)} className={cn('h-10 px-5 rounded-[var(--radius-md)] text-sm font-medium transition-colors duration-150', editingLayout.columnCount === n ? 'bg-foreground text-white' : 'border border-border-light text-foreground hover:bg-surface-warm')}>
                          {t('layout.columnCountOption', { count: n })}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={cn('grid gap-4', editingLayout.columnCount === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
                    {editingLayout.columns.map((col, colIdx) => (
                      <div key={colIdx} className="space-y-2 rounded-[var(--radius-md)] border border-border-light p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('layout.columnLabel', { number: colIdx + 1 })}</p>
                          <select value={col.type} onChange={(e) => setColumnType(colIdx, e.target.value as ColumnContentType)} className="text-xs text-muted border border-border-light rounded-[var(--radius-sm)] px-2 py-1 bg-surface focus:outline-none">
                            {COLUMN_CONTENT_KEYS.map((ct) => (<option key={ct} value={ct}>{t(`columnTypes.${ct}`)}</option>))}
                          </select>
                        </div>
                        {col.type === 'text' && (
                          <div className="space-y-2">
                            <input type="text" value={col.title ?? ''} onChange={(e) => updateLayoutColumn(colIdx, { title: e.target.value })} placeholder={t('layout.titlePlaceholder')} className={inputClass} />
                            <input type="text" value={(col as LayoutColumn & { subtitle?: string }).subtitle ?? ''} onChange={(e) => updateLayoutColumn(colIdx, { subtitle: e.target.value } as Partial<LayoutColumn>)} placeholder={t('layout.subtitlePlaceholder')} className={inputClass} />
                            <RichTextEditor value={col.content ?? ''} onChange={(v) => updateLayoutColumn(colIdx, { content: v })} />
                          </div>
                        )}
                        {col.type === 'image' && (
                          <div className="space-y-2">
                            <div
                              className="flex flex-col items-center justify-center gap-1 rounded-[var(--radius-lg)] border-[1.5px] border-dashed border-border bg-surface-warm py-6 cursor-pointer hover:border-muted-foreground transition-colors duration-150"
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
                                <img src={col.imageUrl} alt={col.imageAlt ?? ''} className="w-full h-24 object-cover rounded-[var(--radius-md)]" />
                              ) : (
                                <>
                                  <Upload className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                                  <p className="text-xs text-muted-foreground">{t('layout.imageUpload')}</p>
                                </>
                              )}
                            </div>
                            <input type="text" value={col.imageAlt ?? ''} onChange={(e) => updateLayoutColumn(colIdx, { imageAlt: e.target.value })} placeholder={t('layout.imageAltPlaceholder')} className={inputClass} />
                          </div>
                        )}
                        {col.type === 'kpi' && col.kpi && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-5 gap-1">
                              {KPI_TYPES.slice(0, 10).map((t) => {
                                const colKpi = col.kpi
                                if (!colKpi) return null
                                return (
                                <button key={t.type} type="button" onClick={() => updateLayoutColumn(colIdx, { kpi: { ...colKpi, type: t.type } })}
                                  className={cn('flex flex-col items-center gap-0.5 rounded-[var(--radius-sm)] py-1 text-center transition-colors duration-150', colKpi.type === t.type ? 'bg-foreground text-white' : 'border border-border-light text-muted hover:bg-surface-warm')}>
                                  <span className="text-[10px]">{t.icon}</span>
                                  <span className="text-[8px] leading-tight">{t.label}</span>
                                </button>
                              )})}
                            </div>
                            <input type="text" value={col.kpi.label} onChange={(e) => { const k = col.kpi; if (k) updateLayoutColumn(colIdx, { kpi: { ...k, label: e.target.value } }) }} placeholder={t('layout.labelPlaceholder')} className={inputClass} />
                            <div className="grid grid-cols-3 gap-2">
                              <input type="number" value={col.kpi.value || ''} onChange={(e) => { const k = col.kpi; if (k) updateLayoutColumn(colIdx, { kpi: { ...k, value: parseFloat(e.target.value) || 0 } }) }} placeholder={t('layout.valuePlaceholder')} className={inputClass} />
                              <input type="number" value={col.kpi.maxValue || ''} onChange={(e) => { const k = col.kpi; if (k) updateLayoutColumn(colIdx, { kpi: { ...k, maxValue: parseFloat(e.target.value) || 100 } }) }} placeholder={t('layout.maxPlaceholder')} className={inputClass} />
                              <input type="text" value={col.kpi.unit} onChange={(e) => { const k = col.kpi; if (k) updateLayoutColumn(colIdx, { kpi: { ...k, unit: e.target.value } }) }} placeholder={t('layout.unitPlaceholder')} className={inputClass} />
                            </div>
                            <div className="rounded-[var(--radius-md)] border border-border-light bg-surface-warm p-3 flex items-center justify-center min-h-[60px]">
                              <KpiRenderer kpi={col.kpi} primaryColor={DEFAULT_PORTFOLIO_COLOR} />
                            </div>
                          </div>
                        )}
                        {col.type === 'empty' && (
                          <p className="py-4 text-center text-xs text-muted-foreground">{t('layout.emptyColumn')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sticky footer */}
            {modalType === 'block' && <ModalFooter onSave={saveBlock} disabled={!editingBlock.title.trim()} label={editingIndex >= 0 ? t('save') : t('add')} />}
            {modalType === 'kpi' && <ModalFooter onSave={saveKpi} disabled={!editingKpi.label.trim()} label={editingIndex >= 0 ? t('save') : t('add')} />}
            {modalType === 'layout' && <ModalFooter onSave={saveLayout} disabled={false} label={editingIndex >= 0 ? t('save') : t('add')} />}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
