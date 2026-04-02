'use client'

import { useState, useCallback } from 'react'
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  ChevronUp,
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
    <div className={cn('space-y-4', className)} data-testid="step-projects">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
            Tes projets
          </h1>
          <p className="text-[13px] text-muted mt-1">
            Le coeur de ton portfolio
          </p>
        </div>
        {projects.length > 0 && inlineFormIndex === null && (
          <button
            type="button"
            data-testid="add-project-btn"
            onClick={openNewProject}
            className="inline-flex items-center gap-1.5 h-10 rounded-lg bg-[#E8553D] px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#D4442E]"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        )}
      </div>

      {/* Empty state */}
      {projects.length === 0 && inlineFormIndex === null && (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border bg-white px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Aucun projet</p>
          <button
            type="button"
            data-testid="add-project-btn"
            onClick={openNewProject}
            className="mt-4 inline-flex items-center gap-1.5 h-10 rounded-lg bg-[#E8553D] px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#D4442E]"
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
                'group relative flex gap-3 rounded-[var(--radius-lg)] border bg-white p-3.5 cursor-grab active:cursor-grabbing transition-all duration-150',
                dragOverIndex === index
                  ? 'border-accent ring-1 ring-accent/20'
                  : 'border-border/60 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
                inlineFormIndex === index && 'ring-2 ring-accent/20 border-accent'
              )}
            >
              {/* Drag handle */}
              <div className="shrink-0 pt-0.5 text-muted-foreground/20 group-hover:text-muted-foreground transition-colors">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Thumbnail */}
              <div className="shrink-0 h-16 w-16 rounded-[var(--radius-sm)] bg-surface-warm border border-border/40 overflow-hidden flex items-center justify-center">
                {project.images.length > 0 ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={project.images[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-muted-foreground/20" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">
                  {project.title || 'Sans titre'}
                </p>
                {project.description && (
                  <p className="text-[12px] text-muted line-clamp-1 mt-0.5">
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
                      <span className="text-[10px] text-muted-foreground">+{project.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions — hover */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  type="button"
                  onClick={() => openEditProject(index)}
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-white border border-border text-muted hover:text-foreground transition-colors shadow-sm"
                  aria-label={`Modifier le projet ${project.title}`}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-white border border-border text-muted hover:text-destructive transition-colors shadow-sm"
                  aria-label={`Supprimer le projet ${project.title}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline form — appears below the list or empty state */}
      {inlineFormIndex !== null && (
        <div className="bg-white border border-border/60 rounded-[var(--radius-lg)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
            <h3 className="text-[14px] font-medium text-foreground font-[family-name:var(--font-satoshi)]">
              {inlineFormIndex >= 0 ? 'Modifier le projet' : 'Nouveau projet'}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:text-foreground hover:bg-surface-warm transition-colors"
              aria-label="Annuler"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-5 py-4">
            <ProjectForm
              key={inlineFormIndex >= 0 ? `edit-${inlineFormIndex}` : `new-${projects.length}`}
              project={editingProject}
              onChange={setEditingProject}
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border/40 px-5 py-3">
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

      {/* Add button (when list has items and form is closed) */}
      {projects.length > 0 && inlineFormIndex === null && (
        <button
          type="button"
          onClick={openNewProject}
          className="flex items-center justify-center gap-1.5 w-full h-10 border border-dashed border-[#E5E7EB] rounded-lg text-sm font-medium text-[#6B7280] transition-colors duration-150 hover:border-[#D1D5DB] hover:bg-[#F3F4F6]"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter un projet
        </button>
      )}
    </div>
  )
}
