'use client'

import { useState, useEffect } from 'react'
import { Eye, X, Maximize2, Check, Loader2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { templateMap } from '@/components/templates'
import type { PortfolioFormData, ProjectFormData } from '@/lib/validations'
import type { TemplateName } from '@/types/templates'

const STEPS = [
  { id: 1, label: 'Infos' },
  { id: 2, label: 'Projets' },
  { id: 3, label: 'Style' },
  { id: 5, label: 'Publier' },
] as const

/** Load a Google Font dynamically */
function useGoogleFont(fontName: string) {
  useEffect(() => {
    if (!fontName) return
    const family = fontName.replace(/ /g, '+')
    const id = `gfont-editor-${family}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${family}:wght@300;400;500;600;700&display=swap`
    document.head.appendChild(link)
    return () => {
      const el = document.getElementById(id)
      if (el) el.remove()
    }
  }, [fontName])
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface EditorLayoutProps {
  currentStep: number
  completedSteps: number[]
  onStepChange: (step: number) => void
  onNext: () => void
  onPrevious: () => void
  canGoNext?: boolean
  portfolioData: PortfolioFormData
  projects: ProjectFormData[]
  saveStatus?: SaveStatus
  saveError?: string | null
  children: React.ReactNode
}

export function EditorLayout({
  currentStep,
  onStepChange,
  onNext,
  canGoNext = true,
  portfolioData,
  projects,
  saveStatus = 'idle',
  saveError,
  children,
}: EditorLayoutProps) {
  const [fullPreview, setFullPreview] = useState(false)
  const [mobileShowPreview, setMobileShowPreview] = useState(false)

  useGoogleFont(portfolioData.font)

  const isPublishStep = currentStep === 5
  const isLastBeforePublish = currentStep === 3
  const TemplateComponent = templateMap[portfolioData.template as TemplateName]
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)
  const nextStep = STEPS[currentStepIndex + 1]

  const templateProps = {
    portfolio: {
      title: portfolioData.title || 'Mon portfolio',
      bio: portfolioData.bio ?? null,
      photo_url: portfolioData.photo_url || null,
      primary_color: portfolioData.primary_color,
      secondary_color: portfolioData.secondary_color,
      font: portfolioData.font,
      social_links: portfolioData.social_links ?? null,
      contact_email: portfolioData.contact_email ?? null,
    },
    projects: projects.map((p) => ({
      id: p.title,
      title: p.title,
      description: p.description || null,
      images: p.images,
      external_link: p.external_link || null,
      tags: p.tags,
      display_order: p.display_order,
    })),
    isPremium: false,
  }

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        {/* Step bar */}
        <div className="shrink-0 border-b border-border bg-background px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-1 flex-1" aria-label="Etapes editeur">
              {STEPS.map((step, index) => {
                const stepIndex = STEPS.findIndex((s) => s.id === step.id)
                const isActive = currentStep === step.id
                const isPast = stepIndex < currentStepIndex
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      type="button"
                      onClick={() => onStepChange(step.id)}
                      className="flex items-center gap-2 group"
                    >
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 shrink-0',
                          isActive
                            ? 'bg-accent text-white shadow-[0_2px_8px_rgba(232,85,61,0.25)]'
                            : isPast
                              ? 'bg-accent/10 text-accent'
                              : 'bg-surface-warm text-muted-foreground group-hover:bg-border-light'
                        )}
                      >
                        {isPast ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : index + 1}
                      </div>
                      <span className={cn(
                        'text-xs font-medium hidden sm:inline transition-colors',
                        isActive ? 'text-foreground' : 'text-muted group-hover:text-foreground'
                      )}>
                        {step.label}
                      </span>
                    </button>
                    {index < STEPS.length - 1 && (
                      <div className="flex-1 mx-2">
                        <div className="h-0.5 rounded-full bg-border-light overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              isPast ? 'bg-accent w-full' : isActive ? 'bg-accent w-1/2' : 'w-0'
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>

            {/* Right side: fixed-width zone for save + buttons */}
            <div className="flex items-center gap-2 ml-4 shrink-0">
              {/* Save indicator — fixed width to prevent layout shift */}
              <div className="w-24 flex justify-end">
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="hidden sm:inline">Sauvegarde...</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1.5 text-xs text-success">
                    <Check className="h-3 w-3" />
                    <span className="hidden sm:inline">Sauvegarde</span>
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-xs text-destructive truncate">
                    {saveError ?? 'Erreur'}
                  </span>
                )}
              </div>

              {!isPublishStep && (
                <button
                  type="button"
                  onClick={() => setMobileShowPreview(!mobileShowPreview)}
                  className="lg:hidden inline-flex items-center justify-center rounded-[var(--radius-md)] border border-border w-8 h-8 text-muted transition-colors hover:bg-surface-warm"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              )}
              {!isPublishStep && (
                <button
                  type="button"
                  onClick={() => setFullPreview(true)}
                  className="hidden lg:inline-flex items-center justify-center rounded-[var(--radius-md)] border border-border w-8 h-8 text-muted transition-colors hover:bg-surface-warm hover:text-foreground"
                  title="Plein ecran"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        {isPublishStep ? (
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <div className="max-w-3xl mx-auto">{children}</div>
          </div>
        ) : (
          <div className="flex-1 flex min-h-0">
            {/* Form panel */}
            <div
              className={cn(
                'flex-1 flex flex-col overflow-hidden',
                'lg:max-w-[50%] lg:border-r lg:border-border',
                mobileShowPreview ? 'hidden lg:flex' : 'flex'
              )}
            >
              {/* Scrollable form */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
                {children}
              </div>

              {/* Bottom bar with Précédent / Suivant */}
              <div className="shrink-0 border-t border-border bg-background px-4 sm:px-6 py-3 flex items-center justify-between">
                {currentStepIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => { const prev = STEPS[currentStepIndex - 1]; if (prev) onStepChange(prev.id) }}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Precedent
                  </button>
                ) : (
                  <span />
                )}
                {nextStep && (
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={!canGoNext}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-semibold transition-all duration-200',
                      canGoNext
                        ? 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-[0_2px_8px_rgba(232,85,61,0.2)]'
                        : 'bg-surface-warm text-muted-foreground/40 cursor-not-allowed'
                    )}
                  >
                    {isLastBeforePublish ? 'Publier' : 'Suivant'}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Live preview panel */}
            <div
              className={cn(
                'overflow-hidden',
                'lg:flex-1 lg:block',
                mobileShowPreview ? 'block flex-1' : 'hidden lg:block'
              )}
            >
              <div className="h-full flex flex-col">
                {/* Browser chrome */}
                <div className="shrink-0 flex items-center gap-2 border-b border-border bg-surface-warm px-3 py-2">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF6259]" />
                    <span className="w-2 h-2 rounded-full bg-[#FFBF2F]" />
                    <span className="w-2 h-2 rounded-full bg-[#29CE42]" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="rounded-[3px] bg-background border border-border-light px-2.5 py-0.5 text-[10px] text-muted font-mono">
                      pseudo.vizly.fr
                    </div>
                  </div>
                  <span className="text-[9px] text-muted-foreground/60 font-medium capitalize">
                    {portfolioData.template}
                  </span>
                </div>

                {/* Scaled template render — neutral bg fills empty space */}
                <div className="flex-1 overflow-hidden bg-neutral-100 relative">
                  {TemplateComponent ? (
                    <div className="absolute inset-0 overflow-y-auto">
                      {portfolioData.font && (
                        <style>{`
                          .editor-preview-font * {
                            font-family: "${portfolioData.font}", system-ui, sans-serif !important;
                          }
                        `}</style>
                      )}
                      <div
                        className="origin-top-left editor-preview-font"
                        style={{
                          width: '1280px',
                          minHeight: '200vh',
                          transform: 'scale(0.5)',
                          transformOrigin: 'top left',
                        }}
                      >
                        <TemplateComponent {...templateProps} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-muted">Aucun template selectionne</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full-screen preview modal */}
      {fullPreview && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="flex flex-col h-full">
            <div className="shrink-0 flex items-center justify-between border-b border-border px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6259]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFBF2F]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#29CE42]" />
                </div>
                <div className="rounded bg-surface-warm border border-border px-3 py-0.5 text-xs text-muted font-mono">
                  pseudo.vizly.fr
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFullPreview(false)}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-warm"
              >
                <X className="h-4 w-4" />
                Fermer
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {portfolioData.font && (
                <style>{`
                  .editor-fullpreview-font * {
                    font-family: "${portfolioData.font}", system-ui, sans-serif !important;
                  }
                `}</style>
              )}
              <div className="editor-fullpreview-font">
                {TemplateComponent && <TemplateComponent {...templateProps} />}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
