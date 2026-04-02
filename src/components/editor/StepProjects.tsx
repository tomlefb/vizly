'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProjectForm } from './ProjectForm'
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
  // -1 = new project, 0+ = editing existing
  const [editingIndex, setEditingIndex] = useState(-1)
  const [editingProject, setEditingProject] = useState<ProjectFormData>({
    ...EMPTY_PROJECT,
    display_order: projects.length,
  })
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const isEditing = editingIndex >= 0

  const resetToNew = useCallback(() => {
    setEditingIndex(-1)
    setEditingProject({ ...EMPTY_PROJECT, display_order: projects.length })
  }, [projects.length])

  const openEditProject = useCallback(
    (index: number) => {
      const project = projects[index]
      if (project) {
        setEditingIndex(index)
        setEditingProject({ ...project })
      }
    },
    [projects]
  )

  // Reset to new mode when projects change (after save/delete)
  useEffect(() => {
    if (isEditing && editingIndex >= projects.length) {
      resetToNew()
    }
  }, [projects.length, editingIndex, isEditing, resetToNew])

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

  const handleDragStart = useCallback((index: number) => {
    setDragStartIndex(index)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      setDragOverIndex(index)
    },
    []
  )

  const handleDrop = useCallback(
    (targetIndex: number) => {
      if (dragStartIndex === null || dragStartIndex === targetIndex) {
        setDragStartIndex(null)
        setDragOverIndex(null)
        return
      }
      const reordered = [...projects]
      const [moved] = reordered.splice(dragStartIndex, 1)
      if (moved) {
        reordered.splice(targetIndex, 0, moved)
        const withOrder = reordered.map((p, i) => ({ ...p, display_order: i }))
        onProjectsChange(withOrder)
      }
      setDragStartIndex(null)
      setDragOverIndex(null)
    },
    [dragStartIndex, projects, onProjectsChange]
  )

  const handleDragEnd = useCallback(() => {
    setDragStartIndex(null)
    setDragOverIndex(null)
  }, [])

  return (
    <div className={cn('space-y-8', className)} data-testid="step-projects">
      {/* Split layout */}
      <div className="flex flex-col lg:flex-row lg:gap-12">

        {/* ── Left: Form ── */}
        <div className="flex-1 lg:max-w-[480px] space-y-5">
          <div>
            <h2 className="text-[18px] font-semibold leading-7 text-[#111827]">
              {isEditing ? 'Modifier le projet' : 'Nouveau projet'}
            </h2>
            <p className="text-[13px] text-[#6B7280] mt-1">
              {isEditing
                ? 'Modifie les informations de ton projet'
                : 'Ajoute un projet a ton portfolio'}
            </p>
          </div>

          <ProjectForm
            key={isEditing ? `edit-${editingIndex}` : `new-${projects.length}`}
            project={editingProject}
            onChange={setEditingProject}
          />

          <div className="flex items-center gap-3">
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

        {/* ── Right: Project list ── */}
        <div className="flex-1 mt-8 lg:mt-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-semibold leading-7 text-[#111827]">
              {projects.length > 0
                ? `${projects.length} projet${projects.length > 1 ? 's' : ''}`
                : 'Tes projets'}
            </h2>
          </div>

          {projects.length === 0 ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] py-16">
              <p className="text-sm text-[#9CA3AF]">
                Tes projets apparaitront ici
              </p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="project-list" role="list">
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
                    'group relative flex gap-3 rounded-xl border bg-white p-4 cursor-grab active:cursor-grabbing transition-[border-color] duration-150',
                    editingIndex === index
                      ? 'border-[#D1D5DB]'
                      : dragOverIndex === index
                        ? 'border-[#D1D5DB]'
                        : 'border-[#E5E7EB]',
                  )}
                >
                  {/* Drag handle */}
                  <div className="shrink-0 pt-0.5 text-[#E5E7EB] group-hover:text-[#9CA3AF] transition-colors">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  {/* Thumbnail */}
                  <div className="shrink-0 h-14 w-14 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] overflow-hidden flex items-center justify-center">
                    {project.images.length > 0 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={project.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-[#D1D5DB]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">
                      {project.title || 'Sans titre'}
                    </p>
                    {project.description && (
                      <p className="text-[13px] text-[#6B7280] line-clamp-1 mt-0.5">
                        {project.description}
                      </p>
                    )}
                    {project.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 overflow-hidden">
                        {project.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center h-5 px-2 bg-[#F3F4F6] text-[#111827] rounded-[6px] text-[10px]"
                          >
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span className="text-[10px] text-[#9CA3AF]">+{project.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      type="button"
                      onClick={() => openEditProject(index)}
                      className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#111827] transition-colors"
                      aria-label={`Modifier le projet ${project.title}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(index)}
                      className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#DC2626] transition-colors"
                      aria-label={`Supprimer le projet ${project.title}`}
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
  )
}
