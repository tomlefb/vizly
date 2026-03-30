'use client'

import { useState, useCallback, useId, useRef } from 'react'
import { X, Plus, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageUploader } from './ImageUploader'
import { MAX_PROJECT_DESCRIPTION_LENGTH } from '@/lib/constants'
import type { ProjectFormData } from '@/lib/validations'

interface ProjectFormProps {
  project: ProjectFormData
  onChange: (project: ProjectFormData) => void
  className?: string
}

export function ProjectForm({
  project,
  onChange,
  className,
}: ProjectFormProps) {
  const id = useId()
  const [tagInput, setTagInput] = useState('')
  const [localFiles, setLocalFiles] = useState<File[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  // Ref to always read latest project state (avoids stale closures in async upload)
  const projectRef = useRef(project)
  projectRef.current = project

  const handleFieldChange = useCallback(
    <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => {
      onChange({ ...project, [field]: value })
    },
    [project, onChange]
  )

  const handleAddTag = useCallback(
    (raw: string) => {
      const tag = raw.trim().toLowerCase()
      if (tag && !project.tags.includes(tag) && project.tags.length < 10) {
        handleFieldChange('tags', [...project.tags, tag])
      }
      setTagInput('')
    },
    [project.tags, handleFieldChange]
  )

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      handleFieldChange(
        'tags',
        project.tags.filter((t) => t !== tagToRemove)
      )
    },
    [project.tags, handleFieldChange]
  )

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddTag(tagInput)
      }
      if (e.key === 'Backspace' && tagInput === '' && project.tags.length > 0) {
        const lastTag = project.tags[project.tags.length - 1]
        if (lastTag) {
          handleRemoveTag(lastTag)
        }
      }
    },
    [tagInput, handleAddTag, handleRemoveTag, project.tags]
  )

  const handleImagesChange = useCallback(
    (files: File[]) => {
      const newFiles = files.slice(localFiles.length)
      setLocalFiles(files)

      if (newFiles.length === 0) return

      // Upload new files and add URLs to project.images
      setIsUploadingImages(true)
      void (async () => {
        const uploadedUrls: string[] = []
        for (const file of newFiles) {
          try {
            const body = new FormData()
            body.append('file', file)
            const res = await fetch('/api/upload', { method: 'POST', body })
            const result = (await res.json()) as { url?: string }
            if (result.url) {
              uploadedUrls.push(result.url)
            }
          } catch {
            // Skip failed upload
          }
          // Remove file from local preview (it's now either uploaded or failed)
          setLocalFiles((prev) => prev.filter((f) => f !== file))
        }
        if (uploadedUrls.length > 0) {
          const latest = projectRef.current
          onChange({ ...latest, images: [...latest.images, ...uploadedUrls] })
        }
        setIsUploadingImages(false)
      })()
    },
    [localFiles.length, onChange]
  )

  const handleImageRemove = useCallback(
    (index: number) => {
      const existingCount = project.images.length
      if (index < existingCount) {
        // Remove from existing URLs
        const newImages = [...project.images]
        newImages.splice(index, 1)
        handleFieldChange('images', newImages)
      } else {
        // Remove from local files
        const localIndex = index - existingCount
        const newFiles = [...localFiles]
        newFiles.splice(localIndex, 1)
        setLocalFiles(newFiles)
      }
    },
    [project.images, localFiles, handleFieldChange]
  )

  const descriptionLength = (project.description ?? '').length

  return (
    <div className={cn('space-y-5', className)} data-testid="project-form">
      {/* Title */}
      <div className="space-y-1.5">
        <label
          htmlFor={`${id}-title`}
          className="block text-sm font-medium text-foreground"
        >
          Titre du projet <span className="text-destructive">*</span>
        </label>
        <input
          id={`${id}-title`}
          data-testid="project-title"
          type="text"
          value={project.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder="Mon super projet"
          maxLength={100}
          className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors duration-150 focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label
          htmlFor={`${id}-description`}
          className="block text-sm font-medium text-foreground"
        >
          Description
        </label>
        <textarea
          id={`${id}-description`}
          data-testid="project-description"
          value={project.description ?? ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="Decris ton projet en quelques lignes..."
          maxLength={MAX_PROJECT_DESCRIPTION_LENGTH}
          rows={4}
          className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors duration-150 resize-y min-h-[100px] focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        />
        <p className="text-xs text-muted-foreground text-right">
          {descriptionLength}/{MAX_PROJECT_DESCRIPTION_LENGTH}
        </p>
      </div>

      {/* Images */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">
          Images
          {isUploadingImages && (
            <span className="ml-2 text-xs text-muted-foreground animate-pulse">
              Upload en cours...
            </span>
          )}
        </p>
        <ImageUploader
          images={localFiles}
          existingUrls={project.images}
          onImagesChange={handleImagesChange}
          onImageRemove={handleImageRemove}
        />
      </div>

      {/* External link */}
      <div className="space-y-1.5">
        <label
          htmlFor={`${id}-link`}
          className="block text-sm font-medium text-foreground"
        >
          Lien externe
        </label>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            id={`${id}-link`}
            type="url"
            value={project.external_link ?? ''}
            onChange={(e) => handleFieldChange('external_link', e.target.value || '')}
            placeholder="https://github.com/..."
            className="w-full rounded-[var(--radius-md)] border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors duration-150 focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label
          htmlFor={`${id}-tags`}
          className="block text-sm font-medium text-foreground"
        >
          Technologies / Tags
        </label>
        <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 min-h-[42px] transition-colors duration-150 focus-within:border-accent">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-surface-warm px-2 py-0.5 text-xs font-medium text-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors duration-100"
                aria-label={`Supprimer le tag ${tag}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          {project.tags.length < 10 && (
            <input
              id={`${id}-tags`}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={project.tags.length === 0 ? 'Ajoute un tag et appuie sur Entree' : 'Ajouter...'}
              className="flex-1 min-w-[100px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Appuie sur Entree pour ajouter
          </p>
          <p className="text-xs text-muted-foreground">
            {project.tags.length}/10 tags
          </p>
        </div>
      </div>
    </div>
  )
}
