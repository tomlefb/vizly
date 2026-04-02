'use client'

import { useCallback } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Profil', short: 'Profil' },
  { id: 2, label: 'Contenu', short: 'Contenu' },
  { id: 3, label: 'Design', short: 'Design' },
  { id: 4, label: 'Publier', short: 'Publier' },
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
      <div className="flex items-center justify-end gap-3 pt-6 px-1 border-t border-[#E5E7EB]">
        {!isFirst && (
          <button
            type="button"
            data-testid="step-prev"
            onClick={onPrevious}
            className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors duration-150"
            aria-label="Etape precedente"
          >
            Precedent
          </button>
        )}

        <button
          type="button"
          data-testid="step-next"
          onClick={onNext}
          disabled={isLast || !canGoNext}
          className={cn(
            'inline-flex items-center gap-2 h-10 rounded-lg px-5 text-sm font-medium transition-colors duration-150',
            isLast || !canGoNext
              ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
              : 'bg-[#E8553D] text-white hover:bg-[#D4442E]'
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
