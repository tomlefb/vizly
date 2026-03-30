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

  const handlePhotoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        const previewUrl = URL.createObjectURL(file)
        setPhotoPreview(previewUrl)
        // Store a placeholder. The actual upload will be connected by the Integrator.
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
      {/* Section: Identity */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
            <User className="h-4 w-4 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
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
              className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border-2 border-dashed border-border bg-surface-warm transition-all duration-200 hover:border-accent/50"
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
                <Camera className="h-6 w-6 text-muted-foreground/50 group-hover:text-accent transition-colors duration-200" />
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
            <p className="text-[10px] text-muted-foreground text-center mt-1">
              Photo
            </p>
          </div>

          {/* Name fields */}
          <div className="flex-1 space-y-3">
            {/* Title / full name */}
            <div className="space-y-1.5">
              <label
                htmlFor={`${id}-title`}
                className="block text-sm font-medium text-foreground"
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
                  'w-full rounded-[var(--radius-md)] border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
                  errors['title']
                    ? 'border-destructive focus:border-destructive'
                    : 'border-border focus:border-accent'
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
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label
            htmlFor={`${id}-bio`}
            className="block text-sm font-medium text-foreground"
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
              'w-full rounded-[var(--radius-md)] border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors duration-150 resize-y min-h-[100px] focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
              errors['bio']
                ? 'border-destructive focus:border-destructive'
                : 'border-border focus:border-accent'
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

      {/* Section: Contact */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
            <Mail className="h-4 w-4 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
            Contact
          </h2>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={`${id}-email`}
            className="block text-sm font-medium text-foreground"
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
              onChange={(e) => onChange('contact_email', e.target.value)}
              placeholder="contact@example.com"
              className={cn(
                'w-full rounded-[var(--radius-md)] border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
                errors['contact_email']
                  ? 'border-destructive focus:border-destructive'
                  : 'border-border focus:border-accent'
              )}
              aria-invalid={!!errors['contact_email']}
              aria-describedby={errors['contact_email'] ? `${id}-email-error` : undefined}
            />
          </div>
          {errors['contact_email'] && (
            <p id={`${id}-email-error`} className="text-xs text-destructive" role="alert">
              {errors['contact_email']}
            </p>
          )}
        </div>
      </section>

      {/* Section: Social links */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
            <Globe className="h-4 w-4 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
            Reseaux sociaux
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map((platform) => {
            const Icon = SOCIAL_ICONS[platform] ?? Globe
            const label = SOCIAL_LABELS[platform] ?? platform
            const placeholder = SOCIAL_PLACEHOLDERS[platform] ?? 'https://...'
            const currentValue = data.social_links?.[platform] ?? ''

            return (
              <div key={platform} className="space-y-1.5">
                <label
                  htmlFor={`${id}-social-${platform}`}
                  className="block text-xs font-medium text-muted-foreground"
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
                    onChange={(e) =>
                      handleSocialChange(platform, e.target.value)
                    }
                    placeholder={placeholder}
                    className="w-full rounded-[var(--radius-sm)] border border-border bg-surface pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 transition-colors duration-150 focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
