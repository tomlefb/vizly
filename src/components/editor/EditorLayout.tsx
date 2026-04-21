'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Maximize2,
  X,
  Check,
  Loader2,
  ArrowRight,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { VzBtn } from '@/components/ui/vizly'
import { templateMap } from '@/components/templates'
import { DEFAULT_SECTIONS, parseSections } from '@/types/sections'
import { parseKpis } from '@/types/kpis'
import { parseLayoutBlocks } from '@/types/layout-blocks'
import type { PortfolioFormData, ProjectFormData } from '@/lib/validations'
import type { TemplateName } from '@/types/templates'

const STEP_KEYS = [
  { id: 1, key: 'steps.profile' },
  { id: 2, key: 'steps.content' },
  { id: 3, key: 'steps.design' },
  { id: 4, key: 'steps.publish' },
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
  bottomBarExtra?: React.ReactNode
  children: React.ReactNode
  billingPlan?: 'free' | 'starter' | 'pro'
  portfolioSlug?: string | null
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
  billingPlan = 'free',
  portfolioSlug = null,
}: EditorLayoutProps) {
  const t = useTranslations('editor')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  useGoogleFont(portfolioData.font)
  useGoogleFont(portfolioData.font_body ?? portfolioData.font)

  const STEPS = STEP_KEYS.map((s) => ({ id: s.id, label: t(s.key) }))
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)
  const nextStep = STEPS[currentStepIndex + 1]
  const isDesignStep = currentStep === 3

  const TemplateComponent = templateMap[portfolioData.template as TemplateName]

  const templateProps = {
    portfolio: {
      title: portfolioData.title || 'Mon portfolio',
      bio: portfolioData.bio ?? null,
      photo_url: portfolioData.photo_url || null,
      primary_color: portfolioData.primary_color,
      secondary_color: portfolioData.secondary_color,
      body_color: portfolioData.body_color ?? portfolioData.secondary_color,
      background_color: portfolioData.background_color ?? '#FFFFFF',
      font: portfolioData.font,
      font_body: portfolioData.font_body ?? portfolioData.font,
      social_links: portfolioData.social_links ?? null,
      contact_email: portfolioData.contact_email ?? null,
      contact_form_enabled: portfolioData.contact_form_enabled ?? false,
      contact_form_title: portfolioData.contact_form_title ?? 'Me contacter',
      contact_form_description: portfolioData.contact_form_description ?? '',
      slug: portfolioSlug ?? 'preview',
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
    isPremium: billingPlan === 'pro',
    isPreview: true,
  }

  const saveIndicator = (
    <div className="flex items-center">
      {saveStatus === 'saving' && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          {t('save.saving')}
        </span>
      )}
      {saveStatus === 'saved' && (
        <span className="flex items-center gap-1.5 text-xs text-success">
          <Check className="h-3 w-3" />
          {t('save.saved')}
        </span>
      )}
      {saveStatus === 'error' && (
        <span className="text-xs text-destructive truncate">{saveError ?? t('save.error')}</span>
      )}
    </div>
  )

  const previewBg = portfolioData.background_color
    ?? (portfolioData.template === 'dark' ? '#0A0A0A'
      : portfolioData.template === 'colore' ? '#FFF5E6'
      : '#FAF8F6')

  // ── Bottom bar (shared across all layouts) ──
  const bottomBar = (
    <div className="shrink-0 h-16 bg-surface border-t border-border-light px-6 flex items-center">
      <div className="flex items-center justify-between w-full">
        {saveIndicator}
        <div className="flex items-center gap-3">
          {bottomBarExtra}
          {currentStepIndex > 0 && (
            <VzBtn
              variant="secondary"
              size="sm"
              onClick={() => { const prev = STEPS[currentStepIndex - 1]; if (prev) onStepChange(prev.id) }}
            >
              {t('nav.previous')}
            </VzBtn>
          )}
          {nextStep ? (
            <VzBtn
              variant="primary"
              onClick={onNext}
              disabled={!canGoNext}
            >
              {t('nav.next')}
              <ArrowRight className="h-4 w-4" />
            </VzBtn>
          ) : <span />}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        {/* ── Stepper ── */}
        <div className="shrink-0 border-b border-border-light bg-surface px-4 sm:px-6 py-4">
          <nav className="flex items-center w-full" aria-label={t('nav.stepsLabel')}>
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
                        'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors duration-150',
                        isPast
                          ? 'bg-accent text-accent-fg'
                          : isActive
                            ? 'border-2 border-foreground bg-surface text-foreground'
                            : 'border-2 border-border-light bg-surface text-muted-foreground',
                      )}
                    >
                      {isPast ? <Check className="h-3 w-3" strokeWidth={2.5} /> : step.id}
                    </div>
                    <span className={cn(
                      'text-[12px] hidden sm:inline whitespace-nowrap',
                      isActive ? 'text-foreground font-medium' : isPast ? 'text-foreground' : 'text-muted',
                    )}>
                      {step.label}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-2 transition-colors duration-150 mb-5',
                        isPast ? 'bg-accent' : 'bg-border-light',
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
              <div className="w-[35%] overflow-y-auto border-r border-border-light bg-surface-warm px-4 sm:px-5 py-5">
                {children}
              </div>
              {/* Preview panel */}
              <div className="flex-1 flex flex-col overflow-hidden bg-surface-warm">
                {/* Minimal preview bar — no browser chrome */}
                <div className="shrink-0 flex items-center justify-between border-b border-border-light bg-surface/60 backdrop-blur-sm px-4 h-10">
                  <span />
                  <span className="text-[11px] text-muted font-mono tracking-wide">{t('preview.url')}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setPreviewDevice('desktop')}
                      className={cn('flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors', previewDevice === 'desktop' ? 'bg-surface-sunken text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-surface-sunken')}
                      title={t('preview.desktop')} aria-label={t('preview.desktop')}>
                      <Monitor className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setPreviewDevice('tablet')}
                      className={cn('flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors', previewDevice === 'tablet' ? 'bg-surface-sunken text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-surface-sunken')}
                      title={t('preview.tablet')} aria-label={t('preview.tablet')}>
                      <Tablet className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setPreviewDevice('mobile')}
                      className={cn('flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors', previewDevice === 'mobile' ? 'bg-surface-sunken text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-surface-sunken')}
                      title={t('preview.mobile')} aria-label={t('preview.mobile')}>
                      <Smartphone className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-px h-4 bg-border-light mx-0.5" />
                    <button type="button" onClick={() => setPreviewOpen(true)}
                      className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:text-foreground hover:bg-surface-sunken transition-colors"
                      title={t('preview.fullscreen')} aria-label={t('preview.fullscreen')}>
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {/* Preview area */}
                <div className="flex-1 overflow-hidden relative flex justify-center p-4" style={{ backgroundColor: previewBg }}>
                  {TemplateComponent ? (
                    <div className={cn(
                      'overflow-y-auto rounded-[var(--radius-lg)] shadow-[var(--shadow-card-hover)] border border-border-light transition-all duration-300',
                      previewDevice === 'mobile' ? 'w-[375px] h-full' : previewDevice === 'tablet' ? 'w-[768px] h-full' : 'absolute inset-4'
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
                      <p className="text-sm text-muted">{t('preview.noTemplate')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {bottomBar}
          </div>
        ) : (
          /* Steps 1, 2, 4: Full width form */
          <div className="flex-1 flex flex-col min-h-0 bg-surface-warm">
            <div className="flex-1 overflow-y-auto px-8 lg:px-12 py-8">
              {children}
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
            <div className="shrink-0 flex items-center justify-between border-b border-border-light bg-surface px-6 h-12">
              <span className="text-[11px] text-muted font-mono tracking-wide">{t('preview.url')}</span>
              <VzBtn
                variant="secondary"
                size="sm"
                onClick={() => setPreviewOpen(false)}
              >
                <X className="h-4 w-4" />
                {t('preview.close')}
              </VzBtn>
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
