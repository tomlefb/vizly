'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { VzBtn } from '@/components/ui/vizly'
import { useImageUpload } from '@/hooks/useImageUpload'
import { useEditorAutoSave, type SaveStatus } from '@/hooks/useEditorAutoSave'
import { useEditorState } from '@/hooks/useEditorState'
import { EditorLayout } from './EditorLayout'
import { StepPersonalInfo } from './StepPersonalInfo'
import { StepContent } from './StepContent'
import { StepCustomization } from './StepCustomization'
import { StepPublish } from './StepPublish'
import { TemplatePurchaseModal } from '@/components/billing/TemplatePurchaseModal'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import type { KpiItem } from '@/types/kpis'
import type { LayoutBlock } from '@/types/layout-blocks'
import type { Portfolio, Project } from '@/types'
import { useSidebar } from '@/app/(dashboard)/sidebar-context'

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface EditorClientProps {
  initialPortfolio: Portfolio | null
  initialProjects: Project[]
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

export function EditorClient({
  initialPortfolio,
  initialProjects,
}: EditorClientProps) {
  const t = useTranslations('editor')
  const { uploadImage } = useImageUpload()
  const { sidebarWidth } = useSidebar()

  // Shared save state — written by both auto-save and editor state hooks
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const pendingPhotoFileRef = useRef<File | null>(null)

  const editor = useEditorState({
    initialPortfolio,
    initialProjects,
    pendingPhotoFileRef,
    setSaveStatus,
    setSaveError,
  })

  useEditorAutoSave({
    portfolioData: editor.portfolioData,
    setPortfolioData: editor.setPortfolioData,
    portfolioId: editor.portfolioId,
    setPortfolioId: editor.setPortfolioId,
    uploadImage,
    pendingPhotoFileRef,
    setSaveStatus,
    setSaveError,
  })

  // Fade saved indicator after 2s
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  // ---- Render ----------------------------------------------------

  return (
    <>
    <style>{`.vizly-editor{left:0}@media(min-width:1024px){.vizly-editor{left:${sidebarWidth}px;transition:left 200ms ease-out}}`}</style>
    <div className="vizly-editor fixed inset-y-0 right-0 z-40 bg-surface-warm">
      <EditorLayout
        saveStatus={saveStatus}
        saveError={saveError}
        currentStep={editor.currentStep}
        completedSteps={editor.completedSteps}
        onStepChange={editor.handleStepChange}
        onNext={editor.handleNext}
        onPrevious={editor.handlePrevious}
        canGoNext={editor.canGoNext}
        portfolioData={editor.portfolioData}
        projects={editor.projectsForUI}
        bottomBarExtra={
          editor.currentStep === 3 && editor.selectedTemplateNeedsPurchase && editor.selectedTemplateConfig ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {t('templatePremium', { label: editor.selectedTemplateConfig.label })}
              </span>
              <VzBtn
                variant="primary"
                size="sm"
                onClick={() => {
                  const cfg = editor.selectedTemplateConfig
                  if (cfg) void editor.handleTemplatePurchase(cfg.name)
                }}
                disabled={editor.checkoutLoading}
              >
                {editor.checkoutLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t('redirecting')}
                  </>
                ) : (
                  t('buyTemplate')
                )}
              </VzBtn>
            </div>
          ) : undefined
        }
      >
        {/* Step 1: Profil */}
        {editor.currentStep === 1 && (
          <StepPersonalInfo
            data={editor.portfolioData}
            onChange={editor.handleFieldChange}
            errors={editor.errors}
          />
        )}
        {/* Step 2: Contenu (projets + blocs texte + KPIs + colonnes) */}
        {editor.currentStep === 2 && (
          <StepContent
            projects={editor.projectsForUI}
            onProjectsChange={editor.handleProjectsChange}
            customBlocks={editor.portfolioData.custom_blocks ?? []}
            onCustomBlocksChange={(blocks) => editor.handleFieldChange('custom_blocks', blocks)}
            kpis={(editor.portfolioData.kpis ?? []) as KpiItem[]}
            onKpisChange={(kpis) => editor.handleFieldChange('kpis', kpis)}
            layoutBlocks={(editor.portfolioData.layout_blocks ?? []) as LayoutBlock[]}
            onLayoutBlocksChange={(blocks) => editor.handleFieldChange('layout_blocks', blocks)}
          />
        )}
        {/* Step 3: Design */}
        {editor.currentStep === 3 && (
          <StepCustomization
            data={editor.portfolioData}
            onChange={editor.handleFieldChange}
            purchasedTemplates={editor.purchasedTemplates}
          />
        )}
        {editor.currentStep === 4 && (
          <StepPublish
            data={editor.portfolioData}
            projects={editor.projectsForUI}
            slug={editor.slug}
            onSlugChange={editor.setSlug}
            onSaveDraft={editor.saveDraft}
            onPublishNow={editor.publishNow}
            isPublished={editor.isPortfolioPublished}
            publishedSlug={editor.publishedSlug}
            billingPlan={editor.billingPlan}
            selectedTemplateNeedsPurchase={editor.selectedTemplateNeedsPurchase}
          />
        )}
      </EditorLayout>
    </div>
    {editor.purchaseModalTemplate && (
      <TemplatePurchaseModal
        open={editor.purchaseModalTemplate !== null}
        onClose={editor.handlePurchaseModalClose}
        templateId={editor.purchaseModalTemplate}
        templateLabel={
          TEMPLATE_CONFIGS.find((tpl) => tpl.name === editor.purchaseModalTemplate)?.label ??
          editor.purchaseModalTemplate
        }
        onSuccess={() => void editor.handlePurchaseModalSuccess()}
        onAlreadyOwned={() => void editor.handlePurchaseModalSuccess()}
      />
    )}
    </>
  )
}
