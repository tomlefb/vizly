'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  GripVertical,
  Pencil,
  Trash2,
  ImageIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { VzBtn } from '@/components/ui/vizly'
import { ProjectForm } from './ProjectForm'
import { ImageUploader } from './ImageUploader'
import type { ProjectFormData } from '@/lib/validations'

interface StepProjectsProps {
  projects: ProjectFormData[]
  onProjectsChange: (projects: ProjectFormData[]) => void
  className?: string
}

const EMPTY_PROJECT: ProjectFormData = {
  title: '',
  description: '',
  images: [],
  external_link: '',
  tags: [],
  display_order: 0,
}

export function StepProjects({
  projects,
  onProjectsChange,
  className,
}: StepProjectsProps) {
  const t = useTranslations('editor.stepProjects')
  const [editingIndex, setEditingIndex] = useState(-1)
  const [editingProject, setEditingProject] = useState<ProjectFormData>({
    ...EMPTY_PROJECT,
    display_order: projects.length,
  })
  const [localFiles, setLocalFiles] = useState<File[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const isEditing = editingIndex >= 0
  const editingRef = useRef(editingProject)
  editingRef.current = editingProject

  const resetToNew = useCallback(() => {
    setEditingIndex(-1)
    setEditingProject({ ...EMPTY_PROJECT, display_order: projects.length })
    setLocalFiles([])
  }, [projects.length])

  const openEditProject = useCallback(
    (index: number) => {
      const project = projects[index]
      if (project) {
        setEditingIndex(index)
        setEditingProject({ ...project })
        setLocalFiles([])
      }
    },
    [projects]
  )

  useEffect(() => {
    if (isEditing && editingIndex >= projects.length) {
      resetToNew()
    }
  }, [projects.length, editingIndex, isEditing, resetToNew])

  // ── Image handling (lifted from ProjectForm) ──

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
          } catch { /* skip */ }
        }
        if (uploadedFiles.length > 0) {
          setLocalFiles((prev) => prev.filter((f) => !uploadedFiles.includes(f)))
        }
        if (uploadedUrls.length > 0) {
          const latest = editingRef.current
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
        setEditingProject({ ...editingProject, images: newImages })
      } else {
        const localIndex = index - existingCount
        const newFiles = [...localFiles]
        newFiles.splice(localIndex, 1)
        setLocalFiles(newFiles)
      }
    },
    [editingProject, localFiles]
  )

  // ── Project CRUD ──

  const handleSave = useCallback(() => {
    if (!editingProject.title.trim()) return
    if (isEditing) {
      const updated = [...projects]
      updated[editingIndex] = editingProject
      onProjectsChange(updated)
    } else {
      onProjectsChange([...projects, editingProject])
    }
    resetToNew()
  }, [isEditing, editingIndex, editingProject, projects, onProjectsChange, resetToNew])

  const handleDelete = useCallback(
    (index: number) => {
      const updated = projects.filter((_, i) => i !== index)
      const reordered = updated.map((p, i) => ({ ...p, display_order: i }))
      onProjectsChange(reordered)
      resetToNew()
    },
    [projects, onProjectsChange, resetToNew]
  )

  // ── Drag & drop ──

  const handleDragStart = useCallback((index: number) => { setDragStartIndex(index) }, [])
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index) }, [])
  const handleDragEnd = useCallback(() => { setDragStartIndex(null); setDragOverIndex(null) }, [])

  const handleDrop = useCallback(
    (targetIndex: number) => {
      if (dragStartIndex === null || dragStartIndex === targetIndex) { setDragStartIndex(null); setDragOverIndex(null); return }
      const reordered = [...projects]
      const [moved] = reordered.splice(dragStartIndex, 1)
      if (moved) {
        reordered.splice(targetIndex, 0, moved)
        onProjectsChange(reordered.map((p, i) => ({ ...p, display_order: i })))
      }
      setDragStartIndex(null)
      setDragOverIndex(null)
    },
    [dragStartIndex, projects, onProjectsChange]
  )

  return (
    <div className={cn(className)} data-testid="step-projects">
      <div className="flex flex-col lg:flex-row lg:gap-12">

        {/* ── Left: Text fields ── */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
              {isEditing ? t('editTitle') : t('newTitle')}
            </h3>
            <p className="text-sm text-muted mt-1">
              {isEditing ? t('editDescription') : t('newDescription')}
            </p>
          </div>

          <ProjectForm
            key={isEditing ? `edit-${editingIndex}` : `new-${projects.length}`}
            project={editingProject}
            onChange={setEditingProject}
          />

          <div className="flex items-center gap-3 pt-1">
            <VzBtn
              variant="primary"
              onClick={handleSave}
              disabled={!editingProject.title.trim()}
            >
              {isEditing ? t('save') : t('add')}
            </VzBtn>
            {isEditing && (
              <VzBtn variant="ghost" size="sm" onClick={resetToNew}>
                {t('cancel')}
              </VzBtn>
            )}
          </div>
        </div>

        {/* ── Right: Images + Project list ── */}
        <div className="flex-1 lg:max-w-[360px] space-y-6 mt-8 lg:mt-0">

          {/* Images */}
          <div>
            <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
              {t('imagesTitle')}
            </h3>
            <p className="mb-3 mt-1 text-sm text-muted">
              {isUploadingImages ? t('imagesUploading') : t('imagesHelper')}
            </p>
            <ImageUploader
              images={localFiles}
              existingUrls={editingProject.images}
              isUploading={isUploadingImages}
              onImagesChange={handleImagesChange}
              onImageRemove={handleImageRemove}
            />
          </div>

          <div className="border-b border-border-light" />

          {/* Project list */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
              {projects.length > 0
                ? projects.length === 1
                  ? t('projectsCountOne')
                  : t('projectsCountMany', { count: projects.length })
                : t('projectsLabel')}
            </h3>

            {projects.length === 0 ? (
              <div className="flex items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-light bg-surface-warm py-10">
                <p className="text-sm text-muted-foreground">{t('emptyHint')}</p>
              </div>
            ) : (
              <div className="space-y-2" data-testid="project-list" role="list">
                {projects.map((project, index) => (
                  <div
                    key={`project-${index}-${project.title}`}
                    role="listitem"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'group relative flex items-center gap-2.5 rounded-[var(--radius-md)] border bg-surface p-3 cursor-grab active:cursor-grabbing transition-colors duration-150',
                      editingIndex === index || dragOverIndex === index
                        ? 'border-foreground'
                        : 'border-border-light hover:border-border',
                    )}
                  >
                    <div className="shrink-0 text-border-light group-hover:text-muted-foreground transition-colors">
                      <GripVertical className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </div>

                    {/* Thumbnail */}
                    <div className="shrink-0 h-10 w-10 rounded-[var(--radius-sm)] bg-surface-warm border border-border-light overflow-hidden flex items-center justify-center">
                      {project.images.length > 0 ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={project.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {project.title || t('untitled')}
                      </p>
                      {project.tags.length > 0 && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {project.tags.slice(0, 3).join(', ')}
                          {project.tags.length > 3 && ` +${project.tags.length - 3}`}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        type="button"
                        onClick={() => openEditProject(index)}
                        className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-foreground hover:bg-surface-warm transition-colors"
                        aria-label={t('editAriaLabel', { title: project.title })}
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(index)}
                        className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-destructive hover:bg-destructive/5 transition-colors"
                        aria-label={t('deleteAriaLabel', { title: project.title })}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
