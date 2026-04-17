'use client'

import { useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Pencil, Trash2, ImageIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VzBtn } from '@/components/ui/vizly'
import { ProjectForm } from './ProjectForm'
import { ImageUploader } from './ImageUploader'
import type { ProjectFormData } from '@/lib/validations'

const EMPTY_PROJECT: ProjectFormData = {
  title: '', description: '', images: [], external_link: '', tags: [], display_order: 0,
}

interface ProjectsEditorProps {
  projects: ProjectFormData[]
  onProjectsChange: (projects: ProjectFormData[]) => void
}

export function ProjectsEditor({ projects, onProjectsChange }: ProjectsEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState(-1)
  const [editingProject, setEditingProject] = useState<ProjectFormData>({ ...EMPTY_PROJECT })
  const [localFiles, setLocalFiles] = useState<File[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const editingProjectRef = useRef(editingProject)
  editingProjectRef.current = editingProject

  const closeModal = useCallback(() => {
    setIsOpen(false); setEditingIndex(-1); setLocalFiles([]); setIsUploadingImages(false)
  }, [])

  const openAddProject = useCallback(() => {
    setEditingProject({ ...EMPTY_PROJECT, display_order: projects.length }); setLocalFiles([]); setEditingIndex(-1); setIsOpen(true)
  }, [projects.length])

  const openEditProject = useCallback((index: number) => {
    const p = projects[index]; if (!p) return
    setEditingProject({ ...p }); setLocalFiles([]); setEditingIndex(index); setIsOpen(true)
  }, [projects])

  const handleImagesChange = useCallback((files: File[]) => {
    const newFiles = files.slice(localFiles.length); setLocalFiles(files)
    if (newFiles.length === 0) return
    setIsUploadingImages(true)
    void (async () => {
      const uploadedUrls: string[] = []; const uploadedFiles: File[] = []
      for (const file of newFiles) {
        try {
          const body = new FormData(); body.append('file', file)
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
  }, [localFiles.length])

  const handleImageRemove = useCallback((index: number) => {
    const existingCount = editingProject.images.length
    if (index < existingCount) {
      const imgs = [...editingProject.images]; imgs.splice(index, 1)
      setEditingProject((prev) => ({ ...prev, images: imgs }))
    } else {
      setLocalFiles((prev) => { const c = [...prev]; c.splice(index - existingCount, 1); return c })
    }
  }, [editingProject.images])

  const saveProject = useCallback(() => {
    if (!editingProject.title.trim()) return
    if (editingIndex >= 0) { const u = [...projects]; u[editingIndex] = editingProject; onProjectsChange(u) }
    else { onProjectsChange([...projects, editingProject]) }
    closeModal()
  }, [editingIndex, editingProject, projects, onProjectsChange, closeModal])

  const deleteProject = useCallback((i: number) => {
    onProjectsChange(projects.filter((_, j) => j !== i).map((p, j) => ({ ...p, display_order: j })))
  }, [projects, onProjectsChange])

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">Projets</h3>
        <button type="button" onClick={openAddProject} className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-muted transition-colors">
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      </div>
      {projects.length === 0 ? (
        <p className="py-8 text-sm text-muted-foreground">Aucun projet</p>
      ) : (
        <div className="space-y-2">
          {projects.map((project, index) => (
            <div key={`p-${index}-${project.title}`} className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-border-light bg-surface p-3 transition-colors duration-150 hover:border-border">
              <div className="shrink-0 h-10 w-10 rounded-[var(--radius-sm)] bg-surface-warm border border-border-light overflow-hidden flex items-center justify-center">
                {project.images.length > 0 ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={project.images[0]} alt="" className="h-full w-full object-cover" />
                ) : (<ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{project.title || 'Sans titre'}</p>
                {project.description && <p className="text-xs text-muted truncate">{project.description}</p>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => openEditProject(index)} className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-foreground hover:bg-surface-warm transition-colors" aria-label="Modifier"><Pencil className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => deleteProject(index)} className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-destructive hover:bg-destructive/5 transition-colors" aria-label="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/30" onClick={closeModal} onKeyDown={() => {}} role="presentation" />
          <div className="relative w-full max-w-[560px] max-h-[85vh] flex flex-col bg-surface rounded-[var(--radius-lg)] border border-border-light overflow-hidden mx-4">
            <div className="flex-1 overflow-y-auto p-8 space-y-5">
              <button type="button" onClick={closeModal} className="absolute top-4 right-4 z-10 flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-foreground hover:bg-surface-warm transition-colors" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
              <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">{editingIndex >= 0 ? 'Modifier le projet' : 'Nouveau projet'}</h3>
              <ProjectForm project={editingProject} onChange={setEditingProject} />
              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">Images</p>
                <ImageUploader images={localFiles} existingUrls={editingProject.images} isUploading={isUploadingImages} onImagesChange={handleImagesChange} onImageRemove={handleImageRemove} />
              </div>
            </div>
            <div className="shrink-0 px-8 py-4 bg-surface border-t border-border-light flex items-center justify-end gap-3">
              <VzBtn variant="ghost" size="sm" onClick={closeModal}>Annuler</VzBtn>
              <VzBtn
                variant="primary"
                onClick={saveProject}
                disabled={!editingProject.title.trim()}
              >
                {editingIndex >= 0 ? 'Enregistrer' : 'Ajouter'}
              </VzBtn>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
