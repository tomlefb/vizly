'use client'

import { useState, useEffect } from 'react'
import {
  Maximize2,
  X,
  Check,
  Loader2,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react'
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
]

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
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

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

  // ── Bottom bar (shared across all layouts) ──
  const bottomBar = (
    <div className="shrink-0 h-16 bg-white/80 backdrop-blur-sm border-t border-border/50 px-6 flex items-center">
      <div className="flex items-center justify-between w-full">
        {currentStepIndex > 0 ? (
          <button
            type="button"
            onClick={() => { const prev = STEPS[currentStepIndex - 1]; if (prev) onStepChange(prev.id) }}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-warm transition-colors"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Precedent
          </button>
        ) : <span />}
        {saveIndicator}
        <div className="flex items-center gap-3">
          {bottomBarExtra}
          {nextStep ? (
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className={cn(
                'group inline-flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-2.5 text-sm font-semibold transition-all duration-200',
                canGoNext
                  ? 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-[0_2px_8px_rgba(212,99,78,0.2)]'
                  : 'bg-surface-warm text-muted-foreground/40 cursor-not-allowed'
              )}
            >
              Suivant
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : <span />}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        {/* ── Stepper ── */}
        <div className="shrink-0 border-b border-[#E5E7EB] bg-white px-4 sm:px-6 py-4">
          <nav className="flex items-center w-full" aria-label="Etapes editeur">
            {STEPS.map((step, index) => {
              const isActive = currentStep === step.id
              const isPast = index < currentStepIndex

              return (
                <div key={step.id} className={cn('flex items-center', index < STEPS.length - 1 ? 'flex-1' : 'shrink-0')}>
                  <button
                    type="button"
                    onClick={() => onStepChange(step.id)}
                    className="flex flex-col items-center gap-1.5 shrink-0"
                  >
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full transition-colors duration-150',
                        isActive || isPast
                          ? 'bg-[#E8553D]'
                          : 'border-2 border-[#E5E7EB] bg-white',
                      )}
                    />
                    <span className={cn(
                      'text-[12px] font-medium hidden sm:inline whitespace-nowrap',
                      isActive ? 'text-[#111827]' : isPast ? 'text-[#111827]' : 'text-[#9CA3AF]',
                    )}>
                      {step.label}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-2 transition-colors duration-150',
                        isPast ? 'bg-[#E8553D]' : 'bg-[#E5E7EB]',
                      )}
                    />
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* ── Main content ── */}
        {isDesignStep ? (
          /* Step 4: Split — config left (35%) + preview right (65%) */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex min-h-0">
              {/* Config panel */}
              <div className="w-[35%] overflow-y-auto border-r border-border/50 px-4 sm:px-5 py-5">
                {children}
              </div>
              {/* Preview panel */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Minimal preview bar — no browser chrome */}
                <div className="shrink-0 flex items-center justify-between border-b border-border/50 bg-white/60 backdrop-blur-sm px-4 h-10">
                  <span />
                  <span className="text-[11px] text-muted font-mono tracking-wide">pseudo.vizly.fr</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setPreviewDevice('desktop')}
                      className={cn('flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors', previewDevice === 'desktop' ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground')}
                      title="Desktop" aria-label="Vue desktop">
                      <Monitor className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setPreviewDevice('tablet')}
                      className={cn('flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors', previewDevice === 'tablet' ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground')}
                      title="Tablet" aria-label="Vue tablette">
                      <Tablet className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setPreviewDevice('mobile')}
                      className={cn('flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors', previewDevice === 'mobile' ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground')}
                      title="Mobile" aria-label="Vue mobile">
                      <Smartphone className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-px h-4 bg-border/50 mx-0.5" />
                    <button type="button" onClick={() => setPreviewOpen(true)}
                      className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:text-foreground transition-colors"
                      title="Plein ecran" aria-label="Plein ecran">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {/* Preview area */}
                <div className="flex-1 overflow-hidden relative flex justify-center p-4" style={{ backgroundColor: previewBg }}>
                  {TemplateComponent ? (
                    <div className={cn(
                      'overflow-y-auto rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-border/30 transition-all duration-300',
                      previewDevice === 'mobile' ? 'w-[375px] h-full' : previewDevice === 'tablet' ? 'w-[768px] h-full' : 'absolute inset-4 rounded-lg'
                    )}>
                      {portfolioData.font && (
                        <style>{`
                          .editor-preview-font h1, .editor-preview-font h2, .editor-preview-font h3, .editor-preview-font h4, .editor-preview-font h5, .editor-preview-font h6 { font-family: "${portfolioData.font}", system-ui, sans-serif !important; }
                          .editor-preview-font p, .editor-preview-font span, .editor-preview-font li, .editor-preview-font a, .editor-preview-font td, .editor-preview-font input, .editor-preview-font textarea, .editor-preview-font label { font-family: "${portfolioData.font_body ?? portfolioData.font}", system-ui, sans-serif !important; }
                        `}</style>
                      )}
                      <div className="origin-top-left editor-preview-font"
                        style={{
                          width: previewDevice === 'mobile' ? '375px' : previewDevice === 'tablet' ? '768px' : '1280px',
                          minHeight: '200vh',
                          transform: previewDevice === 'mobile' ? 'none' : previewDevice === 'tablet' ? 'scale(0.75)' : 'scale(0.55)',
                          transformOrigin: 'top left',
                        }}>
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
            {bottomBar}
          </div>
        ) : (
          /* Steps 1, 2, 3, 5: Full width form */
          <div className="flex-1 flex flex-col min-h-0">
            <div className={cn(
              'flex-1 overflow-y-auto px-5 py-5',
              isPublishStep && 'flex items-start justify-center'
            )}>
              <div className={cn(isPublishStep && 'w-full max-w-lg')}>
                {children}
              </div>
            </div>
            {bottomBar}
          </div>
        )}
      </div>

      {/* ── Fullscreen preview modal ── */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="flex flex-col h-full">
            {/* Minimal header */}
            <div className="shrink-0 flex items-center justify-between border-b border-border/50 px-6 h-12">
              <span className="text-[11px] text-muted font-mono tracking-wide">pseudo.vizly.fr</span>
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
