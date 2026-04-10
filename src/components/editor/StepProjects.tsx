'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
            <h2 className="text-[18px] font-semibold leading-7 text-[#111827]">
              {isEditing ? 'Modifier le projet' : 'Nouveau projet'}
            </h2>
            <p className="text-[13px] text-[#6B7280] mt-1">
              {isEditing ? 'Modifie les informations de ton projet' : 'Ajoute un projet à ton portfolio'}
            </p>
          </div>

          <ProjectForm
            key={isEditing ? `edit-${editingIndex}` : `new-${projects.length}`}
            project={editingProject}
            onChange={setEditingProject}
          />

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={!editingProject.title.trim()}
              className={cn(
                'h-10 rounded-lg px-5 text-sm font-medium transition-colors duration-150',
                editingProject.title.trim()
                  ? 'bg-[#E8553D] text-white hover:bg-[#D4442E]'
                  : 'bg-[#E8553D]/50 text-white/60 cursor-not-allowed'
              )}
            >
              {isEditing ? 'Enregistrer' : 'Ajouter le projet'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetToNew}
                className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors duration-150"
              >
                Annuler
              </button>
            )}
          </div>
        </div>

        {/* ── Right: Images + Project list ── */}
        <div className="flex-1 lg:max-w-[360px] space-y-6 mt-8 lg:mt-0">

          {/* Images */}
          <div>
            <h2 className="text-[18px] font-semibold leading-7 text-[#111827]">
              Images
            </h2>
            <p className="text-[13px] text-[#6B7280] mt-1 mb-3">
              {isUploadingImages ? 'Upload en cours...' : 'Ajoute jusqu\u2019a 5 images'}
            </p>
            <ImageUploader
              images={localFiles}
              existingUrls={editingProject.images}
              isUploading={isUploadingImages}
              onImagesChange={handleImagesChange}
              onImageRemove={handleImageRemove}
            />
          </div>

          <div className="border-b border-[#E5E7EB]" />

          {/* Project list */}
          <div>
            <h2 className="text-[18px] font-semibold leading-7 text-[#111827] mb-3">
              {projects.length > 0
                ? `${projects.length} projet${projects.length > 1 ? 's' : ''}`
                : 'Tes projets'}
            </h2>

            {projects.length === 0 ? (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] py-10">
                <p className="text-[13px] text-[#9CA3AF]">Tes projets apparaitront ici</p>
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
                      'group relative flex items-center gap-2.5 rounded-xl border bg-white p-3 cursor-grab active:cursor-grabbing transition-[border-color] duration-150',
                      editingIndex === index || dragOverIndex === index
                        ? 'border-[#D1D5DB]'
                        : 'border-[#E5E7EB]',
                    )}
                  >
                    <div className="shrink-0 text-[#E5E7EB] group-hover:text-[#9CA3AF] transition-colors">
                      <GripVertical className="h-3.5 w-3.5" />
                    </div>

                    {/* Thumbnail */}
                    <div className="shrink-0 h-10 w-10 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] overflow-hidden flex items-center justify-center">
                      {project.images.length > 0 ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={project.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5 text-[#D1D5DB]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111827] truncate">
                        {project.title || 'Sans titre'}
                      </p>
                      {project.tags.length > 0 && (
                        <p className="text-[12px] text-[#9CA3AF] truncate mt-0.5">
                          {project.tags.slice(0, 3).join(', ')}
                          {project.tags.length > 3 && ` +${project.tags.length - 3}`}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        type="button"
                        onClick={() => openEditProject(index)}
                        className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
                        aria-label={`Modifier ${project.title}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(index)}
                        className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#DC2626] hover:bg-[#F3F4F6] transition-colors"
                        aria-label={`Supprimer ${project.title}`}
                      >
                        <Trash2 className="h-3 w-3" />
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
