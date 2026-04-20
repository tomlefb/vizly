'use client'

import { useState, useCallback, useId } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('editor.project')
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

  const inputBase =
    'w-full h-10 rounded-[var(--radius-md)] border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:border-foreground'
  const textareaBase =
    'w-full rounded-[var(--radius-md)] border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 resize-y min-h-[56px] focus:outline-none focus:border-foreground'

  return (
    <div className={cn('space-y-3', className)} data-testid="project-form">
      {/* Title */}
      <div>
        <label htmlFor={`${id}-title`} className="mb-1.5 block text-sm font-medium text-foreground">
          {t('titleLabel')} <span className="text-destructive">*</span>
        </label>
        <input
          id={`${id}-title`}
          data-testid="project-title"
          type="text"
          value={project.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder={t('titlePlaceholder')}
          maxLength={100}
          className={cn(inputBase, 'border-border-light')}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor={`${id}-description`} className="mb-1.5 block text-sm font-medium text-foreground">
          {t('descriptionLabel')}
        </label>
        <textarea
          id={`${id}-description`}
          data-testid="project-description"
          value={project.description ?? ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          maxLength={MAX_PROJECT_DESCRIPTION_LENGTH}
          rows={2}
          className={cn(textareaBase, 'border-border-light')}
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {descriptionLength}/{MAX_PROJECT_DESCRIPTION_LENGTH}
        </p>
      </div>

      {/* External link */}
      <div>
        <label htmlFor={`${id}-link`} className="mb-1.5 block text-sm font-medium text-foreground">
          {t('linkLabel')}
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
              try { new URL(val); setLinkError(null) } catch { setLinkError(t('linkError')) }
            } else {
              setLinkError(null)
            }
          }}
          placeholder={t('linkPlaceholder')}
          className={cn(inputBase, linkError ? 'border-destructive' : 'border-border-light')}
        />
        {linkError && (
          <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            {linkError}
          </p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label htmlFor={`${id}-tags`} className="mb-1.5 block text-sm font-medium text-foreground">
          {t('tagsLabel')}
        </label>
        <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius-md)] border border-border-light bg-surface px-3 py-2 min-h-[40px] transition-colors duration-150 focus-within:border-foreground">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-surface-sunken text-foreground rounded-[var(--radius-sm)] text-xs font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="flex h-3.5 w-3.5 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label={t('deleteTagAriaLabel', { tag })}
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
              placeholder={project.tags.length === 0 ? t('tagsPlaceholderFirst') : t('tagsPlaceholderAdd')}
              className="flex-1 min-w-[80px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{project.tags.length}/10</p>
      </div>
    </div>
  )
}
