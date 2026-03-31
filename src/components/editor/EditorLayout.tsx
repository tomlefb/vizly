'use client'

import { useState } from 'react'
import { Eye, X, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { templateMap } from '@/components/templates'
import type { PortfolioFormData, ProjectFormData } from '@/lib/validations'
import type { TemplateName } from '@/types/templates'

const TABS = [
  { id: 1, label: 'Infos' },
  { id: 2, label: 'Projets' },
  { id: 3, label: 'Style' },
  { id: 5, label: 'Publier' },
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
  onStepChange,
  portfolioData,
  projects,
  children,
}: EditorLayoutProps) {
  const [fullPreview, setFullPreview] = useState(false)
  const [mobileShowPreview, setMobileShowPreview] = useState(false)

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
        {/* Tab bar */}
        <div className="shrink-0 border-b border-border bg-background px-4 sm:px-6 flex items-center justify-between">
          <nav className="flex items-center gap-0" aria-label="Onglets editeur">
            {TABS.map((tab) => {
              const isActive = currentStep === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onStepChange(tab.id)}
                  className={cn(
                    'relative px-4 py-3.5 text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'text-accent'
                      : 'text-muted hover:text-foreground'
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent rounded-t-full" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Preview toggle (mobile) + fullscreen button */}
          <div className="flex items-center gap-2">
            {!isPublishStep && (
              <button
                type="button"
                onClick={() => setMobileShowPreview(!mobileShowPreview)}
                className="lg:hidden inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-warm hover:text-foreground"
              >
                <Eye className="h-3.5 w-3.5" />
                {mobileShowPreview ? 'Formulaire' : 'Apercu'}
              </button>
            )}
            {!isPublishStep && (
              <button
                type="button"
                onClick={() => setFullPreview(true)}
                className="hidden lg:inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-warm hover:text-foreground"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Plein ecran
              </button>
            )}
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
                'flex-1 overflow-y-auto px-4 sm:px-6 py-6',
                'lg:max-w-[50%] lg:border-r lg:border-border',
                mobileShowPreview ? 'hidden lg:block' : 'block'
              )}
            >
              {children}
            </div>

            {/* Live preview panel — real template */}
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

                {/* Scaled template render */}
                <div className="flex-1 overflow-hidden bg-white relative">
                  {TemplateComponent ? (
                    <div className="absolute inset-0 overflow-y-auto">
                      <div
                        className="origin-top-left"
                        style={{
                          width: '1280px',
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
            {/* Modal header */}
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

            {/* Full template render */}
            <div className="flex-1 overflow-y-auto">
              {TemplateComponent && <TemplateComponent {...templateProps} />}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
