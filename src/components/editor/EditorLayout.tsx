'use client'

import { useState } from 'react'
import { Eye, PenLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StepNavigation } from './StepNavigation'
import { LivePreview } from './LivePreview'
import type { PortfolioFormData, ProjectFormData } from '@/lib/validations'

const STEP_TITLES = [
  'Informations personnelles',
  'Tes projets',
  'Personnalisation',
  'Apercu',
  'Publication',
] as const

interface EditorLayoutProps {
  currentStep: number
  completedSteps: number[]
  onStepChange: (step: number) => void
  onNext: () => void
  onPrevious: () => void
  canGoNext?: boolean
  portfolioData: PortfolioFormData
  projects: ProjectFormData[]
  children: React.ReactNode
}

export function EditorLayout({
  currentStep,
  completedSteps,
  onStepChange,
  onNext,
  onPrevious,
  canGoNext,
  portfolioData,
  projects,
  children,
}: EditorLayoutProps) {
  const [mobileShowPreview, setMobileShowPreview] = useState(false)

  const stepTitle = STEP_TITLES[currentStep - 1] ?? ''

  // Steps 4 (Preview) and 5 (Publish) are full-width — no split view
  const isFullWidth = currentStep === 4 || currentStep === 5

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar with step navigation */}
      <div className="shrink-0 border-b border-border bg-background px-4 sm:px-6 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Etape {currentStep}/5
            </p>
            <h1 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)] mt-0.5">
              {stepTitle}
            </h1>
          </div>

          {/* Mobile preview toggle — only visible on small screens when NOT in full-width steps */}
          {!isFullWidth && (
            <button
              type="button"
              onClick={() => setMobileShowPreview(!mobileShowPreview)}
              className="lg:hidden inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-surface-warm hover:text-foreground"
              aria-label={mobileShowPreview ? 'Voir le formulaire' : 'Voir l\'apercu'}
            >
              {mobileShowPreview ? (
                <>
                  <PenLine className="h-3.5 w-3.5" />
                  Formulaire
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Apercu
                </>
              )}
            </button>
          )}
        </div>

        <StepNavigation
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepChange={onStepChange}
          onNext={onNext}
          onPrevious={onPrevious}
          canGoNext={canGoNext}
        />
      </div>

      {/* Main content area */}
      {isFullWidth ? (
        /* Full-width for Preview and Publish steps */
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-3xl mx-auto">
            {children}
          </div>
        </div>
      ) : (
        /* Split view for editing steps */
        <div className="flex-1 flex min-h-0">
          {/* Form panel (left) */}
          <div
            className={cn(
              'flex-1 overflow-y-auto px-4 sm:px-6 py-6',
              'lg:max-w-[55%] lg:border-r lg:border-border',
              mobileShowPreview ? 'hidden lg:block' : 'block'
            )}
          >
            {children}
          </div>

          {/* Preview panel (right) */}
          <div
            className={cn(
              'overflow-y-auto p-4',
              'lg:flex-1 lg:block',
              mobileShowPreview ? 'block flex-1' : 'hidden lg:block'
            )}
          >
            <div className="sticky top-0">
              <LivePreview data={portfolioData} projects={projects} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
