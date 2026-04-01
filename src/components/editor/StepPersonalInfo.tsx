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

// Brand colors for social icons
const SOCIAL_COLORS: Record<string, string> = {
  linkedin: 'text-[#0A66C2]',
  github: 'text-[#181717]',
  dribbble: 'text-[#EA4C89]',
  instagram: 'text-[#E4405F]',
  twitter: 'text-[#1DA1F2]',
  website: 'text-muted-foreground',
} as const

// Pastel icon backgrounds per section
const SECTION_STYLES = {
  identity: { bg: 'bg-blue-50', text: 'text-blue-600' },
  contact: { bg: 'bg-amber-50', text: 'text-amber-600' },
  social: { bg: 'bg-violet-50', text: 'text-violet-600' },
  skills: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
}

function isValidUrl(str: string): boolean {
  if (!str) return true
  try { new URL(str); return true } catch { return false }
}

function isValidEmail(str: string): boolean {
  if (!str) return true
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
      className={cn('space-y-4', className)}
      data-testid="step-personal-info"
    >
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
          Ton profil
        </h1>
        <p className="text-[13px] text-muted mt-1">
          Les informations de base de ton portfolio
        </p>
      </div>

      {/* ── Row 1: Identity (~60%) | Contact (~40%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Identity card */}
        <section className="lg:col-span-7 bg-white border border-border/60 rounded-[var(--radius-lg)] p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]', SECTION_STYLES.identity.bg)}>
              <User className={cn('h-3.5 w-3.5', SECTION_STYLES.identity.text)} />
            </div>
            <h2 className="text-base font-medium text-foreground font-[family-name:var(--font-satoshi)]">
              Identite
            </h2>
          </div>

          {/* Photo + Name row */}
          <div className="flex items-start gap-4">
            {/* Photo — circle 80px */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-surface-warm transition-all duration-200 hover:border-accent/50"
                aria-label="Choisir une photo de profil"
              >
                {photoPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Photo de profil" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-200">
                      <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </>
                ) : (
                  <Camera className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors duration-200" />
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

            {/* Name + Bio */}
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <label htmlFor={`${id}-title`} className="block text-[12px] font-medium text-muted">
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
                    'w-full rounded-[var(--radius-md)] border bg-surface-warm px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
                    errors['title'] ? 'border-destructive focus:ring-destructive/20 focus:border-destructive' : 'border-border'
                  )}
                  aria-invalid={!!errors['title']}
                  aria-describedby={errors['title'] ? `${id}-title-error` : undefined}
                />
                {errors['title'] && (
                  <p id={`${id}-title-error`} className="text-[11px] text-destructive" role="alert">
                    {errors['title']}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor={`${id}-bio`} className="block text-[12px] font-medium text-muted">
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
                  className={cn(
                    'w-full rounded-[var(--radius-md)] border bg-surface-warm px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 resize-y min-h-[72px] focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
                    errors['bio'] ? 'border-destructive focus:ring-destructive/20 focus:border-destructive' : 'border-border'
                  )}
                  aria-invalid={!!errors['bio']}
                  aria-describedby={`${id}-bio-count`}
                />
                <p
                  id={`${id}-bio-count`}
                  className={cn(
                    'text-[10px] text-right',
                    bioLength > MAX_BIO_LENGTH * 0.9 ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {bioLength}/{MAX_BIO_LENGTH}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact card */}
        <section className="lg:col-span-5 bg-white border border-border/60 rounded-[var(--radius-lg)] p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]', SECTION_STYLES.contact.bg)}>
              <Mail className={cn('h-3.5 w-3.5', SECTION_STYLES.contact.text)} />
            </div>
            <h2 className="text-base font-medium text-foreground font-[family-name:var(--font-satoshi)]">
              Contact
            </h2>
          </div>

          <div className="space-y-1">
            <label htmlFor={`${id}-email`} className="block text-[12px] font-medium text-muted">
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
                  'w-full rounded-[var(--radius-md)] border bg-surface-warm pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
                  (errors['contact_email'] || fieldErrors['contact_email'])
                    ? 'border-destructive focus:ring-destructive/20 focus:border-destructive'
                    : 'border-border'
                )}
                aria-invalid={!!(errors['contact_email'] || fieldErrors['contact_email'])}
                aria-describedby={(errors['contact_email'] || fieldErrors['contact_email']) ? `${id}-email-error` : undefined}
              />
            </div>
            {(errors['contact_email'] || fieldErrors['contact_email']) && (
              <p id={`${id}-email-error`} className="text-[11px] text-destructive" role="alert">
                {errors['contact_email'] || fieldErrors['contact_email']}
              </p>
            )}
          </div>

          <div className="rounded-[var(--radius-sm)] bg-surface-warm border border-border/40 px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Cet email sera visible sur ton portfolio pour que tes visiteurs puissent te contacter.
            </p>
          </div>
        </section>
      </div>

      {/* ── Row 2: Social links (~50%) | Skills (~50%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Social links */}
        <section className="bg-white border border-border/60 rounded-[var(--radius-lg)] p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]', SECTION_STYLES.social.bg)}>
              <Globe className={cn('h-3.5 w-3.5', SECTION_STYLES.social.text)} />
            </div>
            <h2 className="text-base font-medium text-foreground font-[family-name:var(--font-satoshi)]">
              Reseaux sociaux
            </h2>
          </div>

          <div className="grid gap-2.5 grid-cols-2">
            {SOCIAL_PLATFORMS.map((platform) => {
              const Icon = SOCIAL_ICONS[platform] ?? Globe
              const label = SOCIAL_LABELS[platform] ?? platform
              const placeholder = SOCIAL_PLACEHOLDERS[platform] ?? 'https://...'
              const brandColor = SOCIAL_COLORS[platform] ?? 'text-muted-foreground'
              const currentValue = data.social_links?.[platform] ?? ''
              const fieldKey = `social_${platform}`
              const error = fieldErrors[fieldKey]

              return (
                <div key={platform} className="space-y-1">
                  <label htmlFor={`${id}-social-${platform}`} className="block text-[11px] font-medium text-muted">
                    {label}
                  </label>
                  <div className="relative">
                    <Icon className={cn('absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none', brandColor)} />
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
                        'w-full rounded-[var(--radius-sm)] border bg-surface-warm pl-8 pr-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
                        error ? 'border-destructive focus:ring-destructive/20 focus:border-destructive' : 'border-border'
                      )}
                    />
                  </div>
                  {error && (
                    <p className="text-[10px] text-destructive">{error}</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Skills */}
        <SkillsInput
          skills={data.skills ?? []}
          onChange={(skills) => onChange('skills', skills)}
        />
      </div>
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
    <section className="bg-white border border-border/60 rounded-[var(--radius-lg)] p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]', SECTION_STYLES.skills.bg)}>
          <Hash className={cn('h-3.5 w-3.5', SECTION_STYLES.skills.text)} />
        </div>
        <h2 className="text-base font-medium text-foreground font-[family-name:var(--font-satoshi)]">
          Competences
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius-md)] border border-border bg-surface-warm px-3.5 py-2.5 min-h-[40px] transition-colors duration-150 focus-within:ring-2 focus-within:ring-accent/15 focus-within:border-accent">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-full bg-white border border-border/60 text-foreground px-2.5 py-0.5 text-[12px] font-medium"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
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
            className="flex-1 min-w-[100px] bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
          />
        )}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Appuie sur Entree pour ajouter</span>
        <span>{skills.length}/30</span>
      </div>
    </section>
  )
}
