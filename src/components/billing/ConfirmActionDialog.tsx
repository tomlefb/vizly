'use client'

// =============================================================================
// ConfirmActionDialog — confirmation sobre pour une action destructive/réversible
// =============================================================================
// Utilisée sur /billing pour confirmer l'annulation / la réactivation.

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Easing,
} from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VzBtn } from '@/components/ui/vizly'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const satisfies Easing

interface ConfirmActionDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  /**
   * Style du bouton de confirmation :
   *  - 'destructive' → fond rouge, pour une action destructive (annuler)
   *  - 'primary'     → fond accent, pour une action positive (réactiver)
   */
  confirmVariant: 'destructive' | 'primary'
  error?: string | null
  /**
   * Contenu additionnel rendu entre la description et les boutons.
   * Utilisé pour afficher un récap (plan, montant, dates) avant que
   * l'user confirme un changement de plan.
   */
  children?: React.ReactNode
}

export function ConfirmActionDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmVariant,
  error,
  children,
}: ConfirmActionDialogProps) {
  const [mounted, setMounted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const titleId = useId()
  const descId = useId()
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null)

  const prefersReducedMotion = useReducedMotion()

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
      cancelButtonRef.current?.focus()
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

  useEffect(() => {
    if (!open) setIsProcessing(false)
  }, [open])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return
      if (isProcessing) return
      onClose()
    },
    [isProcessing, onClose],
  )

  const handleConfirm = useCallback(async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      await onConfirm()
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing, onConfirm])

  if (!mounted) return null

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
            className="relative w-full sm:my-8 sm:max-w-sm max-h-[100vh] sm:max-h-[90vh] overflow-y-auto border-t border-border-light bg-surface sm:rounded-[var(--radius-lg)] sm:border"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative px-6 pt-6 pb-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                aria-label="Fermer"
                className={cn(
                  'absolute top-4 right-4 text-muted-foreground transition-colors',
                  isProcessing
                    ? 'opacity-40 pointer-events-none'
                    : 'hover:text-foreground',
                )}
              >
                <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>

              <h2
                id={titleId}
                className="pr-8 font-[family-name:var(--font-satoshi)] text-lg font-semibold text-foreground"
              >
                {title}
              </h2>
              <p
                id={descId}
                className="mt-2 text-sm text-muted leading-relaxed"
              >
                {description}
              </p>

              {children && <div className="mt-5">{children}</div>}

              {error && (
                <p className="mt-3 text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 pb-6 pt-2">
              <VzBtn
                ref={cancelButtonRef}
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={isProcessing}
              >
                {cancelLabel}
              </VzBtn>
              {confirmVariant === 'destructive' ? (
                <button
                  type="button"
                  onClick={() => void handleConfirm()}
                  disabled={isProcessing}
                  className={cn(
                    'inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-destructive px-4 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-60',
                  )}
                >
                  {isProcessing && (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  )}
                  {confirmLabel}
                </button>
              ) : (
                <VzBtn
                  variant="primary"
                  size="md"
                  onClick={() => void handleConfirm()}
                  disabled={isProcessing}
                >
                  {isProcessing && (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  )}
                  {confirmLabel}
                </VzBtn>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
