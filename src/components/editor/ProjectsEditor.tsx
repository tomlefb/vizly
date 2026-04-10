'use client'

import { useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Pencil, Trash2, ImageIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
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
        <h2 className="text-[18px] font-semibold leading-7 text-[#111827]">Projets</h2>
        <button type="button" onClick={openAddProject} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#E8553D] hover:text-[#D4442E] transition-colors">
          <Plus className="h-4 w-4" /> Ajouter
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
                ) : (<ImageIcon className="h-3.5 w-3.5 text-[#D1D5DB]" />)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111827] truncate">{project.title || 'Sans titre'}</p>
                {project.description && <p className="text-[13px] text-[#6B7280] truncate">{project.description}</p>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => openEditProject(index)} className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors" aria-label="Modifier"><Pencil className="h-3 w-3" /></button>
                <button type="button" onClick={() => deleteProject(index)} className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#DC2626] hover:bg-[#F3F4F6] transition-colors" aria-label="Supprimer"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} onKeyDown={() => {}} role="presentation" />
          <div className="relative w-full max-w-[560px] max-h-[85vh] flex flex-col bg-white rounded-xl overflow-hidden mx-4">
            <div className="flex-1 overflow-y-auto p-8 space-y-5">
              <button type="button" onClick={closeModal} className="absolute top-4 right-4 z-10 flex h-7 w-7 items-center justify-center rounded-[6px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
              <h3 className="text-[18px] font-semibold text-[#111827]">{editingIndex >= 0 ? 'Modifier le projet' : 'Nouveau projet'}</h3>
              <ProjectForm project={editingProject} onChange={setEditingProject} />
              <div>
                <p className="text-sm text-[#6B7280] mb-1.5">Images</p>
                <ImageUploader images={localFiles} existingUrls={editingProject.images} isUploading={isUploadingImages} onImagesChange={handleImagesChange} onImageRemove={handleImageRemove} />
              </div>
            </div>
            <div className="shrink-0 px-8 py-4 bg-white border-t border-[#E5E7EB] flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors">Annuler</button>
              <button type="button" onClick={saveProject} disabled={!editingProject.title.trim()} className={cn('h-10 rounded-lg px-5 text-sm font-medium transition-colors duration-150', !editingProject.title.trim() ? 'bg-[#E8553D]/50 text-white/60 cursor-not-allowed' : 'bg-[#E8553D] text-white hover:bg-[#D4442E]')}>
                {editingIndex >= 0 ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
