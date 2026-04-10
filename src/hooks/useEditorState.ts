'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  upsertPortfolio,
  publishPortfolio,
} from '@/actions/portfolio'
import {
  createProject,
  updateProject,
  deleteProject,
} from '@/actions/projects'
import {
  getBillingStatus,
  createSubscriptionCheckoutAction,
  createTemplateCheckoutAction,
} from '@/actions/billing'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import { parseSections, parseSkills } from '@/types/sections'
import { parseCustomBlocks } from '@/types/custom-blocks'
import { parseKpis } from '@/types/kpis'
import { parseLayoutBlocks } from '@/types/layout-blocks'
import type { Portfolio, Project } from '@/types'
import type { PortfolioFormData, ProjectFormData } from '@/lib/validations'
import type { TemplateName } from '@/types/templates'
import type { SaveStatus } from '@/hooks/useEditorAutoSave'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

type LocalProject = ProjectFormData & { _dbId?: string }

interface UseEditorStateOptions {
  initialPortfolio: Portfolio | null
  initialProjects: Project[]
  pendingPhotoFileRef: MutableRefObject<File | null>
  setSaveStatus: Dispatch<SetStateAction<SaveStatus>>
  setSaveError: Dispatch<SetStateAction<string | null>>
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function portfolioToFormData(p: Portfolio): PortfolioFormData {
  return {
    title: p.title,
    bio: p.bio ?? undefined,
    photo_url: p.photo_url ?? '',
    template: p.template,
    primary_color: p.primary_color,
    secondary_color: p.secondary_color,
    font: p.font,
    font_body: p.font_body ?? p.font,
    social_links: (p.social_links as Record<string, string> | null) ?? undefined,
    contact_email: p.contact_email ?? '',
    skills: parseSkills(p.skills),
    sections: parseSections(p.sections),
    custom_blocks: parseCustomBlocks(p.custom_blocks),
    kpis: parseKpis(p.kpis),
    layout_blocks: parseLayoutBlocks(p.layout_blocks),
  }
}

function projectToLocal(p: Project): LocalProject {
  return {
    _dbId: p.id,
    title: p.title,
    description: p.description ?? '',
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    external_link: p.external_link ?? '',
    tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
    display_order: p.display_order,
  }
}

const DEFAULT_PORTFOLIO: PortfolioFormData = {
  title: '',
  bio: '',
  photo_url: '',
  template: 'minimal',
  primary_color: '#D4634E',
  secondary_color: '#1A1A1A',
  font: 'DM Sans',
  font_body: 'DM Sans',
  social_links: undefined,
  contact_email: '',
  skills: [],
  sections: undefined,
  custom_blocks: [],
  kpis: [],
  layout_blocks: [],
}

// ------------------------------------------------------------------
// Hook
// ------------------------------------------------------------------

export function useEditorState({
  initialPortfolio,
  initialProjects,
  pendingPhotoFileRef,
  setSaveStatus,
  setSaveError,
}: UseEditorStateOptions) {
  const router = useRouter()

  // ---- Core state ------------------------------------------------

  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [portfolioData, setPortfolioData] = useState<PortfolioFormData>(
    initialPortfolio ? portfolioToFormData(initialPortfolio) : DEFAULT_PORTFOLIO
  )
  const [projects, setProjects] = useState<LocalProject[]>(
    initialProjects.map(projectToLocal)
  )
  const [portfolioId, setPortfolioId] = useState<string | null>(
    initialPortfolio?.id ?? null
  )
  const [slug, setSlug] = useState(initialPortfolio?.slug ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ---- Billing state ---------------------------------------------

  const [billingPlan, setBillingPlan] = useState<'free' | 'starter' | 'pro'>('free')
  const [purchasedTemplates, setPurchasedTemplates] = useState<TemplateName[]>([])
  const [billingLoading, setBillingLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const previousProjectsRef = useRef<LocalProject[]>(
    initialProjects.map(projectToLocal)
  )

  // ---- Load billing status on mount -----------------------------

  useEffect(() => {
    let cancelled = false

    async function loadBilling() {
      setBillingLoading(true)
      const result = await getBillingStatus()
      if (cancelled) return
      setBillingPlan(result.plan)
      setPurchasedTemplates(result.purchasedTemplates as TemplateName[])
      setBillingLoading(false)
    }

    void loadBilling()

    return () => {
      cancelled = true
    }
  }, [])

  // ---- Field change handler --------------------------------------

  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      setErrors((prev) => {
        if (prev[field]) {
          const next = { ...prev }
          delete next[field]
          return next
        }
        return prev
      })

      if (field === 'photo_url' && typeof value === 'string' && value.startsWith('blob:')) {
        void (async () => {
          try {
            const response = await fetch(value)
            const blob = await response.blob()
            const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' })
            pendingPhotoFileRef.current = file
          } catch {
            // If fetch fails, still set the blob URL for local preview
          }
        })()

        setPortfolioData((prev) => ({ ...prev, photo_url: value }))
        return
      }

      setPortfolioData((prev) => {
        const updated = { ...prev, [field]: value }

        if (field === 'layout_blocks' && Array.isArray(value)) {
          const blocks = value as Array<{ id: string }>
          const currentSections = [...(updated.sections ?? [])] as Array<{ id: string; visible: boolean; order: number }>
          const existingIds = new Set(currentSections.filter((s) => s.id.startsWith('layout-')).map((s) => s.id))
          const newIds = new Set(blocks.map((b) => `layout-${b.id}`))
          let maxOrder = currentSections.reduce((max, s) => Math.max(max, s.order), 0)
          for (const block of blocks) {
            const sectionId = `layout-${block.id}`
            if (!existingIds.has(sectionId)) {
              maxOrder++
              currentSections.push({ id: sectionId, visible: true, order: maxOrder })
            }
          }
          updated.sections = currentSections.filter(
            (s) => !s.id.startsWith('layout-') || newIds.has(s.id)
          )
        }

        if (field === 'custom_blocks' && Array.isArray(value)) {
          const blocks = value as Array<{ id: string }>
          const currentSections = [...(updated.sections ?? [])] as Array<{ id: string; visible: boolean; order: number }>
          const existingCustomIds = new Set(currentSections.filter((s) => s.id.startsWith('custom-')).map((s) => s.id))
          const newCustomIds = new Set(blocks.map((b) => `custom-${b.id}`))

          let maxOrder = currentSections.reduce((max, s) => Math.max(max, s.order), 0)
          for (const block of blocks) {
            const sectionId = `custom-${block.id}`
            if (!existingCustomIds.has(sectionId)) {
              maxOrder++
              currentSections.push({ id: sectionId, visible: true, order: maxOrder })
            }
          }

          updated.sections = currentSections.filter(
            (s) => !s.id.startsWith('custom-') || newCustomIds.has(s.id)
          )
        }

        return updated
      })
    },
    [pendingPhotoFileRef]
  )

  // ---- Projects change handler -----------------------------------

  const handleProjectsChange = useCallback((updated: ProjectFormData[]) => {
    setProjects((prev) => {
      return updated.map((p, i) => {
        const prevAtIndex = prev[i]
        if (prevAtIndex && prevAtIndex._dbId && prevAtIndex.title === p.title) {
          return { ...p, _dbId: prevAtIndex._dbId }
        }
        const match = prev.find(
          (old) =>
            old._dbId &&
            old.title === p.title &&
            old.description === p.description
        )
        if (match) {
          return { ...p, _dbId: match._dbId }
        }
        return { ...p }
      })
    })
  }, [])

  // ---- Validation ------------------------------------------------

  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: Record<string, string> = {}

      if (step === 1) {
        if (!portfolioData.title.trim()) {
          newErrors['title'] = 'Le nom est requis'
        }
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    [portfolioData.title]
  )

  const canGoNext = useMemo(() => {
    if (currentStep === 1) {
      if (!portfolioData.title.trim()) return false
      const links = portfolioData.social_links ?? {}
      for (const val of Object.values(links)) {
        const url = typeof val === 'string' ? val : ''
        if (url.trim()) {
          try { new URL(url) } catch { return false }
        }
      }
      if (portfolioData.contact_email && portfolioData.contact_email.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(portfolioData.contact_email)) return false
      }
      return true
    }
    if (currentStep === 2) return true
    if (currentStep === 3) {
      if (!portfolioData.template.trim()) return false
      const config = TEMPLATE_CONFIGS.find((t) => t.name === portfolioData.template)
      if (config?.isPremium && !purchasedTemplates.includes(config.name)) return false
      return true
    }
    return false
  }, [currentStep, portfolioData.title, portfolioData.template, portfolioData.social_links, portfolioData.contact_email, purchasedTemplates])

  // ---- Project sync on leaving step 2 ----------------------------

  const syncProjectsWithId = useCallback(
    async (pId: string) => {
      setSaveStatus('saving')

      const prev = previousProjectsRef.current
      const current = projects

      const currentDbIds = new Set(
        current.filter((p) => p._dbId).map((p) => p._dbId)
      )
      const deletedProjects = prev.filter(
        (p) => p._dbId && !currentDbIds.has(p._dbId)
      )

      for (const dp of deletedProjects) {
        if (dp._dbId) {
          const result = await deleteProject(dp._dbId)
          if (result.error) {
            setSaveStatus('error')
            setSaveError(result.error)
            return
          }
        }
      }

      const updatedProjects: LocalProject[] = []
      for (const p of current) {
        if (p._dbId) {
          const result = await updateProject(p._dbId, {
            title: p.title,
            description: p.description,
            images: p.images,
            external_link: p.external_link,
            tags: p.tags,
            display_order: p.display_order,
          })
          if (result.error) {
            setSaveStatus('error')
            setSaveError(result.error)
            return
          }
          updatedProjects.push({ ...p, _dbId: result.data?.id ?? p._dbId })
        } else {
          const result = await createProject(pId, {
            title: p.title,
            description: p.description,
            images: p.images,
            external_link: p.external_link,
            tags: p.tags,
            display_order: p.display_order,
          })
          if (result.error) {
            setSaveStatus('error')
            setSaveError(result.error)
            return
          }
          updatedProjects.push({ ...p, _dbId: result.data?.id ?? undefined })
        }
      }

      setProjects(updatedProjects)
      previousProjectsRef.current = updatedProjects
      setSaveStatus('saved')
      setSaveError(null)
    },
    [projects, setSaveStatus, setSaveError]
  )

  const syncProjects = useCallback(async () => {
    if (!portfolioId) {
      if (portfolioData.title.trim()) {
        setSaveStatus('saving')
        const result = await upsertPortfolio(portfolioData)
        if (result.data) {
          setPortfolioId(result.data.id)
          await syncProjectsWithId(result.data.id)
        }
        setSaveStatus(result.error ? 'error' : 'saved')
        if (result.error) setSaveError(result.error)
      }
      return
    }
    await syncProjectsWithId(portfolioId)
  }, [portfolioId, portfolioData, syncProjectsWithId, setSaveStatus, setSaveError])

  // ---- Navigation ------------------------------------------------

  const handleNext = useCallback(async () => {
    if (!validateStep(currentStep)) return

    setCompletedSteps((prev) =>
      prev.includes(currentStep) ? prev : [...prev, currentStep]
    )

    if (currentStep === 2) {
      await syncProjects()
    }

    const stepOrder = [1, 2, 3, 4]
    const currentIndex = stepOrder.indexOf(currentStep)
    const nextStepId = stepOrder[currentIndex + 1]
    if (nextStepId !== undefined) {
      setCurrentStep(nextStepId)
    }
  }, [currentStep, validateStep, syncProjects])

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }, [])

  const handleStepChange = useCallback(
    async (step: number) => {
      if (currentStep === 2 && step !== 2) {
        await syncProjects()
      }
      setCurrentStep(step)
    },
    [currentStep, syncProjects]
  )

  // ---- Template purchase ------------------------------------------

  const handleTemplatePurchase = useCallback(
    async (templateId: TemplateName) => {
      setCheckoutLoading(true)
      setSaveError(null)

      try {
        const saveResult = await upsertPortfolio(portfolioData)
        if (saveResult.data) {
          setPortfolioId(saveResult.data.id)
          await syncProjectsWithId(saveResult.data.id)
        }

        const result = await createTemplateCheckoutAction(templateId)

        if (result.error) {
          setSaveError(result.error)
          setCheckoutLoading(false)
          return
        }

        if (result.url) {
          window.location.href = result.url
        }
      } catch {
        setSaveError("Erreur lors de la redirection vers le paiement")
        setCheckoutLoading(false)
      }
    },
    [portfolioData, syncProjectsWithId, setSaveError]
  )

  const selectedTemplateConfig = useMemo(
    () => TEMPLATE_CONFIGS.find((t) => t.name === portfolioData.template),
    [portfolioData.template]
  )

  const selectedTemplateNeedsPurchase = useMemo(() => {
    if (!selectedTemplateConfig) return false
    if (!selectedTemplateConfig.isPremium) return false
    return !purchasedTemplates.includes(selectedTemplateConfig.name)
  }, [selectedTemplateConfig, purchasedTemplates])

  // ---- Publish ---------------------------------------------------

  const handlePublish = useCallback(async () => {
    setIsPublishing(true)
    setSaveError(null)

    try {
      const result = await upsertPortfolio({ ...portfolioData })

      if (result.error) {
        setSaveError(result.error)
        setIsPublishing(false)
        return
      }

      if (result.data) {
        setPortfolioId(result.data.id)
      }

      const pId = result.data?.id ?? portfolioId
      if (pId) {
        await syncProjectsWithId(pId)
      }

      if (billingPlan === 'free') {
        const checkoutResult = await createSubscriptionCheckoutAction('starter')

        if (checkoutResult.error) {
          setSaveError(checkoutResult.error)
          setIsPublishing(false)
          return
        }

        if (checkoutResult.url) {
          window.location.href = checkoutResult.url
          return
        }
      }

      const publishResult = await publishPortfolio(slug)

      if (publishResult.error) {
        setSaveError(publishResult.error)
        setIsPublishing(false)
        return
      }

      router.push(`/portfolio/${slug}`)
    } catch {
      setSaveError('Erreur lors de la publication')
    } finally {
      setIsPublishing(false)
    }
  }, [billingPlan, portfolioData, portfolioId, router, slug, syncProjectsWithId, setSaveError])

  // ---- Derived data for step components --------------------------

  const projectsForUI: ProjectFormData[] = useMemo(
    () =>
      projects.map(({ _dbId: _, ...rest }) => rest),
    [projects]
  )

  return {
    currentStep,
    completedSteps,
    portfolioData,
    setPortfolioData,
    projects,
    projectsForUI,
    portfolioId,
    setPortfolioId,
    slug,
    setSlug,
    errors,
    billingPlan,
    purchasedTemplates,
    billingLoading,
    checkoutLoading,
    isPublishing,
    canGoNext,
    selectedTemplateConfig,
    selectedTemplateNeedsPurchase,
    handleFieldChange,
    handleProjectsChange,
    handleNext,
    handlePrevious,
    handleStepChange,
    handleTemplatePurchase,
    handlePublish,
  }
}
