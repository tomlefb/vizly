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
      className={cn('space-y-8', className)}
      data-testid="step-personal-info"
    >
      {/* ── Identite ── */}
      <section className="flex flex-col md:flex-row md:gap-16">
        <div className="w-full md:w-[280px] md:shrink-0 mb-4 md:mb-0">
          <h2 className="text-[18px] font-semibold leading-7 text-[#111827]">
            Identite
          </h2>
          <p className="text-[13px] text-[#6B7280] mt-1">
            Les infos principales de ton portfolio
          </p>
        </div>
        <div className="flex-1 md:max-w-[480px] space-y-4">
          {/* Photo + Name on same line */}
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-dashed border-[#E5E7EB] bg-[#F9FAFB] transition-[border-color] duration-150 hover:border-[#D1D5DB]"
                aria-label="Choisir une photo de profil"
              >
                {photoPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Photo de profil" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors duration-150">
                      <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                    </div>
                  </>
                ) : (
                  <Camera className="h-5 w-5 text-[#9CA3AF]" />
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
              <label htmlFor={`${id}-title`} className="block text-sm text-[#6B7280] mb-1.5">
                Nom complet <span className="text-[#DC2626]">*</span>
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
                  'w-full h-10 rounded-lg border bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]',
                  errors['title'] ? 'border-[#DC2626]' : 'border-[#E5E7EB]'
                )}
                aria-invalid={!!errors['title']}
                aria-describedby={errors['title'] ? `${id}-title-error` : undefined}
              />
              {errors['title'] && (
                <p id={`${id}-title-error`} className="text-[13px] text-[#DC2626] mt-1" role="alert">
                  {errors['title']}
                </p>
              )}
            </div>
          </div>

          {/* Bio — full width below photo + name */}
          <div>
            <label htmlFor={`${id}-bio`} className="block text-sm text-[#6B7280] mb-1.5">
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
                'w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 resize-y min-h-[72px] focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]',
                errors['bio'] ? 'border-[#DC2626]' : 'border-[#E5E7EB]'
              )}
              aria-invalid={!!errors['bio']}
              aria-describedby={`${id}-bio-count`}
            />
            <p
              id={`${id}-bio-count`}
              className={cn(
                'text-[13px] text-right mt-1',
                bioLength > MAX_BIO_LENGTH * 0.9 ? 'text-[#DC2626]' : 'text-[#9CA3AF]'
              )}
            >
              {bioLength}/{MAX_BIO_LENGTH}
            </p>
          </div>
        </div>
      </section>

      <div className="border-b border-[#E5E7EB]" />

      {/* ── Contact ── */}
      <section className="flex flex-col md:flex-row md:gap-16">
        <div className="w-full md:w-[280px] md:shrink-0 mb-4 md:mb-0">
          <h2 className="text-[18px] font-semibold leading-7 text-[#111827]">
            Contact
          </h2>
          <p className="text-[13px] text-[#6B7280] mt-1">
            L&apos;email affiche sur ton portfolio
          </p>
        </div>
        <div className="flex-1 md:max-w-[480px]">
          <div>
            <label htmlFor={`${id}-email`} className="block text-sm text-[#6B7280] mb-1.5">
              Email de contact
            </label>
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
                'w-full h-10 rounded-lg border bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]',
                (errors['contact_email'] || fieldErrors['contact_email'])
                  ? 'border-[#DC2626]'
                  : 'border-[#E5E7EB]'
              )}
              aria-invalid={!!(errors['contact_email'] || fieldErrors['contact_email'])}
              aria-describedby={(errors['contact_email'] || fieldErrors['contact_email']) ? `${id}-email-error` : `${id}-email-hint`}
            />
            {(errors['contact_email'] || fieldErrors['contact_email']) ? (
              <p id={`${id}-email-error`} className="text-[13px] text-[#DC2626] mt-1" role="alert">
                {errors['contact_email'] || fieldErrors['contact_email']}
              </p>
            ) : (
              <p id={`${id}-email-hint`} className="text-[13px] text-[#9CA3AF] mt-1">
                Cet email sera visible sur ton portfolio pour que tes visiteurs puissent te contacter.
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="border-b border-[#E5E7EB]" />

      {/* ── Reseaux sociaux ── */}
      <section className="flex flex-col md:flex-row md:gap-16">
        <div className="w-full md:w-[280px] md:shrink-0 mb-4 md:mb-0">
          <h2 className="text-[18px] font-semibold leading-7 text-[#111827]">
            Reseaux sociaux
          </h2>
          <p className="text-[13px] text-[#6B7280] mt-1">
            Tes liens pour etre retrouve
          </p>
        </div>
        <div className="flex-1 md:max-w-[480px]">
          <div className="grid gap-4 grid-cols-2">
            {SOCIAL_PLATFORMS.map((platform) => {
              const label = SOCIAL_LABELS[platform] ?? platform
              const placeholder = SOCIAL_PLACEHOLDERS[platform] ?? 'https://...'
              const currentValue = data.social_links?.[platform] ?? ''
              const fieldKey = `social_${platform}`
              const error = fieldErrors[fieldKey]

              return (
                <div key={platform}>
                  <label htmlFor={`${id}-social-${platform}`} className="block text-sm text-[#6B7280] mb-1.5">
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
                    className={cn(
                      'w-full h-10 rounded-lg border bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]',
                      error ? 'border-[#DC2626]' : 'border-[#E5E7EB]'
                    )}
                  />
                  {error && (
                    <p className="text-[13px] text-[#DC2626] mt-1">{error}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="border-b border-[#E5E7EB]" />

      {/* ── Competences ── */}
      <section className="flex flex-col md:flex-row md:gap-16">
        <div className="w-full md:w-[280px] md:shrink-0 mb-4 md:mb-0">
          <h2 className="text-[18px] font-semibold leading-7 text-[#111827]">
            Competences
          </h2>
          <p className="text-[13px] text-[#6B7280] mt-1">
            Tes skills et technologies
          </p>
        </div>
        <div className="flex-1 md:max-w-[480px]">
          <SkillsInput
            id={id}
            skills={data.skills ?? []}
            onChange={(skills) => onChange('skills', skills)}
          />
        </div>
      </section>
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
      <label htmlFor={`${id}-skills`} className="block text-sm text-[#6B7280] mb-1.5">
        Ajoute tes competences
      </label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 min-h-[40px] transition-[border-color] duration-150 focus-within:border-[#D1D5DB] focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-[#F3F4F6] text-[#111827] rounded-[6px] text-[13px]"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="flex h-3.5 w-3.5 items-center justify-center text-[#9CA3AF] hover:text-[#111827] transition-colors"
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
            className="flex-1 min-w-[100px] bg-transparent text-[13px] text-[#111827] placeholder:text-[#9CA3AF] outline-none"
          />
        )}
      </div>
      <div className="flex justify-between text-[13px] text-[#9CA3AF] mt-1">
        <span>Appuie sur Entree pour ajouter</span>
        <span>{skills.length}/30</span>
      </div>
    </div>
  )
}
