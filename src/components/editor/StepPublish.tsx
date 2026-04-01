'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Globe,
  Check,
  X,
  Loader2,
  Rocket,
  User,
  Palette,
  FolderOpen,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_DOMAIN, SLUG_MIN_LENGTH, SLUG_MAX_LENGTH } from '@/lib/constants'
import type { PortfolioFormData, ProjectFormData } from '@/lib/validations'

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

interface StepPublishProps {
  data: PortfolioFormData
  projects: ProjectFormData[]
  slug: string
  onSlugChange: (slug: string) => void
  onPublish: () => void
  isPublishing?: boolean
  isPublished?: boolean
  billingPlan?: 'free' | 'starter' | 'pro'
  selectedTemplateNeedsPurchase?: boolean
  className?: string
}

export function StepPublish({
  data,
  projects,
  slug,
  onSlugChange,
  onPublish,
  isPublishing = false,
  isPublished = false,
  billingPlan = 'free',
  selectedTemplateNeedsPurchase = false,
  className,
}: StepPublishProps) {
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [slugError, setSlugError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const validateSlugFormat = useCallback((value: string): string | null => {
    if (value.length < SLUG_MIN_LENGTH) {
      return `Au moins ${SLUG_MIN_LENGTH} caracteres`
    }
    if (value.length > SLUG_MAX_LENGTH) {
      return `Maximum ${SLUG_MAX_LENGTH} caracteres`
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value) && value.length >= 2) {
      return 'Lettres minuscules, chiffres et tirets uniquement'
    }
    if (value.includes('--')) {
      return 'Pas de tirets consecutifs'
    }
    return null
  }, [])

  const checkSlugAvailability = useCallback(
    async (value: string) => {
      const formatError = validateSlugFormat(value)
      if (formatError) {
        setSlugStatus('invalid')
        setSlugError(formatError)
        return
      }

      setSlugStatus('checking')
      setSlugError(null)

      try {
        const res = await fetch(
          `/api/check-slug?slug=${encodeURIComponent(value)}`
        )
        if (res.ok) {
          const result = (await res.json()) as { available: boolean }
          setSlugStatus(result.available ? 'available' : 'taken')
          setSlugError(result.available ? null : 'Ce pseudo est deja pris')
        } else {
          setSlugStatus('available')
          setSlugError(null)
        }
      } catch {
        setSlugStatus('available')
        setSlugError(null)
      }
    },
    [validateSlugFormat]
  )

  const handleSlugChange = useCallback(
    (raw: string) => {
      const sanitized = raw
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+/, '')
      onSlugChange(sanitized)

      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }

      if (sanitized.length === 0) {
        setSlugStatus('idle')
        setSlugError(null)
        return
      }

      if (sanitized.length < SLUG_MIN_LENGTH) {
        setSlugStatus('invalid')
        setSlugError(`Au moins ${SLUG_MIN_LENGTH} caracteres`)
        return
      }

      checkTimeoutRef.current = setTimeout(() => {
        void checkSlugAvailability(sanitized)
      }, 400)
    },
    [onSlugChange, checkSlugAvailability]
  )

  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }
    }
  }, [])

  const handleCopyLink = useCallback(() => {
    const url = `https://${slug}.${APP_DOMAIN}`
    void navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [slug])

  const statusIcon = {
    idle: null,
    checking: <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />,
    available: <Check className="h-4 w-4 text-success" />,
    taken: <X className="h-4 w-4 text-destructive" />,
    invalid: <X className="h-4 w-4 text-destructive" />,
  }

  const isFreeUser = billingPlan === 'free'

  const canPublish =
    slugStatus === 'available' &&
    data.title.trim() !== '' &&
    !isPublishing &&
    !selectedTemplateNeedsPurchase

  const portfolioUrl = `https://${slug}.${APP_DOMAIN}`

  // ── Success screen ──
  if (isPublished) {
    return (
      <div className={cn('space-y-8', className)} data-testid="step-publish">
        {/* Success celebration indicator */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <Check className="h-10 w-10 text-success" strokeWidth={2} />
          </div>
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-[32px] font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
            Ton portfolio est en ligne !
          </h2>
          <p className="text-[15px] text-muted max-w-md mx-auto">
            Felicitations ! Ton portfolio est maintenant accessible a tout le monde.
          </p>
        </div>

        {/* URL copy box */}
        <div className="max-w-md mx-auto flex items-center gap-2 bg-surface-warm border border-border rounded-[var(--radius-lg)] p-2">
          <input
            type="text"
            readOnly
            value={portfolioUrl}
            className="flex-1 bg-transparent px-3 py-2 text-[15px] font-mono text-foreground outline-none"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className={cn(
              'flex items-center gap-1.5 rounded-[var(--radius-md)] px-4 py-2 text-[13px] font-semibold transition-all',
              copied
                ? 'bg-success text-white'
                : 'bg-accent text-white hover:bg-accent-hover'
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copie !' : 'Copier'}
          </button>
        </div>

        {/* Action buttons */}
        <div className="max-w-md mx-auto flex flex-col gap-3">
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-accent px-6 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-accent-hover active:scale-[0.98] shadow-[0_4px_14px_rgba(212,99,78,0.3)]"
          >
            Voir mon portfolio
            <ExternalLink className="h-4 w-4" />
          </a>
          <div className="flex gap-3">
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(portfolioUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border px-4 py-2.5 text-[13px] font-medium text-foreground hover:bg-surface-warm transition-colors"
            >
              Partager sur LinkedIn
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(portfolioUrl)}&text=${encodeURIComponent('Mon portfolio est en ligne !')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border px-4 py-2.5 text-[13px] font-medium text-foreground hover:bg-surface-warm transition-colors"
            >
              Partager sur X
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Main publish form ──
  return (
    <div className={cn('space-y-8', className)} data-testid="step-publish">
      {/* Header with floating rocket */}
      <div className="text-center space-y-3">
        <div className="inline-block animate-[float_3s_ease-in-out_infinite]">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto" aria-hidden="true">
            <circle cx="32" cy="32" r="28" fill="var(--color-accent-light)" />
            <path d="M32 16c-4 8-4 16-4 20s1.5 6 4 8c2.5-2 4-4 4-8s0-12-4-20z" fill="var(--color-accent)" opacity="0.9" />
            <path d="M28 36c-3 1-5 3-6 5 2 1 4 1 6 0z" fill="var(--color-accent)" opacity="0.6" />
            <path d="M36 36c3 1 5 3 6 5-2 1-4 1-6 0z" fill="var(--color-accent)" opacity="0.6" />
            <circle cx="32" cy="28" r="3" fill="white" />
          </svg>
        </div>
        <h2 className="text-[32px] font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
          Publie ton portfolio
        </h2>
        <p className="text-[15px] text-muted max-w-md mx-auto">
          Choisis ton pseudo pour ton URL personnalisee.
          Ton portfolio sera accessible a tout le monde.
        </p>
      </div>

      {/* Slug input */}
      <div className="max-w-md mx-auto space-y-3">
        <label
          htmlFor="slug-input"
          className="block text-[13px] font-medium text-muted"
        >
          Ton pseudo
        </label>

        <div className="flex items-center rounded-[var(--radius-lg)] border border-border bg-surface overflow-hidden transition-colors duration-200 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
          <input
            id="slug-input"
            data-testid="slug-input"
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="tonpseudo"
            maxLength={SLUG_MAX_LENGTH}
            className="flex-1 bg-transparent px-4 py-3 text-[15px] font-medium text-foreground placeholder:text-muted-foreground outline-none"
            aria-invalid={slugStatus === 'invalid' || slugStatus === 'taken'}
            aria-describedby="slug-status"
          />
          <div className="flex items-center gap-2 pr-4 text-[13px] text-muted-foreground select-none">
            <span className="font-mono">.{APP_DOMAIN}</span>
            {statusIcon[slugStatus]}
          </div>
        </div>

        {/* Status message */}
        <div id="slug-status" aria-live="polite" className="min-h-[20px]">
          {slugStatus === 'available' && (
            <p className="text-[13px] text-success font-medium flex items-center gap-1">
              <Check className="h-3 w-3" />
              Disponible !
            </p>
          )}
          {slugError && (
            <p className="text-xs text-destructive" role="alert">
              {slugError}
            </p>
          )}
          {slugStatus === 'checking' && (
            <p className="text-xs text-muted-foreground">
              Verification en cours...
            </p>
          )}
        </div>
      </div>

      {/* Recap card */}
      <div className="max-w-md mx-auto bg-surface-warm border border-border rounded-2xl p-5 space-y-3">
        <h3 className="text-[13px] font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
          Recapitulatif
        </h3>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 text-[13px]">
            <User className="h-4 w-4 text-muted shrink-0" />
            <span className="text-muted">Nom</span>
            <span className="ml-auto font-medium text-foreground truncate max-w-[200px]">
              {data.title || '—'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[13px]">
            <Palette className="h-4 w-4 text-muted shrink-0" />
            <span className="text-muted">Template</span>
            <span className="ml-auto font-medium text-foreground capitalize">
              {data.template || '—'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[13px]">
            <FolderOpen className="h-4 w-4 text-muted shrink-0" />
            <span className="text-muted">Projets</span>
            <span className="ml-auto font-medium text-foreground">
              {projects.length}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[13px]">
            <Globe className="h-4 w-4 text-muted shrink-0" />
            <span className="text-muted">URL</span>
            <span className="ml-auto font-medium text-foreground font-mono text-xs">
              {slug ? `${slug}.${APP_DOMAIN}` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Template purchase warning */}
      {selectedTemplateNeedsPurchase && (
        <div className="max-w-md mx-auto rounded-[var(--radius-lg)] border border-amber-300/40 bg-amber-50/50 p-4">
          <p className="text-[13px] text-amber-800 font-medium text-center">
            Le template selectionne est premium et n&apos;a pas encore ete achete.
            Retourne a l&apos;etape Personnalisation pour l&apos;acheter.
          </p>
        </div>
      )}

      {/* Publish button — the biggest button in the flow */}
      <div className="max-w-[500px] mx-auto space-y-3">
        <button
          type="button"
          data-testid="publish-btn"
          onClick={onPublish}
          disabled={!canPublish}
          className={cn(
            'w-full flex items-center justify-center gap-2.5 rounded-[14px] px-8 py-4 text-[17px] font-semibold transition-all duration-200',
            canPublish
              ? 'bg-accent text-white hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_14px_rgba(212,99,78,0.3)]'
              : 'bg-surface-warm text-muted-foreground/40 cursor-not-allowed'
          )}
          style={{ height: '56px' }}
          aria-label={isFreeUser ? "S'abonner pour publier" : 'Publier mon portfolio'}
        >
          {isPublishing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {isFreeUser ? 'Redirection vers le paiement...' : 'Publication en cours...'}
            </>
          ) : isFreeUser ? (
            <>
              <Rocket className="h-5 w-5" />
              S&apos;abonner pour publier (4.99 EUR/mois)
            </>
          ) : (
            <>
              <Rocket className="h-5 w-5" />
              Publier mon portfolio
            </>
          )}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          {isFreeUser
            ? "Tu seras redirige vers Stripe pour souscrire un abonnement Starter."
            : "Ton portfolio sera accessible publiquement."}
        </p>
      </div>
    </div>
  )
}
