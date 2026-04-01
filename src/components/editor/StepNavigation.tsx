'use client'

import { useCallback } from 'react'
import { Check, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Infos', short: 'Infos' },
  { id: 2, label: 'Projets', short: 'Projets' },
  { id: 3, label: 'Style', short: 'Style' },
  { id: 4, label: 'Preview', short: 'Preview' },
  { id: 5, label: 'Publier', short: 'Publier' },
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
  const isFirst = currentStep === 1
  const isLast = currentStep === 5

  const handleStepClick = useCallback(
    (step: number) => {
      onStepChange(step)
    },
    [onStepChange]
  )

  return (
    <div data-testid="step-nav" className="space-y-0">
      {/* Step indicators */}
      <nav aria-label="Etapes de l'editeur" className="px-1">
        <ol className="flex items-center gap-1">
          {STEPS.map((step, index) => {
            const isCurrent = step.id === currentStep
            const isCompleted = completedSteps.includes(step.id)
            const isPast = step.id < currentStep

            return (
              <li key={step.id} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Etape ${step.id}: ${step.label}${isCompleted ? ' (completee)' : ''}`}
                  className={cn(
                    'group relative flex w-full flex-col items-center gap-1.5 py-3 transition-all duration-200'
                  )}
                >
                  {/* Step pill */}
                  <div
                    className={cn(
                      'flex h-8 items-center gap-1.5 rounded-[var(--radius-full)] px-3 text-xs font-semibold transition-all duration-200',
                      isCurrent
                        ? 'bg-accent text-white shadow-[0_2px_8px_rgba(212,99,78,0.25)]'
                        : isCompleted || isPast
                          ? 'bg-accent/10 text-accent group-hover:bg-accent/15'
                          : 'bg-surface-warm text-muted-foreground group-hover:bg-border-light group-hover:text-foreground'
                    )}
                  >
                    {isCompleted && !isCurrent ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    ) : (
                      <span className="tabular-nums">{step.id}</span>
                    )}
                    <span className="hidden sm:inline">{step.short}</span>
                  </div>

                  {/* Progress bar beneath */}
                  <div className="w-full h-0.5 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        isCurrent
                          ? 'bg-accent w-1/2'
                          : isCompleted || isPast
                            ? 'bg-accent w-full'
                            : 'bg-border-light w-full'
                      )}
                    />
                  </div>
                </button>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-px w-4 shrink-0 -mt-3 transition-colors duration-300',
                      isPast || isCompleted ? 'bg-accent/30' : 'bg-border-light'
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
      <div className="flex items-center justify-between pt-6 px-1 border-t border-border-light">
        <button
          type="button"
          data-testid="step-prev"
          onClick={onPrevious}
          disabled={isFirst}
          className={cn(
            'inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium transition-all duration-200',
            isFirst
              ? 'text-muted-foreground/40 cursor-not-allowed'
              : 'text-foreground hover:bg-surface-warm active:scale-[0.98]'
          )}
          aria-label="Etape precedente"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Precedent</span>
        </button>

        <button
          type="button"
          data-testid="step-next"
          onClick={onNext}
          disabled={isLast || !canGoNext}
          className={cn(
            'inline-flex items-center gap-2 rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-semibold transition-all duration-200',
            isLast || !canGoNext
              ? 'bg-surface-warm text-muted-foreground/40 cursor-not-allowed'
              : 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-[0_2px_8px_rgba(212,99,78,0.2)]'
          )}
          aria-label={isLast ? 'Derniere etape' : 'Etape suivante'}
        >
          <span className="hidden sm:inline">
            {isLast ? 'Publier' : 'Suivant'}
          </span>
          {!isLast && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
