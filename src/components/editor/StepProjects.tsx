'use client'

import { useState, useCallback } from 'react'
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  X,
  FolderOpen,
  ImageIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectFormData>(EMPTY_PROJECT)
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const openNewProject = useCallback(() => {
    setEditingIndex(null)
    setEditingProject({ ...EMPTY_PROJECT, display_order: projects.length })
    setIsDialogOpen(true)
  }, [projects.length])

  const openEditProject = useCallback(
    (index: number) => {
      const project = projects[index]
      if (project) {
        setEditingIndex(index)
        setEditingProject({ ...project })
        setIsDialogOpen(true)
      }
    },
    [projects]
  )

  const handleSave = useCallback(() => {
    if (editingIndex !== null) {
      // Update
      const updated = [...projects]
      updated[editingIndex] = editingProject
      onProjectsChange(updated)
    } else {
      // Create
      onProjectsChange([...projects, editingProject])
    }
    setIsDialogOpen(false)
    setEditingIndex(null)
  }, [editingIndex, editingProject, projects, onProjectsChange])

  const handleDelete = useCallback(
    (index: number) => {
      const updated = projects.filter((_, i) => i !== index)
      // Reorder display_order
      const reordered = updated.map((p, i) => ({ ...p, display_order: i }))
      onProjectsChange(reordered)
    },
    [projects, onProjectsChange]
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
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-satoshi)]">
          Tes projets
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Le coeur de ton portfolio
        </p>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 px-8 py-16 text-center"
        >
          <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500">
            Aucun projet pour le moment
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
            Ajoute ton premier projet pour commencer
          </p>
          <button
            type="button"
            data-testid="add-project-btn"
            onClick={openNewProject}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-[0.98] shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Ajouter un projet
          </button>
        </motion.div>
      )}

      {/* Project list */}
      {projects.length > 0 && (
        <>
          <div className="space-y-2" data-testid="project-list" role="list">
            <AnimatePresence mode="popLayout">
              {projects.map((project, index) => (
                <motion.div
                  key={`project-${index}-${project.title}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
                  role="listitem"
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl border bg-white px-4 py-3 cursor-grab active:cursor-grabbing transition-all duration-200',
                    dragOverIndex === index
                      ? 'border-accent ring-1 ring-accent/20'
                      : 'border-gray-200 hover:border-gray-300 shadow-sm'
                  )}
                >
                  {/* Drag handle */}
                  <div className="shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors duration-150">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  {/* Thumbnail */}
                  <div className="shrink-0 h-20 w-20 rounded-lg bg-surface-warm border border-border-light overflow-hidden flex items-center justify-center">
                    {project.images.length > 0 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={project.images[0]}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {project.title || 'Sans titre'}
                    </p>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {project.description}
                      </p>
                    )}
                    {project.tags.length > 0 && (
                      <div className="flex gap-1 mt-0.5 overflow-hidden">
                        {project.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-block rounded-[3px] bg-surface-warm px-1.5 py-0 text-[10px] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{project.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      type="button"
                      onClick={() => openEditProject(index)}
                      className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:text-foreground hover:bg-surface-warm transition-colors duration-150"
                      aria-label={`Modifier le projet ${project.title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(index)}
                      className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors duration-150"
                      aria-label={`Supprimer le projet ${project.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add more */}
          <button
            type="button"
            data-testid="add-project-btn"
            onClick={openNewProject}
            className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-500 transition-all duration-200 hover:border-accent hover:text-accent hover:bg-accent/5"
          >
            <Plus className="h-4 w-4" />
            Ajouter un projet
          </button>
        </>
      )}

      {/* Dialog / Modal */}
      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 backdrop-blur-sm p-4 pt-[10vh]"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setIsDialogOpen(false)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsDialogOpen(false)
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-label={
              editingIndex !== null ? 'Modifier le projet' : 'Ajouter un projet'
            }
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
              className="w-full max-w-xl rounded-[var(--radius-xl)] border border-border bg-background shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden"
            >
              {/* Dialog header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-xl font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
                  {editingIndex !== null
                    ? 'Modifier le projet'
                    : 'Nouveau projet'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:text-foreground hover:bg-surface-warm transition-colors duration-150"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Dialog body */}
              <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                <ProjectForm
                  key={editingIndex !== null ? `edit-${editingIndex}` : `new-${projects.length}`}
                  project={editingProject}
                  onChange={setEditingProject}
                />
              </div>

              {/* Dialog footer */}
              <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground hover:bg-surface-warm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!editingProject.title.trim()}
                  className={cn(
                    'rounded-[var(--radius-md)] px-5 py-2 text-sm font-semibold transition-all duration-200',
                    editingProject.title.trim()
                      ? 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98]'
                      : 'bg-surface-warm text-muted-foreground/40 cursor-not-allowed'
                  )}
                >
                  {editingIndex !== null ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
