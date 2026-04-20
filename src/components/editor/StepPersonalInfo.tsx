'use client'

import { useCallback, useId, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAX_BIO_LENGTH, SOCIAL_PLATFORMS } from '@/lib/constants'
import type { PortfolioFormData } from '@/lib/validations'

const SOCIAL_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  dribbble: 'Dribbble',
  instagram: 'Instagram',
  twitter: 'Twitter / X',
  website: 'Site web',
} as const

const SOCIAL_PLACEHOLDERS: Record<string, string> = {
  linkedin: 'https://linkedin.com/in/...',
  github: 'https://github.com/...',
  dribbble: 'https://dribbble.com/...',
  instagram: 'https://instagram.com/...',
  twitter: 'https://x.com/...',
  website: 'https://...',
} as const

function isValidUrl(str: string): boolean {
  if (!str) return true
  try { new URL(str); return true } catch { return false }
}

interface StepPersonalInfoProps {
  data: PortfolioFormData
  onChange: (field: string, value: unknown) => void
  errors?: Record<string, string>
  className?: string
}

export function StepPersonalInfo({
  data,
  onChange,
  errors = {},
  className,
}: StepPersonalInfoProps) {
  const id = useId()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    data.photo_url ?? null
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const setFieldError = useCallback((field: string, error: string | null) => {
    setFieldErrors((prev) => {
      if (error) return { ...prev, [field]: error }
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const validateUrlOnBlur = useCallback((field: string, value: string) => {
    if (value && !isValidUrl(value)) {
      setFieldError(field, 'URL invalide (doit commencer par https://)')
    } else {
      setFieldError(field, null)
    }
  }, [setFieldError])

  const handlePhotoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        const previewUrl = URL.createObjectURL(file)
        setPhotoPreview(previewUrl)
        onChange('photo_url', previewUrl)
      }
    },
    [onChange]
  )

  const handleSocialChange = useCallback(
    (platform: string, value: string) => {
      const current = data.social_links ?? {}
      onChange('social_links', { ...current, [platform]: value })
    },
    [data.social_links, onChange]
  )

  const bioLength = (data.bio ?? '').length

  const inputBase =
    'w-full h-10 rounded-[var(--radius-md)] border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:border-foreground focus-visible:border-foreground'
  const textareaBase =
    'w-full rounded-[var(--radius-md)] border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 resize-y min-h-[72px] focus:outline-none focus:border-foreground focus-visible:border-foreground'

  return (
    <div
      className={cn(className)}
      data-testid="step-personal-info"
    >
      {/* Split layout */}
      <div className="flex flex-col lg:flex-row lg:gap-12">

        {/* ── Left: Identité + Contact ── */}
        <div className="flex-1 space-y-8">

          {/* Identité */}
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
                Identité
              </h3>
              <p className="text-sm text-muted mt-1">
                Les infos principales de ton portfolio
              </p>
            </div>

            {/* Photo + Name */}
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-dashed border-border bg-surface-warm transition-colors duration-150 hover:border-muted-foreground"
                  aria-label="Choisir une photo de profil"
                >
                  {photoPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoPreview} alt="Photo de profil" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-150">
                        <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                      </div>
                    </>
                  ) : (
                    <Camera className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="sr-only"
                  aria-hidden="true"
                  tabIndex={-1}
                />
              </div>
              <div className="flex-1 pt-5">
                <label htmlFor={`${id}-title`} className="mb-1.5 block text-sm font-medium text-foreground">
                  Nom complet <span className="text-destructive">*</span>
                </label>
                <input
                  id={`${id}-title`}
                  data-testid="input-title"
                  type="text"
                  value={data.title}
                  onChange={(e) => onChange('title', e.target.value)}
                  placeholder="Tom Lefebvre"
                  maxLength={100}
                  className={cn(inputBase, errors['title'] ? 'border-destructive' : 'border-border-light')}
                  aria-invalid={!!errors['title']}
                  aria-describedby={errors['title'] ? `${id}-title-error` : undefined}
                />
                {errors['title'] && (
                  <p id={`${id}-title-error`} className="mt-1 text-xs text-destructive" role="alert">
                    {errors['title']}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor={`${id}-bio`} className="mb-1.5 block text-sm font-medium text-foreground">
                Bio
              </label>
              <textarea
                id={`${id}-bio`}
                data-testid="input-bio"
                value={data.bio ?? ''}
                onChange={(e) => onChange('bio', e.target.value)}
                placeholder="Parle de toi en quelques lignes..."
                maxLength={MAX_BIO_LENGTH}
                rows={3}
                className={cn(textareaBase, errors['bio'] ? 'border-destructive' : 'border-border-light')}
                aria-invalid={!!errors['bio']}
                aria-describedby={`${id}-bio-count`}
              />
              <p
                id={`${id}-bio-count`}
                className={cn(
                  'mt-1 text-right text-xs',
                  bioLength > MAX_BIO_LENGTH * 0.9 ? 'text-destructive' : 'text-muted-foreground'
                )}
              >
                {bioLength}/{MAX_BIO_LENGTH}
              </p>
            </div>
          </section>

        </div>

        {/* ── Right: Compétences + Réseaux sociaux ── */}
        <div className="flex-1 space-y-8 mt-8 lg:mt-0">

          {/* Compétences */}
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
                Compétences
              </h3>
              <p className="text-sm text-muted mt-1">
                Tes skills et technologies
              </p>
            </div>

            <SkillsInput
              id={id}
              skills={data.skills ?? []}
              onChange={(skills) => onChange('skills', skills)}
            />
          </section>

          <div className="border-b border-border-light" />

          {/* Réseaux sociaux */}
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
                Réseaux sociaux
              </h3>
              <p className="text-sm text-muted mt-1">
                Tes liens pour être retrouvé
              </p>
            </div>

            <div className="grid gap-4 grid-cols-2">
              {SOCIAL_PLATFORMS.map((platform) => {
                const label = SOCIAL_LABELS[platform] ?? platform
                const placeholder = SOCIAL_PLACEHOLDERS[platform] ?? 'https://...'
                const currentValue = data.social_links?.[platform] ?? ''
                const fieldKey = `social_${platform}`
                const error = fieldErrors[fieldKey]

                return (
                  <div key={platform}>
                    <label htmlFor={`${id}-social-${platform}`} className="mb-1.5 block text-sm font-medium text-foreground">
                      {label}
                    </label>
                    <input
                      id={`${id}-social-${platform}`}
                      data-testid={`input-social-${platform}`}
                      type="url"
                      value={currentValue}
                      onChange={(e) => {
                        handleSocialChange(platform, e.target.value)
                        if (error) setFieldError(fieldKey, null)
                      }}
                      onBlur={() => validateUrlOnBlur(fieldKey, currentValue)}
                      placeholder={placeholder}
                      className={cn(inputBase, error ? 'border-destructive' : 'border-border-light')}
                    />
                    {error && (
                      <p className="mt-1 text-xs text-destructive">{error}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Skills input sub-component
// ------------------------------------------------------------------

function SkillsInput({
  id,
  skills,
  onChange,
}: {
  id: string
  skills: string[]
  onChange: (skills: string[]) => void
}) {
  const [input, setInput] = useState('')

  const addSkill = useCallback(
    (raw: string) => {
      const skill = raw.trim()
      if (skill && !skills.includes(skill) && skills.length < 30) {
        onChange([...skills, skill])
      }
      setInput('')
    },
    [skills, onChange]
  )

  const removeSkill = useCallback(
    (toRemove: string) => {
      onChange(skills.filter((s) => s !== toRemove))
    },
    [skills, onChange]
  )

  return (
    <div>
      <label htmlFor={`${id}-skills`} className="mb-1.5 block text-sm font-medium text-foreground">
        Ajoute tes compétences
      </label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius-md)] border border-border-light bg-surface px-3 py-2 min-h-[40px] transition-colors duration-150 focus-within:border-foreground">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-surface-sunken text-foreground rounded-[var(--radius-sm)] text-xs font-medium"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="flex h-3.5 w-3.5 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Supprimer ${skill}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        {skills.length < 30 && (
          <input
            id={`${id}-skills`}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSkill(input)
              }
              if (e.key === 'Backspace' && input === '' && skills.length > 0) {
                const last = skills[skills.length - 1]
                if (last) removeSkill(last)
              }
            }}
            placeholder={skills.length === 0 ? 'React, Figma, TypeScript...' : 'Ajouter...'}
            className="flex-1 min-w-[100px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>Appuie sur Entrée pour ajouter</span>
        <span>{skills.length}/30</span>
      </div>
    </div>
  )
}
