'use client'

// =============================================================================
// UpdatePaymentMethodModal — met à jour la CB de la souscription active
// =============================================================================
//
// Flow : SetupIntent (server) → PaymentElement (client) →
// confirmPaymentMethodUpdateAction (server) attache la nouvelle CB au customer
// et à la souscription comme default_payment_method. Zéro redirection Stripe.

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
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { Check, Loader2, X } from 'lucide-react'
import { VzBtn, VzHighlight } from '@/components/ui/vizly'
import { getStripe } from '@/lib/stripe/client-browser'
import {
  confirmPaymentMethodUpdateAction,
  createUpdatePaymentMethodIntentAction,
} from '@/actions/billing'
import { cn } from '@/lib/utils'
import { vizlyAppearance } from './stripeAppearance'
import { getErrorMessage, isValidationError } from './CheckoutErrorMessage'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const satisfies Easing

interface UpdatePaymentMethodModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

type ModalState =
  | { kind: 'loadingIntent' }
  | { kind: 'ready'; clientSecret: string }
  | { kind: 'processing'; clientSecret: string }
  | { kind: 'success' }
  | { kind: 'error'; message: string; canRetry: boolean }

export function UpdatePaymentMethodModal({
  open,
  onClose,
  onSuccess,
}: UpdatePaymentMethodModalProps) {
  const [state, setState] = useState<ModalState>({ kind: 'loadingIntent' })
  const [mounted, setMounted] = useState(false)

  const titleId = useId()
  const subId = useId()
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  const prefersReducedMotion = useReducedMotion()
  const stripePromise = useMemo(() => getStripe(), [])

  const isProcessing = state.kind === 'processing'

  useEffect(() => {
    setMounted(true)
  }, [])

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

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [open])

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

  const fetchIntent = useCallback(async () => {
    setState({ kind: 'loadingIntent' })
    const result = await createUpdatePaymentMethodIntentAction()
    if (result.ok) {
      setState({ kind: 'ready', clientSecret: result.clientSecret })
    } else {
      setState({
        kind: 'error',
        message: getErrorMessage(result.error),
        canRetry: true,
      })
    }
  }, [])

  useEffect(() => {
    if (!open) return
    void fetchIntent()
  }, [open, fetchIntent])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return
      if (isProcessing) return
      onClose()
    },
    [isProcessing, onClose],
  )

  const handleSubmitStart = useCallback(() => {
    setState((current) =>
      current.kind === 'ready'
        ? { kind: 'processing', clientSecret: current.clientSecret }
        : current,
    )
  }, [])

  const handleValidationError = useCallback(() => {
    setState((current) =>
      current.kind === 'processing'
        ? { kind: 'ready', clientSecret: current.clientSecret }
        : current,
    )
  }, [])

  const handleSubmitError = useCallback((message: string) => {
    setState({ kind: 'error', message, canRetry: true })
  }, [])

  const handleSubmitSuccess = useCallback(() => {
    setState({ kind: 'success' })
  }, [])

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
                <div className="pr-10">
                  <h2
                    id={titleId}
                    className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground"
                  >
                    Carte <VzHighlight>mise à jour</VzHighlight>.
                  </h2>
                  <p id={subId} className="mt-2 text-sm leading-relaxed text-muted">
                    Les prochaines factures seront prélevées sur cette carte.
                  </p>
                </div>
              ) : (
                <div className="pr-10">
                  <h2
                    id={titleId}
                    className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground"
                  >
                    Mettre à jour <VzHighlight>ta carte</VzHighlight>.
                  </h2>
                  <p id={subId} className="mt-2 text-sm leading-relaxed text-muted">
                    Ta nouvelle carte remplacera l&apos;ancienne pour toutes les prochaines factures.
                  </p>
                </div>
              )}
            </header>

            {state.kind === 'success' ? (
              <section className="space-y-6 px-8 pb-8 pt-2">
                <div className="flex items-center gap-3 text-sm text-muted">
                  <Check
                    className="h-4 w-4 text-[var(--color-success-fg)]"
                    strokeWidth={2.5}
                  />
                  Moyen de paiement par défaut mis à jour.
                </div>
                <VzBtn
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    onSuccess?.()
                    onClose()
                  }}
                  className="w-full"
                >
                  Continuer
                </VzBtn>
              </section>
            ) : (
              <section className="border-t border-border-light px-8 py-6">
                {state.kind === 'loadingIntent' && (
                  <div
                    className="space-y-3"
                    aria-busy="true"
                    aria-live="polite"
                  >
                    <div className="h-12 rounded-[var(--radius-md)] bg-surface-warm animate-pulse" />
                    <div className="h-12 rounded-[var(--radius-md)] bg-surface-warm animate-pulse" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-12 rounded-[var(--radius-md)] bg-surface-warm animate-pulse" />
                      <div className="h-12 rounded-[var(--radius-md)] bg-surface-warm animate-pulse" />
                    </div>
                    <div className="h-12 rounded-[var(--radius-md)] bg-surface-warm animate-pulse mt-4" />
                  </div>
                )}

                {state.kind === 'error' && (
                  <div
                    className="space-y-3 rounded-[var(--radius-md)] border border-border-light bg-surface-warm p-4"
                    role="alert"
                  >
                    <p className="text-sm text-foreground">{state.message}</p>
                    {state.canRetry && (
                      <button
                        type="button"
                        onClick={() => void fetchIntent()}
                        className="text-sm text-foreground underline underline-offset-4 transition-colors hover:text-accent-deep"
                      >
                        Réessayer
                      </button>
                    )}
                  </div>
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
                    <UpdateCardForm
                      clientSecret={elementsState.clientSecret}
                      isProcessing={isProcessing}
                      onSubmitStart={handleSubmitStart}
                      onSubmitError={handleSubmitError}
                      onSubmitSuccess={handleSubmitSuccess}
                      onValidationError={handleValidationError}
                    />
                  </Elements>
                )}
              </section>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function UpdateCardForm({
  clientSecret,
  isProcessing,
  onSubmitStart,
  onSubmitError,
  onSubmitSuccess,
  onValidationError,
}: {
  clientSecret: string
  isProcessing: boolean
  onSubmitStart: () => void
  onSubmitError: (message: string) => void
  onSubmitSuccess: () => void
  onValidationError: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isCardComplete, setIsCardComplete] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!stripe || !elements || isProcessing) return

      onSubmitStart()

      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/billing`,
        },
        redirect: 'if_required',
      })

      if (error) {
        if (isValidationError(error)) {
          onValidationError()
          return
        }
        onSubmitError(getErrorMessage(error.code, error.message))
        return
      }

      if (!setupIntent || setupIntent.status !== 'succeeded') {
        onSubmitError(
          getErrorMessage(
            undefined,
            'La confirmation de ta carte n\u2019a pas abouti. Réessaie dans un instant.',
          ),
        )
        return
      }

      // Stripe a confirmé le SetupIntent côté navigateur. On appelle le
      // serveur pour poser la nouvelle payment method comme default.
      const attachResult = await confirmPaymentMethodUpdateAction({
        setupIntentId: setupIntent.id,
      })
      if (!attachResult.ok) {
        onSubmitError(getErrorMessage(attachResult.error))
        return
      }
      onSubmitSuccess()
    },
    [
      stripe,
      elements,
      isProcessing,
      onSubmitStart,
      onSubmitError,
      onSubmitSuccess,
      onValidationError,
    ],
  )

  // clientSecret est listé pour satisfaire la closure stable; pas d'autre usage.
  void clientSecret

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          'inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-foreground font-[family-name:var(--font-satoshi)] text-sm font-semibold text-white shadow-[2px_2px_0_var(--color-accent)] transition-all duration-150 hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0',
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            {'Mise à jour\u2026'}
          </>
        ) : (
          'Enregistrer la nouvelle carte'
        )}
      </button>
    </form>
  )
}
