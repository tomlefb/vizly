'use client'

import { useState, useCallback } from 'react'
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  X,
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
      const updated = [...projects]
      updated[editingIndex] = editingProject
      onProjectsChange(updated)
    } else {
      onProjectsChange([...projects, editingProject])
    }
    setIsDialogOpen(false)
    setEditingIndex(null)
  }, [editingIndex, editingProject, projects, onProjectsChange])

  const handleDelete = useCallback(
    (index: number) => {
      const updated = projects.filter((_, i) => i !== index)
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
    <div className={cn('space-y-8', className)} data-testid="step-projects">
      {/* Page title */}
      <div>
        <h1 className="text-[32px] font-semibold leading-tight text-foreground font-[family-name:var(--font-satoshi)]">
          Tes projets
        </h1>
        <p className="text-[15px] text-muted mt-2">
          Le coeur de ton portfolio
        </p>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface-warm px-8 py-20 text-center"
        >
          {/* SVG illustration — rounded rect with + */}
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-6" aria-hidden="true">
            <rect x="8" y="8" width="64" height="64" rx="16" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="4 3" opacity="0.4" />
            <rect x="16" y="16" width="48" height="48" rx="12" fill="var(--color-accent-light)" />
            <path d="M40 28v24M28 40h24" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <h3 className="text-[20px] font-medium text-foreground font-[family-name:var(--font-satoshi)]">
            Montre ce que tu sais faire
          </h3>
          <p className="text-[15px] text-muted mt-2 max-w-[340px]">
            Projet perso, mission freelance, memoire, site pour un ami — tout compte.
          </p>
          <button
            type="button"
            data-testid="add-project-btn"
            onClick={openNewProject}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-10 py-4 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-[0.98] shadow-[0_2px_8px_rgba(212,99,78,0.2)]"
          >
            <Plus className="h-5 w-5" />
            Ajouter un projet
          </button>
        </motion.div>
      )}

      {/* Project grid */}
      {projects.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="project-list" role="list">
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
                    'group relative flex gap-3 rounded-2xl border bg-surface-warm p-4 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]',
                    dragOverIndex === index
                      ? 'border-accent ring-1 ring-accent/20'
                      : 'border-border hover:border-border'
                  )}
                >
                  {/* Drag handle */}
                  <div className="shrink-0 pt-1 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors duration-150">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Thumbnail */}
                  <div className="shrink-0 h-20 w-20 rounded-[var(--radius-md)] bg-white border border-border overflow-hidden flex items-center justify-center">
                    {project.images.length > 0 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={project.images[0]}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground/20" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-foreground truncate">
                      {project.title || 'Sans titre'}
                    </p>
                    {project.description && (
                      <p className="text-[13px] text-muted line-clamp-2 mt-0.5">
                        {project.description}
                      </p>
                    )}
                    {project.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 overflow-hidden">
                        {project.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-block rounded-full bg-white border border-border px-2 py-0.5 text-[11px] text-muted font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span className="text-[11px] text-muted-foreground">
                            +{project.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions — hover only, top right */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      type="button"
                      onClick={() => openEditProject(index)}
                      className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-white border border-border text-muted hover:text-foreground hover:border-foreground/20 transition-colors duration-150 shadow-sm"
                      aria-label={`Modifier le projet ${project.title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(index)}
                      className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-white border border-border text-muted hover:text-destructive hover:border-destructive/20 transition-colors duration-150 shadow-sm"
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
            className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-accent/30 rounded-2xl py-4 text-[15px] font-medium text-accent transition-all duration-200 hover:border-accent hover:bg-accent-light"
          >
            <Plus className="h-5 w-5" />
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
              className="w-full max-w-xl rounded-[20px] border border-border bg-background shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden"
            >
              {/* Dialog header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="text-[20px] font-medium text-foreground font-[family-name:var(--font-satoshi)]">
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
                  className="rounded-[var(--radius-md)] px-4 py-2.5 text-[13px] font-medium text-muted transition-colors duration-150 hover:text-foreground hover:bg-surface-warm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!editingProject.title.trim()}
                  className={cn(
                    'rounded-[var(--radius-md)] px-6 py-2.5 text-[13px] font-semibold transition-all duration-200',
                    editingProject.title.trim()
                      ? 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98]'
                      : 'bg-accent/50 text-white/60 cursor-not-allowed'
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
