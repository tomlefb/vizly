'use client'

import { useState, useCallback } from 'react'
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  ImageIcon,
  X,
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
  // Index of inline form: null = closed, -1 = new project, 0+ = editing existing
  const [inlineFormIndex, setInlineFormIndex] = useState<number | null>(null)
  const [editingProject, setEditingProject] = useState<ProjectFormData>(EMPTY_PROJECT)
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const openNewProject = useCallback(() => {
    setInlineFormIndex(-1)
    setEditingProject({ ...EMPTY_PROJECT, display_order: projects.length })
  }, [projects.length])

  const openEditProject = useCallback(
    (index: number) => {
      const project = projects[index]
      if (project) {
        setInlineFormIndex(index)
        setEditingProject({ ...project })
      }
    },
    [projects]
  )

  const handleSave = useCallback(() => {
    if (!editingProject.title.trim()) return
    if (inlineFormIndex !== null && inlineFormIndex >= 0) {
      const updated = [...projects]
      updated[inlineFormIndex] = editingProject
      onProjectsChange(updated)
    } else {
      onProjectsChange([...projects, editingProject])
    }
    setInlineFormIndex(null)
  }, [inlineFormIndex, editingProject, projects, onProjectsChange])

  const handleCancel = useCallback(() => {
    setInlineFormIndex(null)
  }, [])

  const handleDelete = useCallback(
    (index: number) => {
      const updated = projects.filter((_, i) => i !== index)
      const reordered = updated.map((p, i) => ({ ...p, display_order: i }))
      onProjectsChange(reordered)
      if (inlineFormIndex === index) setInlineFormIndex(null)
    },
    [projects, onProjectsChange, inlineFormIndex]
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
    <div className={cn('space-y-6', className)} data-testid="step-projects">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold leading-8 text-[#111827]">
            Tes projets
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-1">
            Le coeur de ton portfolio
          </p>
        </div>
        {projects.length > 0 && inlineFormIndex === null && (
          <button
            type="button"
            data-testid="add-project-btn"
            onClick={openNewProject}
            className="inline-flex items-center gap-1.5 h-10 rounded-lg border border-[#E5E7EB] bg-white px-5 text-sm font-medium text-[#111827] transition-colors duration-150 hover:bg-[#F3F4F6]"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        )}
      </div>

      {/* Empty state */}
      {projects.length === 0 && inlineFormIndex === null && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-[#6B7280]">Aucun projet pour le moment</p>
          <button
            type="button"
            data-testid="add-project-btn"
            onClick={openNewProject}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#E8553D] transition-colors duration-150 hover:text-[#D4442E]"
          >
            <Plus className="h-4 w-4" />
            Ajouter un projet
          </button>
        </div>
      )}

      {/* Project list */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" data-testid="project-list" role="list">
          {projects.map((project, index) => (
            <div
              key={`project-${index}-${project.title}`}
              role="listitem"
              draggable={inlineFormIndex === null}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'group relative flex gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 cursor-grab active:cursor-grabbing transition-[border-color] duration-150',
                dragOverIndex === index && 'border-[#D1D5DB]',
              )}
            >
              {/* Drag handle */}
              <div className="shrink-0 pt-0.5 text-[#E5E7EB] group-hover:text-[#9CA3AF] transition-colors">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Thumbnail */}
              <div className="shrink-0 h-16 w-16 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] overflow-hidden flex items-center justify-center">
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

              {/* Actions — hover */}
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
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

      {/* Inline form — no card, just fields */}
      {inlineFormIndex !== null && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-semibold text-[#111827]">
              {inlineFormIndex >= 0 ? 'Modifier le projet' : 'Nouveau projet'}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
              aria-label="Annuler"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ProjectForm
            key={inlineFormIndex >= 0 ? `edit-${inlineFormIndex}` : `new-${projects.length}`}
            project={editingProject}
            onChange={setEditingProject}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors duration-150"
            >
              Annuler
            </button>
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
              {inlineFormIndex >= 0 ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Add button — text link style */}
      {projects.length > 0 && inlineFormIndex === null && (
        <button
          type="button"
          onClick={openNewProject}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#E8553D] transition-colors duration-150 hover:text-[#D4442E]"
        >
          <Plus className="h-4 w-4" />
          Ajouter un projet
        </button>
      )}
    </div>
  )
}
