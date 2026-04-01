'use client'

import { useState, useEffect } from 'react'
import { Maximize2, X, Check, Loader2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { templateMap } from '@/components/templates'
import { DEFAULT_SECTIONS, parseSections } from '@/types/sections'
import { parseKpis } from '@/types/kpis'
import { parseLayoutBlocks } from '@/types/layout-blocks'
import type { PortfolioFormData, ProjectFormData } from '@/lib/validations'
import type { TemplateName } from '@/types/templates'

const STEPS = [
  { id: 1, label: 'Profil' },
  { id: 2, label: 'Projets' },
  { id: 3, label: 'Contenu' },
  { id: 4, label: 'Design' },
  { id: 5, label: 'Publier' },
] as const

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
  /** Extra content rendered in the bottom bar next to the Suivant button (e.g. premium indicator) */
  bottomBarExtra?: React.ReactNode
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
  bottomBarExtra,
  children,
}: EditorLayoutProps) {
  const [previewOpen, setPreviewOpen] = useState(false)

  useGoogleFont(portfolioData.font)
  useGoogleFont(portfolioData.font_body ?? portfolioData.font)

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)
  const nextStep = STEPS[currentStepIndex + 1]
  const isDesignStep = currentStep === 4
  const isPublishStep = currentStep === 5

  const TemplateComponent = templateMap[portfolioData.template as TemplateName]

  const templateProps = {
    portfolio: {
      title: portfolioData.title || 'Mon portfolio',
      bio: portfolioData.bio ?? null,
      photo_url: portfolioData.photo_url || null,
      primary_color: portfolioData.primary_color,
      secondary_color: portfolioData.secondary_color,
      font: portfolioData.font,
      font_body: portfolioData.font_body ?? portfolioData.font,
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
    skills: portfolioData.skills ?? [],
    sections: parseSections(portfolioData.sections ?? DEFAULT_SECTIONS),
    customBlocks: portfolioData.custom_blocks ?? [],
    kpis: parseKpis(portfolioData.kpis ?? []),
    layoutBlocks: parseLayoutBlocks(portfolioData.layout_blocks ?? []),
    isPremium: false,
  }

  const saveIndicator = (
    <div className="flex items-center">
      {saveStatus === 'saving' && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Sauvegarde...
        </span>
      )}
      {saveStatus === 'saved' && (
        <span className="flex items-center gap-1.5 text-xs text-success">
          <Check className="h-3 w-3" />
          Sauvegarde
        </span>
      )}
      {saveStatus === 'error' && (
        <span className="text-xs text-destructive truncate">{saveError ?? 'Erreur'}</span>
      )}
    </div>
  )

  const previewBg = portfolioData.template === 'dark' ? '#0A0A0A'
    : portfolioData.template === 'colore' ? '#FFF5E6'
    : '#FAFAF8'

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        {/* Step bar — steps only, centered */}
        <div className="shrink-0 border-b border-border bg-background px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-1 w-full" aria-label="Etapes editeur">
            {STEPS.map((step, index) => {
              const stepIndex = STEPS.findIndex((s) => s.id === step.id)
              const isActive = currentStep === step.id
              const isPast = stepIndex < currentStepIndex
              return (
                <div key={step.id} className={cn('flex items-center', index < STEPS.length - 1 ? 'flex-1' : 'shrink-0')}>
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
                        <div className={cn(
                          'h-full rounded-full transition-all duration-300',
                          isPast ? 'bg-accent w-full' : isActive ? 'bg-accent w-1/2' : 'w-0'
                        )} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Main content — varies by step */}
        {isPublishStep ? (
          /* Step 5: Same layout as steps 1-3 with Précédent button */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
              <div className="max-w-2xl mx-auto">
                {children}
              </div>
            </div>
            {/* Bottom bar: Précédent + save */}
            <div className="shrink-0 border-t border-border bg-background px-4 sm:px-6 py-3 min-h-16 flex items-center">
              <div className="flex items-center justify-between w-full">
                <button type="button"
                  onClick={() => { const prev = STEPS[currentStepIndex - 1]; if (prev) onStepChange(prev.id) }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground">
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Precedent
                </button>
                {saveIndicator}
              </div>
            </div>
          </div>
        ) : isDesignStep ? (
          /* Step 4: Split screen — form (35%) + preview (65%) + full-width bottom bar */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex min-h-0">
              {/* Left panel: form */}
              <div className="w-[35%] overflow-y-auto border-r border-border px-4 sm:px-6 py-6">
                {children}
              </div>
              {/* Right panel: preview */}
              <div className="flex-1 flex flex-col overflow-hidden">
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
                {/* Scaled template */}
                <div className="flex-1 overflow-hidden relative" style={{ backgroundColor: previewBg }}>
                  {TemplateComponent ? (
                    <div className="absolute inset-0 overflow-y-auto">
                      {portfolioData.font && (
                        <style>{`
                          .editor-preview-font h1, .editor-preview-font h2, .editor-preview-font h3, .editor-preview-font h4, .editor-preview-font h5, .editor-preview-font h6 { font-family: "${portfolioData.font}", system-ui, sans-serif !important; }
                          .editor-preview-font p, .editor-preview-font span, .editor-preview-font li, .editor-preview-font a, .editor-preview-font td, .editor-preview-font input, .editor-preview-font textarea, .editor-preview-font label { font-family: "${portfolioData.font_body ?? portfolioData.font}", system-ui, sans-serif !important; }
                        `}</style>
                      )}
                      <div className="origin-top-left editor-preview-font"
                        style={{ width: '1280px', minHeight: '200vh', transform: 'scale(0.55)', transformOrigin: 'top left' }}>
                        <TemplateComponent {...templateProps} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-muted">Aucun template selectionne</p>
                    </div>
                  )}
                  {/* Fullscreen button overlay */}
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-background/80 border border-border backdrop-blur-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground shadow-sm"
                    title="Plein ecran"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            {/* Full-width bottom bar */}
            {nextStep && (
              <div className="shrink-0 border-t border-border bg-background px-4 sm:px-6 py-3 min-h-16 flex items-center">
                <div className="flex items-center justify-between w-full">
                  <button type="button"
                    onClick={() => { const prev = STEPS[currentStepIndex - 1]; if (prev) onStepChange(prev.id) }}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground">
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Precedent
                  </button>
                  {saveIndicator}
                  <div className="flex items-center gap-3">
                    {bottomBarExtra}
                    <button type="button" onClick={onNext} disabled={!canGoNext}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-semibold transition-all duration-200',
                        canGoNext
                          ? 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-[0_2px_8px_rgba(232,85,61,0.2)]'
                          : 'bg-surface-warm text-muted-foreground/40 cursor-not-allowed'
                      )}>
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Steps 1, 2, 3: Full width form */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
              <div className="max-w-2xl mx-auto">
                {children}
              </div>
            </div>
            {/* Bottom bar: Précédent / Suivant */}
            {nextStep && (
              <div className="shrink-0 border-t border-border bg-background px-4 sm:px-6 py-3 min-h-16 flex items-center">
                <div className="flex items-center justify-between w-full">
                  {currentStepIndex > 0 ? (
                    <button type="button"
                      onClick={() => { const prev = STEPS[currentStepIndex - 1]; if (prev) onStepChange(prev.id) }}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground">
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      Precedent
                    </button>
                  ) : <span />}
                  {saveIndicator}
                  <button type="button" onClick={onNext} disabled={!canGoNext}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-semibold transition-all duration-200',
                      canGoNext
                        ? 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-[0_2px_8px_rgba(232,85,61,0.2)]'
                        : 'bg-surface-warm text-muted-foreground/40 cursor-not-allowed'
                    )}>
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview modal (steps 1-3) */}
      {previewOpen && (
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
              <button type="button" onClick={() => setPreviewOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-warm">
                <X className="h-4 w-4" />
                Fermer
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ backgroundColor: previewBg }}>
              {portfolioData.font && (
                <style>{`
                  .modal-preview-font h1, .modal-preview-font h2, .modal-preview-font h3, .modal-preview-font h4, .modal-preview-font h5, .modal-preview-font h6 { font-family: "${portfolioData.font}", system-ui, sans-serif !important; }
                  .modal-preview-font p, .modal-preview-font span, .modal-preview-font li, .modal-preview-font a, .modal-preview-font td, .modal-preview-font input, .modal-preview-font textarea, .modal-preview-font label { font-family: "${portfolioData.font_body ?? portfolioData.font}", system-ui, sans-serif !important; }
                `}</style>
              )}
              <div className="modal-preview-font">
                {TemplateComponent && <TemplateComponent {...templateProps} />}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
