'use client'

import { useState, useCallback, useId } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  const [linkError, setLinkError] = useState<string | null>(null)

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

  const descriptionLength = (project.description ?? '').length

  return (
    <div className={cn('space-y-3', className)} data-testid="project-form">
      {/* Title */}
      <div>
        <label htmlFor={`${id}-title`} className="block text-sm text-[#6B7280] mb-1.5">
          Titre du projet <span className="text-[#DC2626]">*</span>
        </label>
        <input
          id={`${id}-title`}
          data-testid="project-title"
          type="text"
          value={project.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder="Mon super projet"
          maxLength={100}
          className="w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor={`${id}-description`} className="block text-sm text-[#6B7280] mb-1.5">
          Description
        </label>
        <textarea
          id={`${id}-description`}
          data-testid="project-description"
          value={project.description ?? ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="Decris ton projet en quelques lignes..."
          maxLength={MAX_PROJECT_DESCRIPTION_LENGTH}
          rows={2}
          className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 resize-y min-h-[56px] focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
        />
        <p className="text-[13px] text-[#9CA3AF] text-right mt-1">
          {descriptionLength}/{MAX_PROJECT_DESCRIPTION_LENGTH}
        </p>
      </div>

      {/* External link */}
      <div>
        <label htmlFor={`${id}-link`} className="block text-sm text-[#6B7280] mb-1.5">
          Lien externe
        </label>
        <input
          id={`${id}-link`}
          type="url"
          value={project.external_link ?? ''}
          onChange={(e) => {
            handleFieldChange('external_link', e.target.value || '')
            if (linkError) setLinkError(null)
          }}
          onBlur={() => {
            const val = project.external_link ?? ''
            if (val.trim()) {
              try { new URL(val) ; setLinkError(null) } catch { setLinkError('URL invalide (doit commencer par https://)') }
            } else {
              setLinkError(null)
            }
          }}
          placeholder="https://github.com/..."
          className={cn(
            'w-full h-10 rounded-lg border bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]',
            linkError ? 'border-[#DC2626]' : 'border-[#E5E7EB]'
          )}
        />
        {linkError && (
          <p className="text-[13px] text-[#DC2626] mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {linkError}
          </p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label htmlFor={`${id}-tags`} className="block text-sm text-[#6B7280] mb-1.5">
          Technologies / Tags
        </label>
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 min-h-[40px] transition-[border-color] duration-150 focus-within:border-[#D1D5DB] focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-[#F3F4F6] text-[#111827] rounded-[6px] text-[13px]"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="flex h-3.5 w-3.5 items-center justify-center text-[#9CA3AF] hover:text-[#111827] transition-colors"
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
              placeholder={project.tags.length === 0 ? 'React, TypeScript...' : 'Ajouter...'}
              className="flex-1 min-w-[80px] bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none"
            />
          )}
        </div>
        <p className="text-[13px] text-[#9CA3AF] mt-1">{project.tags.length}/10</p>
      </div>
    </div>
  )
}
