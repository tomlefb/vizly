'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
  X,
  Type,
  BarChart3,
  Columns,
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

const EMPTY_PROJECT: ProjectFormData = {
  title: '',
  description: '',
  images: [],
  external_link: '',
  tags: [],
  display_order: 0,
}

function emptyBlock(order: number): CustomBlock {
  return { id: generateBlockId(), title: '', subtitle: '', content: '', order }
}

function emptyKpi(): KpiItem {
  return {
    id: generateKpiId(),
    type: 'number',
    label: '',
    value: 0,
    maxValue: 100,
    unit: '',
  }
}

function emptyLayout(): LayoutBlock {
  return {
    id: generateLayoutId(),
    columnCount: 2,
    columns: [
      { type: 'empty' },
      { type: 'empty' },
    ] as LayoutColumn[],
  }
}

/** Strip HTML tags for preview text */
function stripHtml(html: string): string {
  if (typeof document !== 'undefined') {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent ?? ''
  }
  return html.replace(/<[^>]*>/g, '')
}

// ── Input class (design system) ──

const inputClass =
  'w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]'

// ── Main component ──

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
  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null)
  const [editingIndex, setEditingIndex] = useState(-1)

  // Editing state per type
  const [editingProject, setEditingProject] = useState<ProjectFormData>({ ...EMPTY_PROJECT })
  const [editingBlock, setEditingBlock] = useState<CustomBlock>(emptyBlock(0))
  const [editingKpi, setEditingKpi] = useState<KpiItem>(emptyKpi())
  const [editingLayout, setEditingLayout] = useState<LayoutBlock>(emptyLayout())

  // Image upload state (projects)
  const [localFiles, setLocalFiles] = useState<File[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const editingProjectRef = useRef(editingProject)
  editingProjectRef.current = editingProject

  // ── Modal open / close ──

  const closeModal = useCallback(() => {
    setModalType(null)
    setEditingIndex(-1)
    setLocalFiles([])
    setIsUploadingImages(false)
  }, [])

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
            if (result.url) {
              uploadedUrls.push(result.url)
              uploadedFiles.push(file)
            }
          } catch {
            /* skip failed uploads */
          }
        }
        if (uploadedFiles.length > 0) {
          setLocalFiles((prev) => prev.filter((f) => !uploadedFiles.includes(f)))
        }
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
        const newImages = [...editingProject.images]
        newImages.splice(index, 1)
        setEditingProject((prev) => ({ ...prev, images: newImages }))
      } else {
        const localIndex = index - existingCount
        setLocalFiles((prev) => {
          const copy = [...prev]
          copy.splice(localIndex, 1)
          return copy
        })
      }
    },
    [editingProject.images]
  )

  const saveProject = useCallback(() => {
    if (!editingProject.title.trim()) return
    if (editingIndex >= 0) {
      const updated = [...projects]
      updated[editingIndex] = editingProject
      onProjectsChange(updated)
    } else {
      onProjectsChange([...projects, editingProject])
    }
    closeModal()
  }, [editingIndex, editingProject, projects, onProjectsChange, closeModal])

  const deleteProject = useCallback(
    (index: number) => {
      const updated = projects.filter((_, i) => i !== index)
      const reordered = updated.map((p, i) => ({ ...p, display_order: i }))
      onProjectsChange(reordered)
    },
    [projects, onProjectsChange]
  )

  // ── Block handlers ──

  const openAddBlock = useCallback(() => {
    setEditingBlock(emptyBlock(customBlocks.length))
    setEditingIndex(-1)
    setModalType('block')
  }, [customBlocks.length])

  const openEditBlock = useCallback(
    (index: number) => {
      const b = customBlocks[index]
      if (!b) return
      setEditingBlock({ ...b })
      setEditingIndex(index)
      setModalType('block')
    },
    [customBlocks]
  )

  const saveBlock = useCallback(() => {
    if (!editingBlock.title.trim()) return
    if (editingIndex >= 0) {
      const updated = [...customBlocks]
      updated[editingIndex] = editingBlock
      onCustomBlocksChange(updated)
    } else {
      onCustomBlocksChange([...customBlocks, editingBlock])
    }
    closeModal()
  }, [editingIndex, editingBlock, customBlocks, onCustomBlocksChange, closeModal])

  const deleteBlock = useCallback(
    (index: number) => {
      onCustomBlocksChange(customBlocks.filter((_, i) => i !== index))
    },
    [customBlocks, onCustomBlocksChange]
  )

  // ── KPI handlers ──

  const openAddKpi = useCallback(() => {
    setEditingKpi(emptyKpi())
    setEditingIndex(-1)
    setModalType('kpi')
  }, [])

  const openEditKpi = useCallback(
    (index: number) => {
      const k = kpis[index]
      if (!k) return
      setEditingKpi({ ...k })
      setEditingIndex(index)
      setModalType('kpi')
    },
    [kpis]
  )

  const saveKpi = useCallback(() => {
    if (!editingKpi.label.trim()) return
    if (editingIndex >= 0) {
      const updated = [...kpis]
      updated[editingIndex] = editingKpi
      onKpisChange(updated)
    } else {
      onKpisChange([...kpis, editingKpi])
    }
    closeModal()
  }, [editingIndex, editingKpi, kpis, onKpisChange, closeModal])

  const deleteKpi = useCallback(
    (index: number) => {
      onKpisChange(kpis.filter((_, i) => i !== index))
    },
    [kpis, onKpisChange]
  )

  // ── Layout handlers ──

  const openAddLayout = useCallback(() => {
    setEditingLayout(emptyLayout())
    setEditingIndex(-1)
    setModalType('layout')
  }, [])

  const openEditLayout = useCallback(
    (index: number) => {
      const l = layoutBlocks[index]
      if (!l) return
      setEditingLayout({ ...l, columns: l.columns.map((c) => ({ ...c })) })
      setEditingIndex(index)
      setModalType('layout')
    },
    [layoutBlocks]
  )

  const saveLayout = useCallback(() => {
    if (editingIndex >= 0) {
      const updated = [...layoutBlocks]
      updated[editingIndex] = editingLayout
      onLayoutBlocksChange(updated)
    } else {
      onLayoutBlocksChange([...layoutBlocks, editingLayout])
    }
    closeModal()
  }, [editingIndex, editingLayout, layoutBlocks, onLayoutBlocksChange, closeModal])

  const deleteLayout = useCallback(
    (index: number) => {
      onLayoutBlocksChange(layoutBlocks.filter((_, i) => i !== index))
    },
    [layoutBlocks, onLayoutBlocksChange]
  )

  const setLayoutColumnCount = useCallback(
    (count: 1 | 2 | 3) => {
      const columns: LayoutColumn[] = Array.from({ length: count }, (_, i) =>
        editingLayout.columns[i] ?? { type: 'empty' as const }
      )
      setEditingLayout({ ...editingLayout, columnCount: count, columns })
    },
    [editingLayout]
  )

  // ── Render helpers ──

  function renderSectionHeader(
    title: string,
    count: number,
    icon: React.ReactNode,
    onAdd: () => void
  ) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[18px] font-semibold leading-7 text-[#111827]">{title}</h3>
          {count > 0 && (
            <span className="inline-flex items-center justify-center h-[22px] min-w-[22px] px-1.5 rounded text-[11px] font-semibold text-[#6B7280] bg-[#F3F4F6]">
              {count}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#E8553D] hover:text-[#D4442E] transition-colors duration-150"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>
    )
  }

  function renderEmpty(label: string) {
    return (
      <p className="text-[13px] text-[#9CA3AF] text-center py-6">{label}</p>
    )
  }

  function renderItemActions(onEdit: () => void, onDelete: () => void, label: string) {
    return (
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
          aria-label={`Modifier ${label}`}
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#DC2626] hover:bg-[#F3F4F6] transition-colors"
          aria-label={`Supprimer ${label}`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)} data-testid="step-content">
      {/* ── Section 1: Projets ── */}
      <section>
        {renderSectionHeader('Projets', projects.length, <ImageIcon className="h-[18px] w-[18px] text-[#6B7280]" />, openAddProject)}
        <div className="mt-3 max-h-[200px] overflow-y-auto">
          {projects.length === 0
            ? renderEmpty('Aucun projet')
            : projects.map((project, index) => (
                <div
                  key={`project-${project.title}-${index}`}
                  className="group flex items-center gap-3 h-14 px-3 rounded-lg hover:bg-[#F9FAFB] transition-colors duration-150"
                >
                  {/* Thumbnail */}
                  <div className="shrink-0 h-10 w-10 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] overflow-hidden flex items-center justify-center">
                    {project.images.length > 0 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={project.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5 text-[#D1D5DB]" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">
                      {project.title || 'Sans titre'}
                    </p>
                    {project.description && (
                      <p className="text-[13px] text-[#6B7280] truncate">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {renderItemActions(
                    () => openEditProject(index),
                    () => deleteProject(index),
                    project.title || 'projet'
                  )}
                </div>
              ))}
        </div>
      </section>

      <div className="border-b border-[#E5E7EB]" />

      {/* ── Section 2: Blocs de texte ── */}
      <section>
        {renderSectionHeader('Blocs de texte', customBlocks.length, <Type className="h-[18px] w-[18px] text-[#6B7280]" />, openAddBlock)}
        <div className="mt-3 max-h-[200px] overflow-y-auto">
          {customBlocks.length === 0
            ? renderEmpty('Aucun bloc de texte')
            : customBlocks.map((block, index) => (
                <div
                  key={block.id}
                  className="group flex items-center gap-3 h-14 px-3 rounded-lg hover:bg-[#F9FAFB] transition-colors duration-150"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">
                      {block.title || 'Sans titre'}
                    </p>
                    {block.content && (
                      <p className="text-[13px] text-[#6B7280] truncate">
                        {stripHtml(block.content)}
                      </p>
                    )}
                  </div>

                  {renderItemActions(
                    () => openEditBlock(index),
                    () => deleteBlock(index),
                    block.title || 'bloc'
                  )}
                </div>
              ))}
        </div>
      </section>

      <div className="border-b border-[#E5E7EB]" />

      {/* ── Section 3: Chiffres cles ── */}
      <section>
        {renderSectionHeader('Chiffres cles', kpis.length, <BarChart3 className="h-[18px] w-[18px] text-[#6B7280]" />, openAddKpi)}
        <div className="mt-3 max-h-[200px] overflow-y-auto">
          {kpis.length === 0
            ? renderEmpty('Aucun chiffre cle')
            : kpis.map((kpi, index) => (
                <div
                  key={kpi.id}
                  className="group flex items-center gap-3 h-14 px-3 rounded-lg hover:bg-[#F9FAFB] transition-colors duration-150"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#111827] truncate">
                      <span className="font-medium">{kpi.value}{kpi.unit ? ` ${kpi.unit}` : ''}</span>
                      {kpi.label && (
                        <span className="text-[#6B7280]"> — {kpi.label}</span>
                      )}
                    </p>
                  </div>

                  {renderItemActions(
                    () => openEditKpi(index),
                    () => deleteKpi(index),
                    kpi.label || 'KPI'
                  )}
                </div>
              ))}
        </div>
      </section>

      <div className="border-b border-[#E5E7EB]" />

      {/* ── Section 4: Sections colonnes ── */}
      <section>
        {renderSectionHeader('Sections colonnes', layoutBlocks.length, <Columns className="h-[18px] w-[18px] text-[#6B7280]" />, openAddLayout)}
        <div className="mt-3 max-h-[200px] overflow-y-auto">
          {layoutBlocks.length === 0
            ? renderEmpty('Aucune section colonnes')
            : layoutBlocks.map((layout, index) => (
                <div
                  key={layout.id}
                  className="group flex items-center gap-3 h-14 px-3 rounded-lg hover:bg-[#F9FAFB] transition-colors duration-150"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">
                      {layout.columnCount} colonne{layout.columnCount > 1 ? 's' : ''}
                    </p>
                    <p className="text-[13px] text-[#6B7280] truncate">
                      {layout.columns.map((c) => c.type).join(', ')}
                    </p>
                  </div>

                  {renderItemActions(
                    () => openEditLayout(index),
                    () => deleteLayout(index),
                    `section ${layout.columnCount} colonnes`
                  )}
                </div>
              ))}
        </div>
      </section>

      {/* ── Modals ── */}

      {/* Project modal */}
      {modalType === 'project' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} />
          <div className="relative w-full max-w-[560px] max-h-[85vh] overflow-y-auto bg-white rounded-xl p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-[#111827]">
                {editingIndex >= 0 ? 'Modifier le projet' : 'Nouveau projet'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ProjectForm
              project={editingProject}
              onChange={setEditingProject}
            />

            <div>
              <label className="block text-sm text-[#6B7280] mb-1.5">
                Images
              </label>
              <ImageUploader
                images={localFiles}
                existingUrls={editingProject.images}
                isUploading={isUploadingImages}
                onImagesChange={handleImagesChange}
                onImageRemove={handleImageRemove}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={saveProject}
                disabled={!editingProject.title.trim()}
                className={cn(
                  'h-10 rounded-lg px-5 text-sm font-medium transition-colors duration-150',
                  editingProject.title.trim()
                    ? 'bg-[#E8553D] text-white hover:bg-[#D4442E]'
                    : 'bg-[#E8553D]/50 text-white/60 cursor-not-allowed'
                )}
              >
                {editingIndex >= 0 ? 'Enregistrer' : 'Ajouter'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors duration-150"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block modal */}
      {modalType === 'block' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} />
          <div className="relative w-full max-w-[560px] max-h-[85vh] overflow-y-auto bg-white rounded-xl p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-[#111827]">
                {editingIndex >= 0 ? 'Modifier le bloc' : 'Nouveau bloc de texte'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-sm text-[#6B7280] mb-1.5">Titre</label>
              <input
                type="text"
                value={editingBlock.title}
                onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                placeholder="Titre du bloc"
                maxLength={200}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm text-[#6B7280] mb-1.5">Sous-titre</label>
              <input
                type="text"
                value={editingBlock.subtitle}
                onChange={(e) => setEditingBlock({ ...editingBlock, subtitle: e.target.value })}
                placeholder="Sous-titre (optionnel)"
                maxLength={200}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm text-[#6B7280] mb-1.5">Contenu</label>
              <RichTextEditor
                value={editingBlock.content}
                onChange={(html) => setEditingBlock({ ...editingBlock, content: html })}
                placeholder="Ecris le contenu du bloc..."
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={saveBlock}
                disabled={!editingBlock.title.trim()}
                className={cn(
                  'h-10 rounded-lg px-5 text-sm font-medium transition-colors duration-150',
                  editingBlock.title.trim()
                    ? 'bg-[#E8553D] text-white hover:bg-[#D4442E]'
                    : 'bg-[#E8553D]/50 text-white/60 cursor-not-allowed'
                )}
              >
                {editingIndex >= 0 ? 'Enregistrer' : 'Ajouter'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors duration-150"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI modal */}
      {modalType === 'kpi' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} />
          <div className="relative w-full max-w-[560px] max-h-[85vh] overflow-y-auto bg-white rounded-xl p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-[#111827]">
                {editingIndex >= 0 ? 'Modifier le chiffre cle' : 'Nouveau chiffre cle'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-sm text-[#6B7280] mb-1.5">Valeur</label>
              <input
                type="number"
                value={editingKpi.value}
                onChange={(e) =>
                  setEditingKpi({ ...editingKpi, value: Number(e.target.value) })
                }
                placeholder="42"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm text-[#6B7280] mb-1.5">Label</label>
              <input
                type="text"
                value={editingKpi.label}
                onChange={(e) => setEditingKpi({ ...editingKpi, label: e.target.value })}
                placeholder="Projets realises"
                maxLength={200}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm text-[#6B7280] mb-1.5">Unite (optionnel)</label>
              <input
                type="text"
                value={editingKpi.unit}
                onChange={(e) => setEditingKpi({ ...editingKpi, unit: e.target.value })}
                placeholder="%"
                maxLength={20}
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={saveKpi}
                disabled={!editingKpi.label.trim()}
                className={cn(
                  'h-10 rounded-lg px-5 text-sm font-medium transition-colors duration-150',
                  editingKpi.label.trim()
                    ? 'bg-[#E8553D] text-white hover:bg-[#D4442E]'
                    : 'bg-[#E8553D]/50 text-white/60 cursor-not-allowed'
                )}
              >
                {editingIndex >= 0 ? 'Enregistrer' : 'Ajouter'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors duration-150"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layout modal */}
      {modalType === 'layout' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} />
          <div className="relative w-full max-w-[560px] max-h-[85vh] overflow-y-auto bg-white rounded-xl p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-[#111827]">
                {editingIndex >= 0 ? 'Modifier la section' : 'Nouvelle section colonnes'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-sm text-[#6B7280] mb-1.5">Nombre de colonnes</label>
              <div className="flex items-center gap-2">
                {([1, 2, 3] as const).map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setLayoutColumnCount(count)}
                    className={cn(
                      'h-10 w-14 rounded-lg text-sm font-medium transition-colors duration-150',
                      editingLayout.columnCount === count
                        ? 'bg-[#111827] text-white'
                        : 'border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#D1D5DB]'
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[13px] text-[#9CA3AF]">
              Configuration avancee a venir
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={saveLayout}
                className="h-10 rounded-lg px-5 text-sm font-medium bg-[#E8553D] text-white hover:bg-[#D4442E] transition-colors duration-150"
              >
                {editingIndex >= 0 ? 'Enregistrer' : 'Ajouter'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors duration-150"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
