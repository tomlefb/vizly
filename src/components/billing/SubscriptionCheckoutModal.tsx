'use client'

// =============================================================================
// SubscriptionCheckoutModal — Vizly checkout modal for Starter/Pro subscriptions
// =============================================================================
//
// Self-contained modal that creates a Stripe subscription in `default_incomplete`
// mode and confirms it via PaymentElement. Replaces the legacy Checkout hosted
// redirect. 100 % Vizly design (terracotta accent, Satoshi headings, left-aligned
// editorial voice). Reusable: takes plan + interval as props, no hard-coded
// page assumptions. Not wired into any page yet — Phase 6 will plug it into
// /billing, /tarifs and /editor.
//
// State machine — single useState<CheckoutState> drives everything. The
// discriminated union forces TypeScript to make us handle every case, and
// keeps related state (clientSecret + subscriptionId) bundled so we never
// end up with one-without-the-other.
//
// PCI / iframe note — the actual card inputs render inside a Stripe-hosted
// iframe (PaymentElement). We can only style it via the `appearance` prop
// in stripeAppearance.ts. Some Vizly visual details (grain overlay, exact
// shadows) cannot cross the iframe boundary. Accepted trade-off.
//
// Aborted-checkouts note — closing the modal in `ready` state without paying
// leaves an `incomplete` subscription on the Stripe side. Stripe garbage-
// collects after 24h, and createSubscriptionIntentAction's defensive check
// excludes `incomplete` from blocking statuses (Phase 4 fix), so the user
// can re-open the modal and try again without issue.

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
import { VzBtn, VzHighlight } from '@/components/ui/vizly'
import { getStripe } from '@/lib/stripe/client-browser'
import {
  createSubscriptionIntentAction,
  validatePromotionCodeAction,
} from '@/actions/billing'
import { PLANS } from '@/lib/constants'
import { cn, formatEur } from '@/lib/utils'
import { vizlyAppearance } from './stripeAppearance'
import { getErrorMessage, isValidationError } from './CheckoutErrorMessage'

// ---------------------------------------------------------------------------
// Animation curve — keep in sync with src/components/shared/ScrollReveal.tsx
// ---------------------------------------------------------------------------

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const satisfies Easing

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubscriptionCheckoutModalProps {
  open: boolean
  onClose: () => void
  plan: 'starter' | 'pro'
  interval: 'monthly' | 'yearly'
  /**
   * Called when the user clicks "Continuer" in the success state.
   * Optional: the consumer can refresh, navigate, or just rely on onClose.
   */
  onSuccess?: () => void
}

/**
 * State machine for the checkout flow.
 *
 * Note: 'redirectingTo3DS' is intentionally NOT a state — when 3DS is required
 * Stripe redirects the browser, the React tree unmounts, and we'd never
 * render that state. We stay in 'processing' until either (a) the resolved
 * Promise fires success/error, or (b) the page unmounts mid-redirect.
 *
 * 'ready' and 'processing' both carry the clientSecret + subscriptionId so
 * the <Elements> wrapper stays mounted with the same intent throughout
 * the submission (we never unmount it mid-flight).
 */
type CheckoutState =
  | { kind: 'loadingIntent' }
  | { kind: 'error'; message: string; canRetry: boolean }
  | { kind: 'ready'; clientSecret: string; subscriptionId: string }
  | {
      kind: 'processing'
      clientSecret: string
      subscriptionId: string
    }
  | { kind: 'success' }

interface AppliedPromo {
  code: string
  percentOff?: number
  amountOff?: number
  currency?: string
}

interface PromoFieldState {
  expanded: boolean
  inputValue: string
  applying: boolean
  error: string | null
}

const PROMO_FIELD_INITIAL: PromoFieldState = {
  expanded: false,
  inputValue: '',
  applying: false,
  error: null,
}

// ---------------------------------------------------------------------------
// Pricing helpers
// ---------------------------------------------------------------------------

interface PricingBreakdown {
  baseCents: number
  discountedCents: number
  discountCents: number
  hasDiscount: boolean
}

function computePricing(
  plan: 'starter' | 'pro',
  interval: 'monthly' | 'yearly',
  appliedPromo: AppliedPromo | null,
): PricingBreakdown {
  const planInfo = PLANS[plan]
  const baseEuros =
    interval === 'yearly'
      ? planInfo.yearlyPrice
      : planInfo.price
  const baseCents = Math.round(baseEuros * 100)

  let discountedCents = baseCents

  if (appliedPromo) {
    if (appliedPromo.percentOff !== undefined) {
      discountedCents = Math.round(baseCents * (1 - appliedPromo.percentOff / 100))
    } else if (
      appliedPromo.amountOff !== undefined &&
      (appliedPromo.currency === undefined || appliedPromo.currency === 'eur')
    ) {
      discountedCents = Math.max(0, baseCents - appliedPromo.amountOff)
    }
  }

  const discountCents = baseCents - discountedCents
  return {
    baseCents,
    discountedCents,
    discountCents,
    hasDiscount: discountCents > 0,
  }
}

const PLAN_DESCRIPTIONS: Record<'starter' | 'pro', string> = {
  starter:
    'Accès à la publication d\u2019un portfolio en ligne et au formulaire de contact.',
  pro: 'Portfolios en ligne illimités, domaine personnalisé, analytics et formulaire de contact.',
}

const INTERVAL_LABELS: Record<'monthly' | 'yearly', string> = {
  monthly: 'Facturation mensuelle',
  yearly: 'Facturation annuelle (\u221215\u00a0%)',
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SubscriptionCheckoutModal({
  open,
  onClose,
  plan,
  interval,
  onSuccess,
}: SubscriptionCheckoutModalProps) {
  const [state, setState] = useState<CheckoutState>({ kind: 'loadingIntent' })
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)
  const [promoField, setPromoField] = useState<PromoFieldState>(
    PROMO_FIELD_INITIAL,
  )
  const [mounted, setMounted] = useState(false)

  const titleId = useId()
  const subId = useId()
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  const prefersReducedMotion = useReducedMotion()
  const stripePromise = useMemo(() => getStripe(), [])

  // For the closing handlers: we need to ignore close attempts during
  // processing to avoid an in-flight stripe.confirmPayment that succeeds
  // server-side while the modal disappears (confusing UX).
  const isProcessing = state.kind === 'processing'

  // Pricing depends on the currently applied promo. Recomputed cheaply.
  const pricing = useMemo(
    () => computePricing(plan, interval, appliedPromo),
    [plan, interval, appliedPromo],
  )

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
  // Initial focus (after mount + when state allows interaction)
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!open) return
    // Defer focus to after the entry animation so it doesn't fight with
    // framer-motion's initial transform.
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
  // Fetch / refetch the subscription intent
  // -----------------------------------------------------------------------

  const fetchIntent = useCallback(
    async (promoCodeForServer?: string) => {
      setState({ kind: 'loadingIntent' })
      const result = await createSubscriptionIntentAction({
        plan,
        interval,
        ...(promoCodeForServer ? { promotionCode: promoCodeForServer } : {}),
      })
      if (result.ok) {
        setState({
          kind: 'ready',
          clientSecret: result.clientSecret,
          subscriptionId: result.subscriptionId,
        })
      } else {
        setState({
          kind: 'error',
          message: getErrorMessage(result.error),
          canRetry: true,
        })
      }
    },
    [plan, interval],
  )

  // Initial fetch when the modal opens. Reset everything else.
  useEffect(() => {
    if (!open) return
    setAppliedPromo(null)
    setPromoField(PROMO_FIELD_INITIAL)
    void fetchIntent()
  }, [open, fetchIntent])

  // -----------------------------------------------------------------------
  // Promo code apply / remove
  // -----------------------------------------------------------------------

  const handleApplyPromo = useCallback(async () => {
    const code = promoField.inputValue.trim()
    if (!code) return

    setPromoField((s) => ({ ...s, applying: true, error: null }))

    const validation = await validatePromotionCodeAction(code)
    if (!validation.ok) {
      setPromoField((s) => ({
        ...s,
        applying: false,
        error: getErrorMessage(validation.error),
      }))
      return
    }

    const newPromo: AppliedPromo = {
      code,
      ...(validation.discount.percentOff !== undefined
        ? { percentOff: validation.discount.percentOff }
        : {}),
      ...(validation.discount.amountOff !== undefined
        ? { amountOff: validation.discount.amountOff }
        : {}),
      ...(validation.discount.currency !== undefined
        ? { currency: validation.discount.currency }
        : {}),
    }
    setAppliedPromo(newPromo)
    setPromoField((s) => ({ ...s, applying: false, error: null }))

    // Recreate the intent on the server with the promo code so the
    // PaymentElement amount matches what the user will be charged.
    await fetchIntent(code)
  }, [promoField.inputValue, fetchIntent])

  const handleRemovePromo = useCallback(async () => {
    setAppliedPromo(null)
    setPromoField(PROMO_FIELD_INITIAL)
    await fetchIntent()
  }, [fetchIntent])

  // -----------------------------------------------------------------------
  // Submit callbacks for the inner CheckoutForm
  // -----------------------------------------------------------------------

  const handleSubmitStart = useCallback(() => {
    setState((current) =>
      current.kind === 'ready'
        ? {
            kind: 'processing',
            clientSecret: current.clientSecret,
            subscriptionId: current.subscriptionId,
          }
        : current,
    )
  }, [])

  const handleSubmitError = useCallback((message: string) => {
    setState({ kind: 'error', message, canRetry: true })
  }, [])

  const handleSubmitSuccess = useCallback(() => {
    setState({ kind: 'success' })
  }, [])

  /**
   * Transition from `processing` back to `ready` without unmounting the
   * form — used when a client-side validation error occurs (user typed
   * incomplete/invalid card data). Stripe's PaymentElement displays the
   * error inline under the relevant field, so we just need to re-enable
   * the submit button and let the user fix their input.
   *
   * Functional setState to preserve clientSecret + subscriptionId from
   * the current `processing` state without explicit type casts.
   */
  const handleValidationError = useCallback(() => {
    setState((current) =>
      current.kind === 'processing'
        ? {
            kind: 'ready',
            clientSecret: current.clientSecret,
            subscriptionId: current.subscriptionId,
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

  // We need both the clientSecret and subscriptionId for the Elements wrap.
  // Both 'ready' and 'processing' share them.
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
            className="relative w-full sm:my-8 sm:max-w-md max-h-[100vh] sm:max-h-[90vh] overflow-y-auto border-t border-border-light bg-surface sm:rounded-[var(--radius-lg)] sm:border"
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
                  planName={PLANS[plan].name}
                />
              ) : (
                <CheckoutHeader
                  titleId={titleId}
                  subId={subId}
                  plan={plan}
                />
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
                  plan={plan}
                  interval={interval}
                  pricing={pricing}
                  appliedPromo={appliedPromo}
                />

                <PromoCodeField
                  state={promoField}
                  appliedPromo={appliedPromo}
                  onToggle={() =>
                    setPromoField((s) => ({ ...s, expanded: !s.expanded }))
                  }
                  onChange={(value) =>
                    setPromoField((s) => ({ ...s, inputValue: value, error: null }))
                  }
                  onApply={handleApplyPromo}
                  onRemove={handleRemovePromo}
                  disabled={isProcessing}
                />

                <section className="border-t border-border-light px-8 py-6">
                  <p className="text-sm font-medium text-foreground mb-4">
                    Moyen de paiement
                  </p>

                  {state.kind === 'loadingIntent' && <PaymentSkeleton />}

                  {state.kind === 'error' && (
                    <ErrorBlock
                      message={state.message}
                      canRetry={state.canRetry}
                      onRetry={() => void fetchIntent(appliedPromo?.code)}
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
                        amountCents={pricing.discountedCents}
                        subscriptionId={elementsState.subscriptionId}
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
                    Paiement sécurisé par Stripe · Tu peux résilier à tout moment.
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
// Sub-components — kept inline so the modal lives in a single file. If
// TemplatePurchaseModal (Phase 5) ends up needing the same building blocks,
// we'll extract them then. Premature abstraction is worse than duplication.
// ===========================================================================

function CheckoutHeader({
  titleId,
  subId,
  plan,
}: {
  titleId: string
  subId: string
  plan: 'starter' | 'pro'
}) {
  const planName = PLANS[plan].name
  return (
    <div className="pr-10">
      <h2
        id={titleId}
        className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground"
      >
        Passer en <VzHighlight>{planName}</VzHighlight>.
      </h2>
      <p id={subId} className="mt-2 text-sm leading-relaxed text-muted">
        {PLAN_DESCRIPTIONS[plan]}
      </p>
    </div>
  )
}

function Recap({
  plan,
  interval,
  pricing,
  appliedPromo,
}: {
  plan: 'starter' | 'pro'
  interval: 'monthly' | 'yearly'
  pricing: PricingBreakdown
  appliedPromo: AppliedPromo | null
}) {
  const planName = PLANS[plan].name
  const intervalSuffix = interval === 'monthly' ? ' / mois' : ' / an'

  return (
    <section className="border-t border-border-light px-8 py-6">
      <dl className="space-y-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">Plan</dt>
          <dd className="font-medium text-foreground text-right">
            {planName}
            <span className="block text-xs text-muted mt-0.5 font-normal">
              {INTERVAL_LABELS[interval]}
            </span>
          </dd>
        </div>

        {appliedPromo && pricing.hasDiscount && (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted">Sous-total</dt>
              <dd className="text-right text-muted line-through">
                {formatEur(pricing.baseCents)}
                {intervalSuffix}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted">
                Code promo
                <span className="ml-2 inline-flex items-center rounded-[var(--radius-sm)] bg-accent-light px-2 py-0.5 text-[11px] font-medium text-accent-fg">
                  {appliedPromo.code}
                </span>
              </dt>
              <dd className="text-right font-medium text-accent-deep">
                {`−${formatEur(pricing.discountCents)}`}
              </dd>
            </div>
          </>
        )}

        <div className="flex items-baseline justify-between gap-4 pt-3 border-t border-border-light">
          <dt className="font-medium text-foreground">Total</dt>
          <dd className="font-[family-name:var(--font-satoshi)] text-xl font-bold text-foreground text-right">
            {formatEur(pricing.discountedCents)}
            <span className="text-sm font-normal text-muted ml-1">
              {intervalSuffix}
            </span>
          </dd>
        </div>
      </dl>
    </section>
  )
}

function PromoCodeField({
  state,
  appliedPromo,
  onToggle,
  onChange,
  onApply,
  onRemove,
  disabled,
}: {
  state: PromoFieldState
  appliedPromo: AppliedPromo | null
  onToggle: () => void
  onChange: (value: string) => void
  onApply: () => void
  onRemove: () => void
  disabled: boolean
}) {
  if (appliedPromo) {
    return (
      <section className="border-t border-border-light px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            Code promo{' '}
            <span className="font-medium text-foreground">
              {appliedPromo.code}
            </span>{' '}
            appliqué.
          </p>
          <button
            type="button"
            onClick={() => void onRemove()}
            disabled={disabled}
            className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-foreground disabled:opacity-50"
          >
            Retirer
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="border-t border-border-light px-8 py-4">
      {!state.expanded ? (
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-foreground disabled:opacity-50"
        >
          Tu as un code promo&nbsp;?
        </button>
      ) : (
        <div className="space-y-2">
          <label
            htmlFor="promo-code-input"
            className="block text-sm font-medium text-foreground"
          >
            Code promo
          </label>
          <div className="flex gap-2">
            <div className="flex flex-1 items-center overflow-hidden rounded-[var(--radius-md)] border border-border-light bg-surface transition-colors duration-150 focus-within:border-accent-deep focus-within:ring-2 focus-within:ring-accent/30">
              <input
                id="promo-code-input"
                type="text"
                value={state.inputValue}
                onChange={(e) => onChange(e.target.value)}
                placeholder="VIZLY15"
                disabled={disabled || state.applying}
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void onApply()
                  }
                }}
              />
            </div>
            <VzBtn
              variant="secondary"
              size="md"
              onClick={() => void onApply()}
              disabled={disabled || state.applying || !state.inputValue.trim()}
            >
              {state.applying ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : (
                'Appliquer'
              )}
            </VzBtn>
          </div>
          {state.error && (
            <p className="text-xs text-destructive" role="alert">
              {state.error}
            </p>
          )}
        </div>
      )}
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
  onRetry,
}: {
  message: string
  canRetry: boolean
  onRetry: () => void
}) {
  return (
    <div
      className="space-y-3 rounded-[var(--radius-md)] border border-border-light bg-surface-warm p-4"
      role="alert"
    >
      <p className="text-sm text-foreground">{message}</p>
      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm text-foreground underline underline-offset-4 transition-colors hover:text-accent-deep"
        >
          Réessayer
        </button>
      )}
    </div>
  )
}

function CheckoutForm({
  amountCents,
  subscriptionId,
  isProcessing,
  onSubmitStart,
  onSubmitError,
  onSubmitSuccess,
  onValidationError,
}: {
  amountCents: number
  subscriptionId: string
  isProcessing: boolean
  onSubmitStart: () => void
  onSubmitError: (message: string) => void
  onSubmitSuccess: () => void
  /**
   * Transition from `processing` back to `ready` without unmounting the
   * form. Called when Stripe reports a client-side validation error
   * (incomplete card number, invalid CVC, etc.) — the PaymentElement
   * already displays the error inline under the relevant field, we just
   * need to re-enable the submit button. The user's typed input is
   * preserved because the PaymentElement is never unmounted.
   */
  onValidationError: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()

  // Express Checkout availability detection. The ExpressCheckoutElement is
  // always mounted (so its onReady can fire), but the separator "ou par
  // carte" and spacing are rendered conditionally. When no wallets are
  // available (no Apple Pay, no Google Pay, no Link express), Stripe's
  // ECE iframe renders empty (zero visual noise) and the layout gracefully
  // degrades to a PaymentElement-only modal.
  const [hasExpressPayments, setHasExpressPayments] = useState(false)

  // Card form completeness. Tracks the PaymentElement's `complete` flag
  // from its onChange event — true when every field (number, expiry, cvc,
  // country...) is well-formed. Disables the "Payer" button until the user
  // has filled the form correctly, so clicking the button can never trigger
  // a validation error. Starts `false` because the form is empty at mount.
  const [isCardComplete, setIsCardComplete] = useState(false)

  // Shared core for both Card submit and wallet confirm flows. Factorizing
  // here saves ~15 lines of duplication and enforces one-point-of-change
  // on the confirmPayment call shape. The wallet flow passes `onBeforeError`
  // to dismiss the native sheet via event.paymentFailed() BEFORE the React
  // state transitions — without that, the wallet sheet can stay open on
  // top of a new UI state. The Card flow passes nothing.
  //
  // Error classification (Phase 4 UX fix): client-side validation errors
  // (incomplete card number, invalid CVC, etc.) are displayed inline by
  // Stripe's PaymentElement natively. We must NOT promote them to the
  // global error state — that would unmount the form and erase the user's
  // input. We call `onValidationError` instead, which transitions the
  // parent state from `processing` back to `ready` without touching the
  // PaymentElement. Real server-side errors (card_declined, insufficient_funds,
  // processing_error, api_error) still go through `onSubmitError` with
  // the global error UI + retry button.
  //
  // Note: `onBeforeError` fires FIRST in both paths, so the wallet sheet
  // dismissal happens consistently whether the error is validation or
  // server-side.
  const confirmAndHandleResult = useCallback(
    async (onBeforeError?: (error: StripeError) => void) => {
      if (!stripe || !elements) return

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/billing/confirm?subscription_id=${subscriptionId}`,
        },
        redirect: 'if_required',
      })

      if (error) {
        onBeforeError?.(error)

        if (isValidationError(error)) {
          // Inline validation — Stripe has already rendered the field
          // error under the relevant input. Just re-enable the form.
          onValidationError()
          return
        }

        // Real server-side error — global error state with retry.
        onSubmitError(getErrorMessage(error.code, error.message))
        return
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSubmitSuccess()
        return
      }

      // Other paymentIntent statuses (processing, requires_action without
      // redirect): treat as a soft error — the user can retry.
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
      subscriptionId,
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
        // Early-dismiss the native wallet sheet so it doesn't hang.
        event.paymentFailed({ reason: 'fail' })
        return
      }
      onSubmitStart()
      await confirmAndHandleResult((error) => {
        // CRITICAL: close the native wallet sheet BEFORE the React state
        // transitions to error. Without this call, the Apple Pay / Google
        // Pay sheet stays open on top of the new UI state or dismisses
        // with a phantom success. Pattern documented in Stripe ECE docs.
        event.paymentFailed({
          reason: 'fail',
          message: error.message,
        })
      })
      // Success path: the wallet sheet dismisses itself when confirmPayment
      // resolves without error. No explicit call needed.
    },
    [stripe, elements, onSubmitStart, confirmAndHandleResult],
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Express Checkout — always mounted so onReady fires, separator
          rendered conditionally once at least one wallet is available. */}
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
            // Force every available wallet to show inline — no "Afficher
            // plus" collapse button that would hide Link behind a click.
            // Stripe's default is `overflow: 'auto'` which groups extra
            // wallets. We want all visible at once, so: 'never'.
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
          // Revert to the compact 'tabs' layout now that wallets live in
          // the ExpressCheckoutElement above. With only Card left, Stripe
          // gracefully degrades to a direct card form with no visible
          // tab strip.
          layout: 'tabs',
          fields: { billingDetails: 'auto' },
          // CRITICAL: disable ALL wallets on the PaymentElement to avoid
          // double-display. Apple Pay / Google Pay / Link are all surfaced
          // in the ExpressCheckoutElement above, so the PaymentElement
          // must be strictly Card-only — no inline wallet addon, no Link
          // autofill bar, nothing. Link in particular was showing a
          // "Paiement sécurisé et rapide avec Link" row above the card
          // form which duplicated the Link express button — confusing.
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
          'inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-foreground font-[family-name:var(--font-satoshi)] text-sm font-semibold text-white shadow-[2px_2px_0_var(--color-accent)] transition-all duration-150 hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0',
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
  planName,
}: {
  titleId: string
  subId: string
  planName: string
}) {
  return (
    <div className="pr-10">
      <h2
        id={titleId}
        className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground"
      >
        Paiement <VzHighlight>confirmé</VzHighlight>.
      </h2>
      <p id={subId} className="mt-2 text-sm leading-relaxed text-muted">
        Ton abonnement {planName} est actif.
      </p>
    </div>
  )
}

function SuccessBody({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="space-y-6 px-8 pb-8 pt-2">
      <div className="flex items-center gap-3 text-sm text-muted">
        <Check
          className="h-4 w-4 text-[var(--color-success-fg)]"
          strokeWidth={2.5}
        />
        Tu peux maintenant publier ton portfolio.
      </div>
      <VzBtn
        variant="primary"
        size="lg"
        onClick={onContinue}
        className="w-full"
      >
        Continuer
      </VzBtn>
    </section>
  )
}
