'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Globe,
  Check,
  X,
  Loader2,
  Rocket,
  FileText,
  Layout,
  FolderOpen,
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
  billingPlan = 'free',
  selectedTemplateNeedsPurchase = false,
  className,
}: StepPublishProps) {
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [slugError, setSlugError] = useState<string | null>(null)
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
          // API not yet implemented — assume available for now
          setSlugStatus('available')
          setSlugError(null)
        }
      } catch {
        // API not yet connected — assume available for UI development
        setSlugStatus('available')
        setSlugError(null)
      }
    },
    [validateSlugFormat]
  )

  const handleSlugChange = useCallback(
    (raw: string) => {
      // Sanitize: lowercase, only a-z0-9 and hyphens
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

      // Debounce the availability check
      checkTimeoutRef.current = setTimeout(() => {
        void checkSlugAvailability(sanitized)
      }, 400)
    },
    [onSlugChange, checkSlugAvailability]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }
    }
  }, [])

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

  return (
    <div className={cn('space-y-8', className)} data-testid="step-publish">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-accent/10 mx-auto">
          <Rocket className="h-6 w-6 text-accent" />
        </div>
        <h2 className="text-xl font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
          Publie ton portfolio
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Choisis ton pseudo pour ton URL personnalisee.
          Ton portfolio sera accessible a tout le monde.
        </p>
      </div>

      {/* Slug input */}
      <div className="max-w-md mx-auto space-y-3">
        <label
          htmlFor="slug-input"
          className="block text-sm font-medium text-foreground"
        >
          Ton pseudo
        </label>

        {/* URL preview */}
        <div className="flex items-center rounded-[var(--radius-lg)] border border-border bg-surface overflow-hidden transition-colors duration-200 focus-within:border-accent">
          <input
            id="slug-input"
            data-testid="slug-input"
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="tonpseudo"
            maxLength={SLUG_MAX_LENGTH}
            className="flex-1 bg-transparent px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
            aria-invalid={slugStatus === 'invalid' || slugStatus === 'taken'}
            aria-describedby="slug-status"
          />
          <div className="flex items-center gap-2 pr-4 text-sm text-muted-foreground select-none">
            <span className="font-mono">.{APP_DOMAIN}</span>
            {statusIcon[slugStatus]}
          </div>
        </div>

        {/* Status message */}
        <div id="slug-status" aria-live="polite" className="min-h-[20px]">
          {slugStatus === 'available' && (
            <p className="text-xs text-success font-medium flex items-center gap-1">
              <Check className="h-3 w-3" />
              Disponible
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

      {/* Recap */}
      <div className="max-w-md mx-auto rounded-[var(--radius-lg)] border border-border-light bg-surface-warm/50 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
          Recapitulatif
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Nom</span>
            <span className="ml-auto font-medium text-foreground truncate max-w-[200px]">
              {data.title || '—'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Layout className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Template</span>
            <span className="ml-auto font-medium text-foreground capitalize">
              {data.template || '—'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Projets</span>
            <span className="ml-auto font-medium text-foreground">
              {projects.length}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">URL</span>
            <span className="ml-auto font-medium text-foreground font-mono text-xs">
              {slug ? `${slug}.${APP_DOMAIN}` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Template purchase warning */}
      {selectedTemplateNeedsPurchase && (
        <div className="max-w-md mx-auto rounded-[var(--radius-lg)] border border-amber-300/40 bg-amber-50/50 p-4">
          <p className="text-sm text-amber-800 font-medium text-center">
            Le template selectionne est premium et n&apos;a pas encore ete achete.
            Retourne a l&apos;etape Personnalisation pour l&apos;acheter.
          </p>
        </div>
      )}

      {/* Publish button */}
      <div className="max-w-md mx-auto space-y-3">
        <button
          type="button"
          data-testid="publish-btn"
          onClick={onPublish}
          disabled={!canPublish}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-6 py-3.5 text-sm font-semibold transition-all duration-200',
            canPublish
              ? 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-[0_4px_16px_rgba(232,85,61,0.25)]'
              : 'bg-surface-warm text-muted-foreground/40 cursor-not-allowed'
          )}
          aria-label={isFreeUser ? "S'abonner pour publier" : 'Publier mon portfolio'}
        >
          {isPublishing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isFreeUser ? 'Redirection vers le paiement...' : 'Publication en cours...'}
            </>
          ) : isFreeUser ? (
            <>
              <Rocket className="h-4 w-4" />
              S&apos;abonner pour publier (4.99 EUR/mois)
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
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
