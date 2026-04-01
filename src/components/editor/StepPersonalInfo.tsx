'use client'

import { useCallback, useId, useRef, useState } from 'react'
import {
  User,
  Mail,
  Camera,
  Globe,
  Link2,
  Code2,
  Pen,
  Image,
  AtSign,
  Hash,
  X,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAX_BIO_LENGTH, SOCIAL_PLATFORMS } from '@/lib/constants'
import type { PortfolioFormData } from '@/lib/validations'

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  linkedin: Link2,
  github: Code2,
  dribbble: Pen,
  instagram: Image,
  twitter: AtSign,
  website: Globe,
} as const

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
  if (!str) return true // empty is ok
  try { new URL(str); return true } catch { return false }
}

function isValidEmail(str: string): boolean {
  if (!str) return true // empty is ok
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)
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

  const validateEmailOnBlur = useCallback((value: string) => {
    if (value && !isValidEmail(value)) {
      setFieldError('contact_email', 'Email invalide')
    } else {
      setFieldError('contact_email', null)
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

  return (
    <div
      className={cn('space-y-8', className)}
      data-testid="step-personal-info"
    >
      {/* Page title */}
      <div>
        <h1 className="text-[32px] font-semibold leading-tight text-foreground font-[family-name:var(--font-satoshi)]">
          Ton profil
        </h1>
        <p className="text-[15px] text-muted mt-2">
          Les informations de base de ton portfolio
        </p>
      </div>

      {/* ── Asymmetric grid: Identity (7 cols) | Contact (5 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* LEFT — Identity card (larger, hero card) */}
        <section className="lg:col-span-7 bg-surface-warm border border-border rounded-[var(--radius-lg)] p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
              <User className="h-4 w-4 text-accent" />
            </div>
            <h2 className="text-[20px] font-medium text-foreground font-[family-name:var(--font-satoshi)]">
              Identite
            </h2>
          </div>

          {/* Photo + Name row */}
          <div className="flex items-start gap-5">
            {/* Photo upload */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="group relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border-2 border-dashed border-border bg-white transition-all duration-200 hover:border-accent/50"
                aria-label="Choisir une photo de profil"
              >
                {photoPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Photo de profil"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-200">
                      <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </>
                ) : (
                  <Camera className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors duration-200" />
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
              <p className="text-xs text-muted-foreground text-center mt-1.5">Photo</p>
            </div>

            {/* Name field */}
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor={`${id}-title`}
                className="block text-[13px] font-medium text-muted"
              >
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
                className={cn(
                  'w-full rounded-[var(--radius-md)] border bg-white px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
                  errors['title']
                    ? 'border-destructive focus:ring-destructive/20 focus:border-destructive'
                    : 'border-border'
                )}
                aria-invalid={!!errors['title']}
                aria-describedby={errors['title'] ? `${id}-title-error` : undefined}
              />
              {errors['title'] && (
                <p id={`${id}-title-error`} className="text-xs text-destructive" role="alert">
                  {errors['title']}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label
              htmlFor={`${id}-bio`}
              className="block text-[13px] font-medium text-muted"
            >
              Bio
            </label>
            <textarea
              id={`${id}-bio`}
              data-testid="input-bio"
              value={data.bio ?? ''}
              onChange={(e) => onChange('bio', e.target.value)}
              placeholder="Parle de toi en quelques lignes... Ce que tu fais, ce qui te passionne, ce que tu cherches."
              maxLength={MAX_BIO_LENGTH}
              rows={4}
              className={cn(
                'w-full rounded-[var(--radius-md)] border bg-white px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground transition-colors duration-150 resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
                errors['bio']
                  ? 'border-destructive focus:ring-destructive/20 focus:border-destructive'
                  : 'border-border'
              )}
              aria-invalid={!!errors['bio']}
              aria-describedby={`${id}-bio-count`}
            />
            <div className="flex items-center justify-between">
              {errors['bio'] ? (
                <p className="text-xs text-destructive" role="alert">
                  {errors['bio']}
                </p>
              ) : (
                <span />
              )}
              <p
                id={`${id}-bio-count`}
                className={cn(
                  'text-xs',
                  bioLength > MAX_BIO_LENGTH * 0.9
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                )}
              >
                {bioLength}/{MAX_BIO_LENGTH}
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT — Contact card (smaller, secondary) */}
        <section className="lg:col-span-5 bg-surface-warm border border-border rounded-[var(--radius-lg)] p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
              <Mail className="h-4 w-4 text-accent" />
            </div>
            <h2 className="text-[20px] font-medium text-foreground font-[family-name:var(--font-satoshi)]">
              Contact
            </h2>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`${id}-email`}
              className="block text-[13px] font-medium text-muted"
            >
              Email de contact
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                id={`${id}-email`}
                data-testid="input-contact-email"
                type="email"
                value={data.contact_email ?? ''}
                onChange={(e) => {
                  onChange('contact_email', e.target.value)
                  if (fieldErrors['contact_email']) setFieldError('contact_email', null)
                }}
                onBlur={() => validateEmailOnBlur(data.contact_email ?? '')}
                placeholder="contact@example.com"
                className={cn(
                  'w-full rounded-[var(--radius-md)] border bg-white pl-10 pr-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
                  (errors['contact_email'] || fieldErrors['contact_email'])
                    ? 'border-destructive focus:ring-destructive/20 focus:border-destructive'
                    : 'border-border'
                )}
                aria-invalid={!!(errors['contact_email'] || fieldErrors['contact_email'])}
                aria-describedby={(errors['contact_email'] || fieldErrors['contact_email']) ? `${id}-email-error` : undefined}
              />
            </div>
            {(errors['contact_email'] || fieldErrors['contact_email']) && (
              <p id={`${id}-email-error`} className="text-xs text-destructive" role="alert">
                {errors['contact_email'] || fieldErrors['contact_email']}
              </p>
            )}
          </div>

          {/* Hint text to fill the visual space */}
          <div className="rounded-[var(--radius-md)] bg-white/60 border border-border/50 px-4 py-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cet email sera visible sur ton portfolio pour que tes visiteurs puissent te contacter directement.
            </p>
          </div>
        </section>
      </div>

      {/* ── Social links — full width ── */}
      <section className="bg-surface-warm border border-border rounded-[var(--radius-lg)] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
            <Globe className="h-4 w-4 text-accent" />
          </div>
          <h2 className="text-[20px] font-medium text-foreground font-[family-name:var(--font-satoshi)]">
            Reseaux sociaux
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIAL_PLATFORMS.map((platform) => {
            const Icon = SOCIAL_ICONS[platform] ?? Globe
            const label = SOCIAL_LABELS[platform] ?? platform
            const placeholder = SOCIAL_PLACEHOLDERS[platform] ?? 'https://...'
            const currentValue = data.social_links?.[platform] ?? ''

            const fieldKey = `social_${platform}`
            const error = fieldErrors[fieldKey]

            return (
              <div key={platform} className="space-y-1.5">
                <label
                  htmlFor={`${id}-social-${platform}`}
                  className="block text-[13px] font-medium text-muted"
                >
                  {label}
                </label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
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
                    className={cn(
                      'w-full rounded-[var(--radius-md)] border bg-white pl-10 pr-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
                      error
                        ? 'border-destructive focus:ring-destructive/20 focus:border-destructive'
                        : 'border-border'
                    )}
                  />
                </div>
                {error && (
                  <p className="text-[11px] text-destructive">{error}</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Skills ── */}
      <SkillsInput
        skills={data.skills ?? []}
        onChange={(skills) => onChange('skills', skills)}
      />
    </div>
  )
}

// ------------------------------------------------------------------
// Skills input sub-component
// ------------------------------------------------------------------

function SkillsInput({
  skills,
  onChange,
}: {
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
    <section className="bg-surface-warm border border-border rounded-[var(--radius-lg)] p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <h2 className="text-[20px] font-medium text-foreground font-[family-name:var(--font-satoshi)]">
          Competences
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius-md)] border border-border bg-white px-4 py-3 min-h-[42px] transition-colors duration-150 focus-within:ring-2 focus-within:ring-accent/15 focus-within:border-accent">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-full bg-accent-light text-foreground px-3 py-1 text-[13px] font-medium"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-accent/20 transition-colors"
              aria-label={`Supprimer ${skill}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        {skills.length < 30 && (
          <input
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
            className="flex-1 min-w-[120px] bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground outline-none"
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Appuie sur Entree pour ajouter</span>
        <span>{skills.length}/30</span>
      </div>
    </section>
  )
}
