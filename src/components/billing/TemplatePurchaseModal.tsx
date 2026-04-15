'use client'

// =============================================================================
// TemplatePurchaseModal — Vizly checkout modal for premium template one-shots
// =============================================================================
//
// One-shot purchase of a premium template (2,99 € fixed, no subscription).
// Created in parallel with SubscriptionCheckoutModal (Phase 4) via controlled
// duplication — the two modals share lexical building blocks via imports
// (CheckoutErrorMessage, stripeAppearance, getStripe, formatEur) but the
// state machine, JSX shell and handlers live in their own file for lisibilité
// and to allow independent evolution. See STRIPE_MIGRATION_NOTES.md Phase 5
// for the YAGNI rationale behind the duplication-over-shared-shell choice.
//
// Key differences with SubscriptionCheckoutModal :
//   - No billing interval toggle (fixed one-shot purchase)
//   - No promo code field (2,99 € + promo = centimes — no product value)
//   - No recurring "Facturation mensuelle/annuelle" label
//   - Recap shows "Paiement unique" instead of a billing period
//   - Success state texts are template-specific ("Template débloqué.")
//   - "Already purchased" error case shows an optional "Accéder au template"
//     button via the `onAlreadyOwned` prop (the subscription modal has no
//     equivalent — a user is never "already subscribed" in that same semantic
//     idempotent sense, they're blocked earlier by `subscription_already_active`)
//
// The pattern ExpressCheckoutElement + "ou par carte" separator + PaymentElement
// Card-only is IDENTICAL to SubscriptionCheckoutModal. The dynamic payment
// methods resolution is driven by automatic_payment_methods: { enabled: true }
// on the underlying PaymentIntent (cf. createTemplatePaymentIntent), so
// Apple Pay / Google Pay / Link appear automatically based on Dashboard
// config + browser support — same contract as for subscriptions.
//
// Apple Pay validation reminder: same as SubscriptionCheckoutModal, Apple Pay
// is invisible in Safari local HTTPS (cert auto-signé Next.js non accepté
// par Apple Pay JS). Validation reportée au déploiement de preview puis prod. Google
// Pay et Link sont eux testables en local HTTPS Chrome.

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Easing,
} from 'framer-motion'
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import type {
  StripeError,
  StripeExpressCheckoutElementConfirmEvent,
} from '@stripe/stripe-js'
import { Check, Loader2, X } from 'lucide-react'
import { getStripe } from '@/lib/stripe/client-browser'
import { createTemplateIntentAction } from '@/actions/billing'
import { cn, formatEur } from '@/lib/utils'
import { vizlyAppearance } from './stripeAppearance'
import { getErrorMessage, isValidationError } from './CheckoutErrorMessage'

// ---------------------------------------------------------------------------
// Animation curve — same constant as SubscriptionCheckoutModal (and ScrollReveal)
// ---------------------------------------------------------------------------

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const satisfies Easing

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplatePurchaseModalProps {
  open: boolean
  onClose: () => void
  /**
   * The template slug (e.g. 'creatif', 'brutalist'). Must be a premium
   * template (checked server-side by createTemplateIntentAction against
   * TEMPLATES.premium).
   */
  templateId: string
  /**
   * The human-readable label of the template, displayed in the recap
   * and success state (e.g. 'Créatif', 'Brutalist'). Passed as a prop
   * rather than derived internally so the consumer controls the label
   * source (typically TEMPLATE_CONFIGS from src/types/templates.ts).
   */
  templateLabel: string
  /**
   * Called when the user clicks "Continuer" in the success state.
   * The consumer typically navigates to `/editor?template=${templateId}`
   * to jump straight into editing with the newly-unlocked template.
   */
  onSuccess?: () => void
  /**
   * Called when the user clicks "Accéder au template" in the
   * "template_already_purchased" error state. If omitted, the error
   * state shows the message without an action button (graceful
   * degradation). The consumer typically navigates to the editor
   * the same way as onSuccess would.
   */
  onAlreadyOwned?: () => void
}

/**
 * State machine. Same 5 kinds as SubscriptionCheckoutModal, with
 * template-specific payload fields:
 *   - `ready` and `processing` carry `amountCents` alongside the
 *     Stripe ids so the Recap + CTA display the authoritative price
 *     returned by the Server Action (not a hard-coded constant).
 *   - `error` carries an `alreadyOwned` flag that controls whether
 *     the ErrorBlock renders "Accéder au template" (true) or
 *     "Réessayer" (false, default for real errors).
 */
type CheckoutState =
  | { kind: 'loadingIntent' }
  | {
      kind: 'error'
      message: string
      canRetry: boolean
      alreadyOwned: boolean
    }
  | {
      kind: 'ready'
      clientSecret: string
      paymentIntentId: string
      amountCents: number
    }
  | {
      kind: 'processing'
      clientSecret: string
      paymentIntentId: string
      amountCents: number
    }
  | { kind: 'success' }

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TemplatePurchaseModal({
  open,
  onClose,
  templateId,
  templateLabel,
  onSuccess,
  onAlreadyOwned,
}: TemplatePurchaseModalProps) {
  const [state, setState] = useState<CheckoutState>({ kind: 'loadingIntent' })
  const [mounted, setMounted] = useState(false)

  const titleId = useId()
  const subId = useId()
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  const prefersReducedMotion = useReducedMotion()
  const stripePromise = useMemo(() => getStripe(), [])

  const isProcessing = state.kind === 'processing'

  // -----------------------------------------------------------------------
  // Mount safety for createPortal (SSR)
  // -----------------------------------------------------------------------

  useEffect(() => {
    setMounted(true)
  }, [])

  // -----------------------------------------------------------------------
  // Body overflow lock + previous focus capture
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement
    if (previous instanceof HTMLElement) {
      previousFocusRef.current = previous
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      const target = previousFocusRef.current
      if (target) target.focus()
    }
  }, [open])

  // -----------------------------------------------------------------------
  // Initial focus (deferred past animation)
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [open])

  // -----------------------------------------------------------------------
  // Escape to close (disabled during processing)
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, isProcessing, onClose])

  // -----------------------------------------------------------------------
  // Fetch the template intent
  // -----------------------------------------------------------------------

  const fetchIntent = useCallback(async () => {
    setState({ kind: 'loadingIntent' })
    const result = await createTemplateIntentAction({ templateId })
    if (result.ok) {
      setState({
        kind: 'ready',
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        amountCents: result.pricing.amountCents,
      })
    } else {
      // "Already owned" is a distinct UX state: no retry button (retrying
      // would hit the same idempotency error), and optionally an "Accéder
      // au template" action if the consumer provided onAlreadyOwned.
      const alreadyOwned = result.error === 'template_already_purchased'
      setState({
        kind: 'error',
        message: getErrorMessage(result.error),
        canRetry: !alreadyOwned,
        alreadyOwned,
      })
    }
  }, [templateId])

  // Initial fetch when the modal opens.
  useEffect(() => {
    if (!open) return
    void fetchIntent()
  }, [open, fetchIntent])

  // -----------------------------------------------------------------------
  // Submit callbacks for the inner CheckoutForm
  // -----------------------------------------------------------------------

  const handleSubmitStart = useCallback(() => {
    setState((current) =>
      current.kind === 'ready'
        ? {
            kind: 'processing',
            clientSecret: current.clientSecret,
            paymentIntentId: current.paymentIntentId,
            amountCents: current.amountCents,
          }
        : current,
    )
  }, [])

  const handleSubmitError = useCallback((message: string) => {
    setState({
      kind: 'error',
      message,
      canRetry: true,
      alreadyOwned: false,
    })
  }, [])

  const handleSubmitSuccess = useCallback(() => {
    setState({ kind: 'success' })
  }, [])

  /**
   * Transition from `processing` back to `ready` without unmounting the
   * form — used when Stripe reports a client-side validation error.
   * Same pattern as SubscriptionCheckoutModal.handleValidationError: the
   * PaymentElement has already rendered the error inline under the
   * relevant field, we just need to re-enable the submit button. The
   * user's typed input is preserved because the PaymentElement is never
   * unmounted.
   */
  const handleValidationError = useCallback(() => {
    setState((current) =>
      current.kind === 'processing'
        ? {
            kind: 'ready',
            clientSecret: current.clientSecret,
            paymentIntentId: current.paymentIntentId,
            amountCents: current.amountCents,
          }
        : current,
    )
  }, [])

  // -----------------------------------------------------------------------
  // Backdrop click — closes only when not processing
  // -----------------------------------------------------------------------

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return
      if (isProcessing) return
      onClose()
    },
    [isProcessing, onClose],
  )

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (!mounted) return null

  const elementsState =
    state.kind === 'ready' || state.kind === 'processing' ? state : null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="relative w-full sm:max-w-md sm:my-8 max-h-[100vh] sm:max-h-[90vh] overflow-y-auto bg-background sm:rounded-[var(--radius-lg)] border-t sm:border border-border"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={subId}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ---- Header ---- */}
            <header className="relative px-8 pt-8 pb-6">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                aria-label="Fermer"
                className={cn(
                  'absolute top-6 right-6 text-muted-foreground transition-colors',
                  isProcessing
                    ? 'opacity-40 pointer-events-none'
                    : 'hover:text-foreground',
                )}
              >
                <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>

              {state.kind === 'success' ? (
                <SuccessHeader
                  titleId={titleId}
                  subId={subId}
                  templateLabel={templateLabel}
                />
              ) : (
                <CheckoutHeader titleId={titleId} subId={subId} />
              )}
            </header>

            {/* ---- Body (varies by state) ---- */}
            {state.kind === 'success' ? (
              <SuccessBody
                onContinue={() => {
                  onSuccess?.()
                  onClose()
                }}
              />
            ) : (
              <>
                <Recap
                  templateLabel={templateLabel}
                  amountCents={
                    state.kind === 'ready' || state.kind === 'processing'
                      ? state.amountCents
                      : null
                  }
                />

                <section className="px-8 py-6 border-t border-border">
                  <p className="text-sm font-medium text-foreground mb-4">
                    Moyen de paiement
                  </p>

                  {state.kind === 'loadingIntent' && <PaymentSkeleton />}

                  {state.kind === 'error' && (
                    <ErrorBlock
                      message={state.message}
                      canRetry={state.canRetry}
                      alreadyOwned={state.alreadyOwned}
                      onRetry={() => void fetchIntent()}
                      onAlreadyOwned={onAlreadyOwned}
                    />
                  )}

                  {elementsState && (
                    <Elements
                      key={elementsState.clientSecret}
                      stripe={stripePromise}
                      options={{
                        clientSecret: elementsState.clientSecret,
                        appearance: vizlyAppearance,
                        locale: 'fr',
                      }}
                    >
                      <CheckoutForm
                        amountCents={elementsState.amountCents}
                        paymentIntentId={elementsState.paymentIntentId}
                        isProcessing={isProcessing}
                        onSubmitStart={handleSubmitStart}
                        onSubmitError={handleSubmitError}
                        onSubmitSuccess={handleSubmitSuccess}
                        onValidationError={handleValidationError}
                      />
                    </Elements>
                  )}
                </section>

                <footer className="px-8 pb-8 pt-4">
                  <p className="text-xs text-muted-foreground">
                    Paiement sécurisé par Stripe · Accès définitif après paiement.
                  </p>
                </footer>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// ===========================================================================
// Sub-components — same inline pattern as SubscriptionCheckoutModal. Kept
// local to this file for readability and independent evolution. Any true
// shared atom belongs in its own file (we've already done that for
// CheckoutErrorMessage, stripeAppearance, getStripe, formatEur).
// ===========================================================================

function CheckoutHeader({
  titleId,
  subId,
}: {
  titleId: string
  subId: string
}) {
  return (
    <div className="pr-10">
      <h2
        id={titleId}
        className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground"
      >
        Débloquer <span className="text-accent">ce template</span>.
      </h2>
      <p id={subId} className="mt-2 text-sm text-muted leading-relaxed">
        Paiement unique, accès définitif à ce template.
      </p>
    </div>
  )
}

function Recap({
  templateLabel,
  amountCents,
}: {
  templateLabel: string
  /**
   * `null` when the intent hasn't loaded yet — the recap shows a skeleton
   * on the price line. `number` once the Server Action has returned the
   * authoritative Stripe Price amount.
   */
  amountCents: number | null
}) {
  return (
    <section className="px-8 py-6 border-t border-border">
      <dl className="space-y-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">Template</dt>
          <dd className="font-medium text-foreground text-right">
            {templateLabel}
            <span className="block text-xs text-muted mt-0.5 font-normal">
              Paiement unique
            </span>
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-4 pt-3 border-t border-border-light">
          <dt className="font-medium text-foreground">Total</dt>
          <dd className="text-right">
            {amountCents === null ? (
              <div
                className="h-6 w-20 bg-surface-warm animate-pulse rounded-[var(--radius-sm)] ml-auto"
                aria-label="Chargement du prix"
              />
            ) : (
              <span className="font-[family-name:var(--font-satoshi)] text-xl font-bold text-foreground">
                {formatEur(amountCents)}
              </span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  )
}

function PaymentSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <div className="h-12 rounded-[var(--radius-md)] bg-surface-warm animate-pulse" />
      <div className="h-12 rounded-[var(--radius-md)] bg-surface-warm animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 rounded-[var(--radius-md)] bg-surface-warm animate-pulse" />
        <div className="h-12 rounded-[var(--radius-md)] bg-surface-warm animate-pulse" />
      </div>
      <div className="h-12 rounded-[var(--radius-md)] bg-surface-warm animate-pulse mt-4" />
    </div>
  )
}

function ErrorBlock({
  message,
  canRetry,
  alreadyOwned,
  onRetry,
  onAlreadyOwned,
}: {
  message: string
  canRetry: boolean
  alreadyOwned: boolean
  onRetry: () => void
  onAlreadyOwned: (() => void) | undefined
}) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-border bg-surface-warm p-4 space-y-3"
      role="alert"
    >
      <p className="text-sm text-foreground">{message}</p>
      {alreadyOwned && onAlreadyOwned ? (
        <button
          type="button"
          onClick={onAlreadyOwned}
          className="text-sm text-foreground hover:text-accent underline underline-offset-4 transition-colors"
        >
          Accéder au template
        </button>
      ) : (
        canRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm text-foreground hover:text-accent underline underline-offset-4 transition-colors"
          >
            Réessayer
          </button>
        )
      )}
    </div>
  )
}

function CheckoutForm({
  amountCents,
  paymentIntentId,
  isProcessing,
  onSubmitStart,
  onSubmitError,
  onSubmitSuccess,
  onValidationError,
}: {
  amountCents: number
  paymentIntentId: string
  isProcessing: boolean
  onSubmitStart: () => void
  onSubmitError: (message: string) => void
  onSubmitSuccess: () => void
  onValidationError: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()

  // Wallet availability detection — same pattern as SubscriptionCheckoutModal.
  const [hasExpressPayments, setHasExpressPayments] = useState(false)

  // Card form completeness — disables the "Payer" button until the user
  // has filled every field correctly, so clicking can never hit a
  // validation error. Same pattern as SubscriptionCheckoutModal.
  const [isCardComplete, setIsCardComplete] = useState(false)

  // Shared core — same design as SubscriptionCheckoutModal, classifies
  // client-side validation errors from real server-side errors and bounces
  // to `ready` state (preserving the user's input) for the former.
  const confirmAndHandleResult = useCallback(
    async (onBeforeError?: (error: StripeError) => void) => {
      if (!stripe || !elements) return

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Template-specific return URL — includes template_id so the
          // /billing/confirm page (Phase 7) can route the user back to
          // the editor with the newly-unlocked template pre-selected.
          return_url: `${window.location.origin}/billing/confirm?payment_intent_id=${paymentIntentId}`,
        },
        redirect: 'if_required',
      })

      if (error) {
        onBeforeError?.(error)

        if (isValidationError(error)) {
          onValidationError()
          return
        }

        onSubmitError(getErrorMessage(error.code, error.message))
        return
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSubmitSuccess()
        return
      }

      onSubmitError(
        getErrorMessage(
          undefined,
          "Le paiement n'a pas encore été confirmé. Réessaie dans un instant.",
        ),
      )
    },
    [
      stripe,
      elements,
      paymentIntentId,
      onValidationError,
      onSubmitError,
      onSubmitSuccess,
    ],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!stripe || !elements || isProcessing) return
      onSubmitStart()
      await confirmAndHandleResult()
    },
    [stripe, elements, isProcessing, onSubmitStart, confirmAndHandleResult],
  )

  const handleExpressConfirm = useCallback(
    async (event: StripeExpressCheckoutElementConfirmEvent) => {
      if (!stripe || !elements) {
        event.paymentFailed({ reason: 'fail' })
        return
      }
      onSubmitStart()
      await confirmAndHandleResult((error) => {
        event.paymentFailed({
          reason: 'fail',
          message: error.message,
        })
      })
    },
    [stripe, elements, onSubmitStart, confirmAndHandleResult],
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Express Checkout — same always-mounted pattern as the subscription
          modal. ECE iframe is visually empty if no wallets are available,
          so no conditional mount needed. Separator is conditional on
          hasExpressPayments being flipped true by the onReady event. */}
      <div className={hasExpressPayments ? 'mb-2' : ''}>
        <ExpressCheckoutElement
          onReady={({ availablePaymentMethods }) => {
            if (
              availablePaymentMethods &&
              Object.values(availablePaymentMethods).some(Boolean)
            ) {
              setHasExpressPayments(true)
            }
          }}
          onConfirm={handleExpressConfirm}
          options={{
            buttonType: {
              applePay: 'plain',
              googlePay: 'plain',
            },
            buttonTheme: {
              applePay: 'black',
              googlePay: 'black',
            },
            buttonHeight: 48,
            layout: { overflow: 'never' },
          }}
        />
        {hasExpressPayments && (
          <div className="flex items-center gap-4 mt-6 mb-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou par carte</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}
      </div>

      <PaymentElement
        options={{
          layout: 'tabs',
          fields: { billingDetails: 'auto' },
          wallets: { applePay: 'never', googlePay: 'never', link: 'never' },
        }}
        onChange={(event) => {
          setIsCardComplete(event.complete)
        }}
      />

      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing || !isCardComplete}
        className={cn(
          'w-full inline-flex items-center justify-center gap-2 h-12 rounded-[var(--radius-md)] text-sm font-medium text-white transition-colors',
          isProcessing || !stripe || !elements || !isCardComplete
            ? 'bg-accent/50 cursor-not-allowed'
            : 'bg-accent hover:bg-accent-hover',
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            {'Paiement en cours\u2026'}
          </>
        ) : (
          `Payer ${formatEur(amountCents)}`
        )}
      </button>
    </form>
  )
}

function SuccessHeader({
  titleId,
  subId,
  templateLabel,
}: {
  titleId: string
  subId: string
  templateLabel: string
}) {
  return (
    <div className="pr-10">
      <h2
        id={titleId}
        className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground"
      >
        Template <span className="text-accent">débloqué</span>.
      </h2>
      <p id={subId} className="mt-2 text-sm text-muted leading-relaxed">
        {`${templateLabel} est maintenant disponible dans l\u2019éditeur.`}
      </p>
    </div>
  )
}

function SuccessBody({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="px-8 pt-2 pb-8 space-y-6">
      <div className="flex items-center gap-3 text-sm text-muted">
        <Check className="h-4 w-4 text-accent" strokeWidth={2.5} />
        {'Tu peux maintenant utiliser ce template dans l\u2019éditeur.'}
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="w-full inline-flex items-center justify-center h-12 rounded-[var(--radius-md)] bg-accent text-sm font-medium text-white hover:bg-accent-hover transition-colors"
      >
        Continuer
      </button>
    </section>
  )
}
