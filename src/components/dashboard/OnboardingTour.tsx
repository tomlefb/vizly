'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { completeOnboarding } from '@/actions/onboarding'

type StepKey = 'welcome' | 'sidebar' | 'newProject' | 'plan'

interface Step {
  key: StepKey
  selector: string | null
  placement: 'center' | 'right' | 'bottom'
  /** Alignment on the secondary axis. For `right`: start = top-aligned. For `bottom`: start = left-aligned, end = right-aligned. */
  align?: 'start' | 'center' | 'end'
  padding: number
}

const STEPS: Step[] = [
  { key: 'welcome', selector: null, placement: 'center', padding: 0 },
  { key: 'sidebar', selector: '[data-onboarding="sidebar"]', placement: 'right', align: 'start', padding: 8 },
  { key: 'newProject', selector: '[data-onboarding="new-project"]', placement: 'bottom', align: 'end', padding: 10 },
  { key: 'plan', selector: '[data-onboarding="plan"]', placement: 'bottom', align: 'start', padding: 10 },
]

const TOOLTIP_W = 340
const WELCOME_W = 460
const VIEWPORT_MARGIN = 16

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function useTargetRect(selector: string | null): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    if (!selector) {
      setRect(null)
      return
    }

    function measure() {
      const el = document.querySelector(selector as string)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    const id = window.setInterval(measure, 200)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      window.clearInterval(id)
    }
  }, [selector])

  return rect
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

function getTooltipPosition(
  rect: Rect | null,
  step: Step,
  cardW: number,
): { top: number; left: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (!rect || step.placement === 'center') {
    return {
      top: Math.max(vh / 2 - 180, 80),
      left: clamp(vw / 2 - cardW / 2, VIEWPORT_MARGIN, vw - cardW - VIEWPORT_MARGIN),
    }
  }

  const offset = step.padding + 14
  const align = step.align ?? 'center'

  if (step.placement === 'right') {
    const rawTop =
      align === 'start'
        ? rect.top + 16
        : rect.top + rect.height / 2 - 120
    return {
      top: clamp(rawTop, VIEWPORT_MARGIN, vh - 200),
      left: clamp(rect.left + rect.width + offset, VIEWPORT_MARGIN, vw - cardW - VIEWPORT_MARGIN),
    }
  }

  // placement === 'bottom'
  let rawLeft: number
  if (align === 'start') {
    rawLeft = rect.left
  } else if (align === 'end') {
    rawLeft = rect.left + rect.width - cardW
  } else {
    rawLeft = rect.left + rect.width / 2 - cardW / 2
  }
  return {
    top: clamp(rect.top + rect.height + offset, VIEWPORT_MARGIN, vh - 200),
    left: clamp(rawLeft, VIEWPORT_MARGIN, vw - cardW - VIEWPORT_MARGIN),
  }
}

export function OnboardingTour() {
  const t = useTranslations('onboarding')
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(true)
  const [stepIndex, setStepIndex] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    setMounted(true)
  }, [])

  const step = STEPS[stepIndex] ?? STEPS[0]
  const rect = useTargetRect(step?.selector ?? null)

  const isLast = stepIndex === STEPS.length - 1

  const finish = useCallback(async () => {
    setOpen(false)
    await completeOnboarding()
  }, [])

  const next = useCallback(() => {
    if (isLast) {
      void finish()
      return
    }
    setStepIndex((i) => i + 1)
  }, [isLast, finish])

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1))
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') void finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, finish])

  if (!mounted || !step) return null

  const isWelcome = step.key === 'welcome'
  const cardW = isWelcome ? WELCOME_W : TOOLTIP_W
  const tooltipPos = getTooltipPosition(rect, step, cardW)

  const spotlightPadding = step.padding
  const spotlight = rect && step.placement !== 'center'
    ? {
        top: rect.top - spotlightPadding,
        left: rect.left - spotlightPadding,
        width: rect.width + spotlightPadding * 2,
        height: rect.height + spotlightPadding * 2,
      }
    : null

  const motionProps = reduced
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 8 },
        transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const },
      }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="onboarding"
          className="fixed inset-0 z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop — spotlight via box-shadow cutout when a target is set,
              full overlay otherwise */}
          {spotlight ? (
            <motion.div
              key={`spot-${stepIndex}`}
              className="pointer-events-none absolute rounded-[var(--radius-md)]"
              style={{
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
                boxShadow: '0 0 0 9999px rgba(26, 26, 26, 0.55)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(26, 26, 26, 0.55)' }}
            />
          )}

          {/* Click shield — closes on backdrop click but not the card */}
          <button
            type="button"
            aria-label={t('skip')}
            onClick={() => void finish()}
            className="absolute inset-0 cursor-default"
            tabIndex={-1}
          />

          {/* Tooltip card */}
          <motion.div
            key={`card-${stepIndex}`}
            {...motionProps}
            className={cn(
              'pointer-events-auto absolute z-10 max-w-[calc(100vw-32px)] rounded-[var(--radius-lg)] border border-border bg-surface shadow-[0_16px_40px_rgba(26,26,26,0.18)]',
              isWelcome ? 'p-8' : 'p-5',
            )}
            style={{
              top: tooltipPos.top,
              left: tooltipPos.left,
              width: cardW,
            }}
          >
            <div className={cn('flex items-center justify-between', isWelcome ? 'mb-4' : 'mb-3')}>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                {t('step', { current: stepIndex + 1, total: STEPS.length })}
              </span>
              <button
                type="button"
                onClick={() => void finish()}
                aria-label={t('skip')}
                className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors duration-150 hover:bg-surface-warm hover:text-foreground"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            <h3
              className={cn(
                'font-[family-name:var(--font-satoshi)] font-bold tracking-tight text-foreground',
                isWelcome ? 'text-2xl leading-[1.15]' : 'text-lg font-semibold',
              )}
            >
              {isWelcome ? (
                <>
                  {t('steps.welcome.title').split(' ').slice(0, -1).join(' ')}{' '}
                  <span className="text-accent">
                    {t('steps.welcome.title').split(' ').slice(-1)}
                  </span>
                </>
              ) : (
                t(`steps.${step.key}.title`)
              )}
            </h3>
            <p className={cn('leading-relaxed text-muted', isWelcome ? 'mt-3 text-base' : 'mt-2 text-sm')}>
              {t(`steps.${step.key}.description`)}
            </p>

            {/* Dots */}
            <div className={cn('flex items-center justify-center gap-1.5', isWelcome ? 'mt-7' : 'mt-5')}>
              {STEPS.map((s, i) => (
                <span
                  key={s.key}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-200',
                    i === stepIndex
                      ? 'w-5 bg-accent'
                      : i < stepIndex
                        ? 'w-1.5 bg-accent/40'
                        : 'w-1.5 bg-border',
                  )}
                />
              ))}
            </div>

            <div className={cn('flex items-center justify-between gap-3', isWelcome ? 'mt-7' : 'mt-5')}>
              {stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={back}
                  className="text-sm font-medium text-muted transition-colors hover:text-foreground"
                >
                  {t('back')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void finish()}
                  className="text-sm font-medium text-muted transition-colors hover:text-foreground"
                >
                  {t('skip')}
                </button>
              )}

              <button
                type="button"
                onClick={next}
                className="group inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
              >
                {isLast ? t('finish') : t('next')}
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
