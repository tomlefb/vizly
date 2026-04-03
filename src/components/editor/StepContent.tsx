'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
  X,
  Type,
  BarChart3,
  Columns,
  GripVertical,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProjectForm } from './ProjectForm'
import { ImageUploader } from './ImageUploader'
import { RichTextEditor } from './RichTextEditor'
import type { ProjectFormData } from '@/lib/validations'
import type { CustomBlock } from '@/types/custom-blocks'
import type { KpiItem } from '@/types/kpis'
import type { LayoutBlock, LayoutColumn } from '@/types/layout-blocks'
import { generateBlockId } from '@/types/custom-blocks'
import { generateKpiId } from '@/types/kpis'
import { generateLayoutId } from '@/types/layout-blocks'

// ── Types ──

interface StepContentProps {
  projects: ProjectFormData[]
  onProjectsChange: (projects: ProjectFormData[]) => void
  customBlocks: CustomBlock[]
  onCustomBlocksChange: (blocks: CustomBlock[]) => void
  kpis: KpiItem[]
  onKpisChange: (kpis: KpiItem[]) => void
  layoutBlocks: LayoutBlock[]
  onLayoutBlocksChange: (blocks: LayoutBlock[]) => void
  className?: string
}

type ModalType = 'project' | 'block' | 'kpi' | 'layout' | null

type ContentItem =
  | { kind: 'block'; index: number; data: CustomBlock }
  | { kind: 'kpi'; index: number; data: KpiItem }
  | { kind: 'layout'; index: number; data: LayoutBlock }

const EMPTY_PROJECT: ProjectFormData = {
  title: '',
  description: '',
  images: [],
  external_link: '',
  tags: [],
  display_order: 0,
}

const inputClass =
  'w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]'

function stripHtml(html: string): string {
  if (typeof document !== 'undefined') {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent ?? ''
  }
  return html.replace(/<[^>]*>/g, '')
}

// ── Dropdown items ──

const BLOCK_TYPES = [
  { kind: 'block' as const, icon: Type, label: 'Texte', desc: 'Un titre et un paragraphe' },
  { kind: 'kpi' as const, icon: BarChart3, label: 'Chiffres cles', desc: 'Tes KPI et stats' },
  { kind: 'layout' as const, icon: Columns, label: 'Colonnes', desc: 'Contenu cote a cote en 2 ou 3 colonnes' },
]

// ── Component ──

export function StepContent({
  projects,
  onProjectsChange,
  customBlocks,
  onCustomBlocksChange,
  kpis,
  onKpisChange,
  layoutBlocks,
  onLayoutBlocksChange,
  className,
}: StepContentProps) {
  // ── Modal state ──
  const [modalType, setModalType] = useState<ModalType>(null)
  const [editingIndex, setEditingIndex] = useState(-1)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Editing state per type
  const [editingProject, setEditingProject] = useState<ProjectFormData>({ ...EMPTY_PROJECT })
  const [editingBlock, setEditingBlock] = useState<CustomBlock>({ id: '', title: '', subtitle: '', content: '', order: 0 })
  const [editingKpi, setEditingKpi] = useState<KpiItem>({ id: '', type: 'number', label: '', value: 0, maxValue: 100, unit: '' })
  const [editingLayout, setEditingLayout] = useState<LayoutBlock>({ id: '', columnCount: 2, columns: [] })

  // Image upload (projects)
  const [localFiles, setLocalFiles] = useState<File[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const editingProjectRef = useRef(editingProject)
  editingProjectRef.current = editingProject

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showDropdown])

  const closeModal = useCallback(() => {
    setModalType(null)
    setEditingIndex(-1)
    setLocalFiles([])
    setIsUploadingImages(false)
  }, [])

  // ── Unified content items ──

  const contentItems: ContentItem[] = [
    ...customBlocks.map((b, i) => ({ kind: 'block' as const, index: i, data: b })),
    ...kpis.map((k, i) => ({ kind: 'kpi' as const, index: i, data: k })),
    ...layoutBlocks.map((l, i) => ({ kind: 'layout' as const, index: i, data: l })),
  ]

  // ── Project handlers ──

  const openAddProject = useCallback(() => {
    setEditingProject({ ...EMPTY_PROJECT, display_order: projects.length })
    setLocalFiles([])
    setEditingIndex(-1)
    setModalType('project')
  }, [projects.length])

  const openEditProject = useCallback(
    (index: number) => {
      const p = projects[index]
      if (!p) return
      setEditingProject({ ...p })
      setLocalFiles([])
      setEditingIndex(index)
      setModalType('project')
    },
    [projects]
  )

  const handleImagesChange = useCallback(
    (files: File[]) => {
      const newFiles = files.slice(localFiles.length)
      setLocalFiles(files)
      if (newFiles.length === 0) return
      setIsUploadingImages(true)
      void (async () => {
        const uploadedUrls: string[] = []
        const uploadedFiles: File[] = []
        for (const file of newFiles) {
          try {
            const body = new FormData()
            body.append('file', file)
            const res = await fetch('/api/upload', { method: 'POST', body })
            const result = (await res.json()) as { url?: string }
            if (result.url) { uploadedUrls.push(result.url); uploadedFiles.push(file) }
          } catch { /* skip */ }
        }
        if (uploadedFiles.length > 0) setLocalFiles((prev) => prev.filter((f) => !uploadedFiles.includes(f)))
        if (uploadedUrls.length > 0) {
          const latest = editingProjectRef.current
          setEditingProject({ ...latest, images: [...latest.images, ...uploadedUrls] })
        }
        setIsUploadingImages(false)
      })()
    },
    [localFiles.length]
  )

  const handleImageRemove = useCallback(
    (index: number) => {
      const existingCount = editingProject.images.length
      if (index < existingCount) {
        const imgs = [...editingProject.images]
        imgs.splice(index, 1)
        setEditingProject((prev) => ({ ...prev, images: imgs }))
      } else {
        setLocalFiles((prev) => { const c = [...prev]; c.splice(index - existingCount, 1); return c })
      }
    },
    [editingProject.images]
  )

  const saveProject = useCallback(() => {
    if (!editingProject.title.trim()) return
    if (editingIndex >= 0) {
      const updated = [...projects]; updated[editingIndex] = editingProject; onProjectsChange(updated)
    } else {
      onProjectsChange([...projects, editingProject])
    }
    closeModal()
  }, [editingIndex, editingProject, projects, onProjectsChange, closeModal])

  const deleteProject = useCallback(
    (index: number) => {
      onProjectsChange(projects.filter((_, i) => i !== index).map((p, i) => ({ ...p, display_order: i })))
    },
    [projects, onProjectsChange]
  )

  // ── Block handlers ──

  const openAddBlock = useCallback(() => {
    setEditingBlock({ id: generateBlockId(), title: '', subtitle: '', content: '', order: customBlocks.length })
    setEditingIndex(-1)
    setModalType('block')
    setShowDropdown(false)
  }, [customBlocks.length])

  const openEditBlock = useCallback((index: number) => {
    const b = customBlocks[index]; if (!b) return
    setEditingBlock({ ...b }); setEditingIndex(index); setModalType('block')
  }, [customBlocks])

  const saveBlock = useCallback(() => {
    if (!editingBlock.title.trim()) return
    if (editingIndex >= 0) {
      const u = [...customBlocks]; u[editingIndex] = editingBlock; onCustomBlocksChange(u)
    } else { onCustomBlocksChange([...customBlocks, editingBlock]) }
    closeModal()
  }, [editingIndex, editingBlock, customBlocks, onCustomBlocksChange, closeModal])

  const deleteBlock = useCallback((i: number) => { onCustomBlocksChange(customBlocks.filter((_, j) => j !== i)) }, [customBlocks, onCustomBlocksChange])

  // ── KPI handlers ──

  const openAddKpi = useCallback(() => {
    setEditingKpi({ id: generateKpiId(), type: 'number', label: '', value: 0, maxValue: 100, unit: '' })
    setEditingIndex(-1)
    setModalType('kpi')
    setShowDropdown(false)
  }, [])

  const openEditKpi = useCallback((index: number) => {
    const k = kpis[index]; if (!k) return
    setEditingKpi({ ...k }); setEditingIndex(index); setModalType('kpi')
  }, [kpis])

  const saveKpi = useCallback(() => {
    if (!editingKpi.label.trim()) return
    if (editingIndex >= 0) {
      const u = [...kpis]; u[editingIndex] = editingKpi; onKpisChange(u)
    } else { onKpisChange([...kpis, editingKpi]) }
    closeModal()
  }, [editingIndex, editingKpi, kpis, onKpisChange, closeModal])

  const deleteKpi = useCallback((i: number) => { onKpisChange(kpis.filter((_, j) => j !== i)) }, [kpis, onKpisChange])

  // ── Layout handlers ──

  const openAddLayout = useCallback(() => {
    setEditingLayout({
      id: generateLayoutId(),
      columnCount: 2,
      columns: [
        { type: 'text', title: '', content: '' },
        { type: 'text', title: '', content: '' },
      ],
    })
    setEditingIndex(-1)
    setModalType('layout')
    setShowDropdown(false)
  }, [])

  const openEditLayout = useCallback((index: number) => {
    const l = layoutBlocks[index]; if (!l) return
    setEditingLayout({ ...l, columns: l.columns.map((c) => ({ ...c })) })
    setEditingIndex(index); setModalType('layout')
  }, [layoutBlocks])

  const saveLayout = useCallback(() => {
    if (editingIndex >= 0) {
      const u = [...layoutBlocks]; u[editingIndex] = editingLayout; onLayoutBlocksChange(u)
    } else { onLayoutBlocksChange([...layoutBlocks, editingLayout]) }
    closeModal()
  }, [editingIndex, editingLayout, layoutBlocks, onLayoutBlocksChange, closeModal])

  const deleteLayout = useCallback((i: number) => { onLayoutBlocksChange(layoutBlocks.filter((_, j) => j !== i)) }, [layoutBlocks, onLayoutBlocksChange])

  const setLayoutColumnCount = useCallback((count: 2 | 3) => {
    const columns: LayoutColumn[] = Array.from({ length: count }, (_, i) =>
      editingLayout.columns[i] ?? { type: 'text' as const, title: '', content: '' }
    )
    setEditingLayout({ ...editingLayout, columnCount: count, columns })
  }, [editingLayout])

  const updateLayoutColumn = useCallback((colIndex: number, field: 'title' | 'content', value: string) => {
    const cols = editingLayout.columns.map((c, i) => i === colIndex ? { ...c, [field]: value } : c)
    setEditingLayout({ ...editingLayout, columns: cols })
  }, [editingLayout])

  // ── Delete content item (unified) ──

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

  // ── Render ──

  return (
    <div className={cn(className)} data-testid="step-content">
      <div className="flex flex-col lg:flex-row lg:gap-12">

        {/* ── Left: Projets ── */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold leading-7 text-[#111827]">Projets</h2>
            <button type="button" onClick={openAddProject} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#E8553D] hover:text-[#D4442E] transition-colors">
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] py-8">Aucun projet</p>
          ) : (
            <div className="space-y-2">
              {projects.map((project, index) => (
                <div key={`p-${index}-${project.title}`} className="group flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3 transition-[border-color] duration-150 hover:border-[#D1D5DB]">
                  <div className="shrink-0 h-10 w-10 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] overflow-hidden flex items-center justify-center">
                    {project.images.length > 0 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={project.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5 text-[#D1D5DB]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">{project.title || 'Sans titre'}</p>
                    {project.description && <p className="text-[13px] text-[#6B7280] truncate">{project.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => openEditProject(index)} className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors" aria-label="Modifier">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button type="button" onClick={() => deleteProject(index)} className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#DC2626] hover:bg-[#F3F4F6] transition-colors" aria-label="Supprimer">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Blocs de contenu ── */}
        <div className="flex-1 lg:max-w-[360px] mt-8 lg:mt-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold leading-7 text-[#111827]">Blocs de contenu</h2>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#E8553D] hover:text-[#D4442E] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Ajouter
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-150', showDropdown && 'rotate-180')} />
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-[260px] rounded-xl border border-[#E5E7EB] bg-white p-1.5 z-10 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                  {BLOCK_TYPES.map((bt) => (
                    <button
                      key={bt.kind}
                      type="button"
                      onClick={() => {
                        if (bt.kind === 'block') openAddBlock()
                        else if (bt.kind === 'kpi') openAddKpi()
                        else openAddLayout()
                      }}
                      className="flex items-start gap-3 w-full rounded-lg px-3 py-2.5 text-left hover:bg-[#F3F4F6] transition-colors duration-150"
                    >
                      <bt.icon className="h-4 w-4 text-[#6B7280] mt-0.5 shrink-0" strokeWidth={1.5} />
                      <div>
                        <p className="text-sm font-medium text-[#111827]">{bt.label}</p>
                        <p className="text-[13px] text-[#9CA3AF]">{bt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Unified block list */}
          {contentItems.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] py-8">Aucun bloc de contenu</p>
          ) : (
            <div className="space-y-2">
              {contentItems.map((item) => {
                const key = `${item.kind}-${item.index}`
                let icon: React.ReactNode
                let title: string
                let preview: string

                if (item.kind === 'block') {
                  icon = <Type className="h-3.5 w-3.5 text-[#6B7280]" strokeWidth={1.5} />
                  title = item.data.title || 'Sans titre'
                  preview = stripHtml(item.data.content).slice(0, 60)
                } else if (item.kind === 'kpi') {
                  icon = <BarChart3 className="h-3.5 w-3.5 text-[#6B7280]" strokeWidth={1.5} />
                  title = `${item.data.value}${item.data.unit}`
                  preview = item.data.label
                } else {
                  icon = <Columns className="h-3.5 w-3.5 text-[#6B7280]" strokeWidth={1.5} />
                  title = `${item.data.columnCount} colonnes`
                  preview = item.data.columns.map((c) => c.title || c.type).join(' / ')
                }

                return (
                  <div key={key} className="group flex items-center gap-2.5 rounded-xl border border-[#E5E7EB] bg-white p-3 transition-[border-color] duration-150 hover:border-[#D1D5DB]">
                    <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-[#F9FAFB]">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111827] truncate">{title}</p>
                      {preview && <p className="text-[13px] text-[#9CA3AF] truncate">{preview}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => editContentItem(item)} className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors" aria-label="Modifier">
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button type="button" onClick={() => deleteContentItem(item)} className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#DC2626] hover:bg-[#F3F4F6] transition-colors" aria-label="Supprimer">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MODALS ── */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {modalType && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} onKeyDown={() => {}} role="presentation" />
          <div className="relative w-full max-w-[560px] max-h-[85vh] overflow-y-auto bg-white rounded-xl p-8 space-y-5">
            {/* Close */}
            <button type="button" onClick={closeModal} className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors" aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>

            {/* ── Project modal ── */}
            {modalType === 'project' && (
              <>
                <h3 className="text-[18px] font-semibold text-[#111827]">
                  {editingIndex >= 0 ? 'Modifier le projet' : 'Nouveau projet'}
                </h3>
                <ProjectForm project={editingProject} onChange={setEditingProject} />
                <div>
                  <p className="text-sm text-[#6B7280] mb-1.5">Images</p>
                  <ImageUploader
                    images={localFiles}
                    existingUrls={editingProject.images}
                    isUploading={isUploadingImages}
                    onImagesChange={handleImagesChange}
                    onImageRemove={handleImageRemove}
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={saveProject} disabled={!editingProject.title.trim()} className={cn('h-10 rounded-lg px-5 text-sm font-medium transition-colors duration-150', editingProject.title.trim() ? 'bg-[#E8553D] text-white hover:bg-[#D4442E]' : 'bg-[#E8553D]/50 text-white/60 cursor-not-allowed')}>
                    {editingIndex >= 0 ? 'Enregistrer' : 'Ajouter'}
                  </button>
                  <button type="button" onClick={closeModal} className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors">Annuler</button>
                </div>
              </>
            )}

            {/* ── Block modal (text) ── */}
            {modalType === 'block' && (
              <>
                <h3 className="text-[18px] font-semibold text-[#111827]">
                  {editingIndex >= 0 ? 'Modifier le bloc texte' : 'Nouveau bloc texte'}
                </h3>
                <div>
                  <label className="block text-sm text-[#6B7280] mb-1.5">Titre</label>
                  <input type="text" value={editingBlock.title} onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })} placeholder="Titre du bloc" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-[#6B7280] mb-1.5">Sous-titre</label>
                  <input type="text" value={editingBlock.subtitle} onChange={(e) => setEditingBlock({ ...editingBlock, subtitle: e.target.value })} placeholder="Optionnel" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-[#6B7280] mb-1.5">Contenu</label>
                  <RichTextEditor value={editingBlock.content} onChange={(v) => setEditingBlock({ ...editingBlock, content: v })} />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={saveBlock} disabled={!editingBlock.title.trim()} className={cn('h-10 rounded-lg px-5 text-sm font-medium transition-colors duration-150', editingBlock.title.trim() ? 'bg-[#E8553D] text-white hover:bg-[#D4442E]' : 'bg-[#E8553D]/50 text-white/60 cursor-not-allowed')}>
                    {editingIndex >= 0 ? 'Enregistrer' : 'Ajouter'}
                  </button>
                  <button type="button" onClick={closeModal} className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors">Annuler</button>
                </div>
              </>
            )}

            {/* ── KPI modal ── */}
            {modalType === 'kpi' && (
              <>
                <h3 className="text-[18px] font-semibold text-[#111827]">
                  {editingIndex >= 0 ? 'Modifier le chiffre cle' : 'Nouveau chiffre cle'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#6B7280] mb-1.5">Valeur</label>
                    <input type="number" value={editingKpi.value || ''} onChange={(e) => setEditingKpi({ ...editingKpi, value: parseFloat(e.target.value) || 0 })} placeholder="42" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm text-[#6B7280] mb-1.5">Unite</label>
                    <input type="text" value={editingKpi.unit} onChange={(e) => setEditingKpi({ ...editingKpi, unit: e.target.value })} placeholder="%, +, €..." className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#6B7280] mb-1.5">Label</label>
                  <input type="text" value={editingKpi.label} onChange={(e) => setEditingKpi({ ...editingKpi, label: e.target.value })} placeholder="clients satisfaits" className={inputClass} />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={saveKpi} disabled={!editingKpi.label.trim()} className={cn('h-10 rounded-lg px-5 text-sm font-medium transition-colors duration-150', editingKpi.label.trim() ? 'bg-[#E8553D] text-white hover:bg-[#D4442E]' : 'bg-[#E8553D]/50 text-white/60 cursor-not-allowed')}>
                    {editingIndex >= 0 ? 'Enregistrer' : 'Ajouter'}
                  </button>
                  <button type="button" onClick={closeModal} className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors">Annuler</button>
                </div>
              </>
            )}

            {/* ── Layout modal (columns) ── */}
            {modalType === 'layout' && (
              <>
                <h3 className="text-[18px] font-semibold text-[#111827]">
                  {editingIndex >= 0 ? 'Modifier les colonnes' : 'Nouvelles colonnes'}
                </h3>

                {/* Column count picker */}
                <div>
                  <label className="block text-sm text-[#6B7280] mb-1.5">Nombre de colonnes</label>
                  <div className="flex gap-2">
                    {([2, 3] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setLayoutColumnCount(n)}
                        className={cn(
                          'h-10 px-5 rounded-lg text-sm font-medium transition-colors duration-150',
                          editingLayout.columnCount === n
                            ? 'bg-[#111827] text-white'
                            : 'border border-[#E5E7EB] text-[#111827] hover:bg-[#F3F4F6]',
                        )}
                      >
                        {n} colonnes
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column editors */}
                <div className={cn('grid gap-4', editingLayout.columnCount === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
                  {editingLayout.columns.map((col, colIdx) => (
                    <div key={colIdx} className="space-y-2">
                      <p className="text-[13px] font-medium text-[#6B7280]">Colonne {colIdx + 1}</p>
                      <input
                        type="text"
                        value={col.title ?? ''}
                        onChange={(e) => updateLayoutColumn(colIdx, 'title', e.target.value)}
                        placeholder="Titre"
                        className={inputClass}
                      />
                      <textarea
                        value={col.content ?? ''}
                        onChange={(e) => updateLayoutColumn(colIdx, 'content', e.target.value)}
                        placeholder="Contenu..."
                        rows={3}
                        className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 resize-y min-h-[72px] focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={saveLayout} className="h-10 rounded-lg px-5 text-sm font-medium bg-[#E8553D] text-white hover:bg-[#D4442E] transition-colors duration-150">
                    {editingIndex >= 0 ? 'Enregistrer' : 'Ajouter'}
                  </button>
                  <button type="button" onClick={closeModal} className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors">Annuler</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
