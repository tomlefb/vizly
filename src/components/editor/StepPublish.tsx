'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Globe,
  Check,
  X,
  Loader2,
  User,
  Palette,
  FolderOpen,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_DOMAIN, SLUG_MIN_LENGTH, SLUG_MAX_LENGTH } from '@/lib/constants'
import type { PortfolioFormData, ProjectFormData } from '@/lib/validations'
import { SubscriptionCheckoutModal } from '@/components/billing/SubscriptionCheckoutModal'

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

interface StepPublishProps {
  data: PortfolioFormData
  projects: ProjectFormData[]
  slug: string
  onSlugChange: (slug: string) => void
  /**
   * Persists the current portfolio draft to the database (upsert + sync
   * projects). Always called BEFORE the modal opens so the user never
   * loses their work mid-payment.
   */
  onSaveDraft: () => Promise<{ error: string | null }>
  /**
   * Publishes an already-saved portfolio (sets `published: true` on the
   * row) and navigates to the public URL. Called either directly when
   * the user is already on a paid plan, or from the modal's onSuccess
   * handler after a free user has paid.
   */
  onPublishNow: () => Promise<{ error: string | null }>
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
  onSaveDraft,
  onPublishNow,
  isPublished = false,
  billingPlan = 'free',
  selectedTemplateNeedsPurchase = false,
  className,
}: StepPublishProps) {
  // Phase 6 — local orchestration state. The modal is opened only for
  // free users who clicked "Publier" after the initial saveDraft succeeded.
  // Paid users skip the modal entirely and go straight to publishNow.
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false)

  const handlePublishClick = useCallback(async () => {
    setIsPublishing(true)
    setPublishError(null)

    // Step 1: ALWAYS save the draft first. This protects the user from
    // losing work if they pay but the publish step fails for any reason.
    const saveResult = await onSaveDraft()
    if (saveResult.error) {
      setPublishError(saveResult.error)
      setIsPublishing(false)
      return
    }

    // Step 2: branch on plan.
    // Free user → open modal, modal's onSuccess will trigger publishNow.
    if (billingPlan === 'free') {
      setIsPublishing(false) // modal owns its own loading state from here
      setSubscriptionModalOpen(true)
      return
    }

    // Paid user → publish directly, no modal.
    const publishResult = await onPublishNow()
    if (publishResult.error) {
      setPublishError(publishResult.error)
    }
    setIsPublishing(false)
  }, [onSaveDraft, onPublishNow, billingPlan])

  const handleModalSuccess = useCallback(async () => {
    // The webhook will sync the new plan into the local DB asynchronously.
    // We don't need to wait for it — the publishPortfolio call below
    // works as long as the user has an active subscription, which Stripe
    // guarantees once the PaymentIntent has succeeded.
    setIsPublishing(true)
    const publishResult = await onPublishNow()
    if (publishResult.error) {
      setPublishError(publishResult.error)
    }
    setIsPublishing(false)
  }, [onPublishNow])

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
      <div className={cn('space-y-6', className)} data-testid="step-publish">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <Check className="h-7 w-7 text-success" strokeWidth={2} />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
            Ton portfolio est en ligne
          </h2>
          <p className="text-[13px] text-muted">
            Ton portfolio est maintenant accessible a tout le monde.
          </p>
        </div>

        {/* URL copy box */}
        <div className="flex items-center gap-2 bg-white border border-border/60 rounded-[var(--radius-md)] p-1.5">
          <input
            type="text"
            readOnly
            value={portfolioUrl}
            className="flex-1 bg-transparent px-3 py-2 text-[13px] font-mono text-foreground outline-none"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className={cn(
              'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-[12px] font-semibold transition-all',
              copied
                ? 'bg-success text-white'
                : 'bg-accent text-white hover:bg-accent-hover'
            )}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copie !' : 'Copier'}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5">
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-accent px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-accent-hover active:scale-[0.98]"
          >
            Voir mon portfolio
            <ExternalLink className="h-4 w-4" />
          </a>
          <div className="flex gap-2.5">
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(portfolioUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border px-4 py-2.5 text-[12px] font-medium text-foreground hover:bg-surface-warm transition-colors"
            >
              Partager sur LinkedIn
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(portfolioUrl)}&text=${encodeURIComponent('Mon portfolio est en ligne !')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border px-4 py-2.5 text-[12px] font-medium text-foreground hover:bg-surface-warm transition-colors"
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
    <div className={cn('space-y-6', className)} data-testid="step-publish">
      {/* Slug input */}
      <div className="space-y-2">
        <label
          htmlFor="slug-input"
          className="block text-[12px] font-medium text-muted"
        >
          Ton pseudo
        </label>

        <div className="flex items-center rounded-[var(--radius-md)] border border-border bg-white overflow-hidden transition-colors duration-200 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
          <input
            id="slug-input"
            data-testid="slug-input"
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="tonpseudo"
            maxLength={SLUG_MAX_LENGTH}
            className="flex-1 bg-transparent px-4 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none"
            aria-invalid={slugStatus === 'invalid' || slugStatus === 'taken'}
            aria-describedby="slug-status"
          />
          <div className="flex items-center gap-2 pr-4 text-[12px] text-muted-foreground select-none">
            <span className="font-mono">.{APP_DOMAIN}</span>
            {statusIcon[slugStatus]}
          </div>
        </div>

        <div id="slug-status" aria-live="polite" className="min-h-[18px]">
          {slugStatus === 'available' && (
            <p className="text-[12px] text-success font-medium flex items-center gap-1">
              <Check className="h-3 w-3" />
              Disponible !
            </p>
          )}
          {slugError && (
            <p className="text-[11px] text-destructive" role="alert">
              {slugError}
            </p>
          )}
          {slugStatus === 'checking' && (
            <p className="text-[11px] text-muted-foreground">
              Verification en cours...
            </p>
          )}
        </div>
      </div>

      {/* Recap card */}
      <div className="bg-white border border-border/60 rounded-[var(--radius-lg)] p-4 space-y-2.5">
        <h3 className="text-[12px] font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
          Recapitulatif
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-[12px]">
            <User className="h-3.5 w-3.5 text-muted shrink-0" />
            <span className="text-muted">Nom</span>
            <span className="ml-auto font-medium text-foreground truncate max-w-[200px]">
              {data.title || '\u2014'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <Palette className="h-3.5 w-3.5 text-muted shrink-0" />
            <span className="text-muted">Template</span>
            <span className="ml-auto font-medium text-foreground capitalize">
              {data.template || '\u2014'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <FolderOpen className="h-3.5 w-3.5 text-muted shrink-0" />
            <span className="text-muted">Projets</span>
            <span className="ml-auto font-medium text-foreground">
              {projects.length}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <Globe className="h-3.5 w-3.5 text-muted shrink-0" />
            <span className="text-muted">URL</span>
            <span className="ml-auto font-medium text-foreground font-mono text-[11px]">
              {slug ? `${slug}.${APP_DOMAIN}` : '\u2014'}
            </span>
          </div>
        </div>
      </div>

      {/* Template purchase warning */}
      {selectedTemplateNeedsPurchase && (
        <div className="rounded-[var(--radius-md)] border border-amber-300/40 bg-amber-50/50 p-3">
          <p className="text-[12px] text-amber-800 font-medium text-center">
            Le template selectionne est premium et n&apos;a pas encore ete achete.
            Retourne a l&apos;etape Design pour l&apos;acheter.
          </p>
        </div>
      )}

      {/* Publish button */}
      <div className="space-y-2">
        <button
          type="button"
          data-testid="publish-btn"
          onClick={() => void handlePublishClick()}
          disabled={!canPublish}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-8 py-3.5 text-[15px] font-semibold transition-all duration-200',
            canPublish
              ? 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-[0_4px_14px_rgba(212,99,78,0.3)]'
              : 'bg-surface-warm text-muted-foreground/40 cursor-not-allowed'
          )}
          aria-label={isFreeUser ? "S'abonner pour publier" : 'Publier mon portfolio'}
        >
          {isPublishing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Publication en cours...
            </>
          ) : isFreeUser ? (
            "S'abonner pour publier (4,99 €/mois)"
          ) : (
            'Publier mon portfolio'
          )}
        </button>

        {publishError && (
          <p className="text-[11px] text-destructive text-center" role="alert">
            {publishError}
          </p>
        )}

        <p className="text-[11px] text-muted-foreground text-center">
          {isFreeUser
            ? "Sauvegarde, puis paiement, puis mise en ligne. Tout en restant dans l'éditeur."
            : "Ton portfolio sera accessible publiquement."}
        </p>
      </div>

      {/* Phase 6 — checkout modal for free users publishing for the first time */}
      <SubscriptionCheckoutModal
        open={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        plan="starter"
        interval="monthly"
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
