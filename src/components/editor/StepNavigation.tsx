'use client'

import { useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VzBtn } from '@/components/ui/vizly'

const STEP_KEYS = [
  { id: 1, key: 'steps.profile' },
  { id: 2, key: 'steps.content' },
  { id: 3, key: 'steps.design' },
  { id: 4, key: 'steps.publish' },
] as const

interface StepNavigationProps {
  currentStep: number
  completedSteps: number[]
  onStepChange: (step: number) => void
  onNext: () => void
  onPrevious: () => void
  canGoNext?: boolean
}

export function StepNavigation({
  currentStep,
  completedSteps,
  onStepChange,
  onNext,
  onPrevious,
  canGoNext = true,
}: StepNavigationProps) {
  const t = useTranslations('editor')
  const STEPS = STEP_KEYS.map((s) => ({ id: s.id, label: t(s.key) }))
  const isFirst = currentStep === 1
  const isLast = currentStep === 4

  const handleStepClick = useCallback(
    (step: number) => {
      onStepChange(step)
    },
    [onStepChange]
  )

  return (
    <div data-testid="step-nav" className="space-y-0">
      {/* Step indicators */}
      <nav aria-label={t('nav.stepsLabel')} className="px-1 py-3">
        <ol className="flex items-center">
          {STEPS.map((step, index) => {
            const isCurrent = step.id === currentStep
            const isCompleted = completedSteps.includes(step.id)
            const isPast = step.id < currentStep

            return (
              <li key={step.id} className={cn('flex items-center', index < STEPS.length - 1 ? 'flex-1' : 'shrink-0')}>
                <button
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={t('nav.stepLabel', { id: step.id, label: step.label }) + (isCompleted ? ` ${t('nav.completed')}` : '')}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors duration-150',
                      isPast || isCompleted
                        ? 'bg-accent text-accent-fg'
                        : isCurrent
                          ? 'border-2 border-foreground bg-surface text-foreground'
                          : 'border-2 border-border-light bg-surface text-muted-foreground',
                    )}
                  >
                    {(isPast || isCompleted) ? <Check className="h-3 w-3" strokeWidth={2.5} /> : step.id}
                  </div>
                  <span className={cn(
                    'text-[12px] whitespace-nowrap',
                    isCurrent ? 'text-foreground font-medium' : isPast || isCompleted ? 'text-foreground' : 'text-muted',
                  )}>
                    {step.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2 transition-colors duration-150 mb-5',
                      isPast || isCompleted ? 'bg-accent' : 'bg-border-light',
                    )}
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Bottom navigation buttons */}
      <div className="flex items-center justify-end gap-3 pt-6 px-1 border-t border-border-light">
        {!isFirst && (
          <VzBtn
            variant="secondary"
            size="sm"
            data-testid="step-prev"
            onClick={onPrevious}
            aria-label={t('nav.previousStep')}
          >
            {t('nav.previous')}
          </VzBtn>
        )}

        <VzBtn
          variant="primary"
          data-testid="step-next"
          onClick={onNext}
          disabled={isLast || !canGoNext}
          aria-label={isLast ? t('nav.lastStep') : t('nav.nextStep')}
        >
          <span className="hidden sm:inline">
            {isLast ? t('steps.publish') : t('nav.next')}
          </span>
          {!isLast && <ArrowRight className="h-4 w-4" />}
        </VzBtn>
      </div>
    </div>
  )
}
