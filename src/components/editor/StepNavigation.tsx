'use client'

import { useCallback } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
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
      <nav aria-label="Etapes de l'editeur" className="px-1 py-3">
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
                  aria-label={`Etape ${step.id}: ${step.label}${isCompleted ? ' (completee)' : ''}`}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <div
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition-colors duration-150',
                      isCurrent || isPast || isCompleted
                        ? 'bg-[#E8553D]'
                        : 'border-2 border-[#E5E7EB] bg-white',
                    )}
                  />
                  <span className={cn(
                    'text-[12px] font-medium whitespace-nowrap',
                    isCurrent ? 'text-[#111827]' : isPast || isCompleted ? 'text-[#111827]' : 'text-[#9CA3AF]',
                  )}>
                    {step.short}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2 transition-colors duration-150',
                      isPast || isCompleted ? 'bg-[#E8553D]' : 'bg-[#E5E7EB]',
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
