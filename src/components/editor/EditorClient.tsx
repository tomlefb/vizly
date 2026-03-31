'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { useImageUpload } from '@/hooks/useImageUpload'
import { upsertPortfolio, publishPortfolio } from '@/actions/portfolio'
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
import { EditorLayout } from './EditorLayout'
import { StepPersonalInfo } from './StepPersonalInfo'
import { StepProjects } from './StepProjects'
import { StepCustomization } from './StepCustomization'
import { StepPublish } from './StepPublish'
import { parseSections, parseSkills } from '@/types/sections'
import type { Portfolio, Project } from '@/types'
import type { PortfolioFormData, ProjectFormData } from '@/lib/validations'
import type { TemplateName } from '@/types/templates'

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

/** Local project with optional DB id for sync tracking */
type LocalProject = ProjectFormData & { _dbId?: string }

interface EditorClientProps {
  initialPortfolio: Portfolio | null
  initialProjects: Project[]
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

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
    social_links: (p.social_links as Record<string, string> | null) ?? undefined,
    contact_email: p.contact_email ?? '',
    skills: parseSkills(p.skills),
    sections: parseSections(p.sections),
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
  primary_color: '#E8553D',
  secondary_color: '#1A1A1A',
  font: 'DM Sans',
  social_links: undefined,
  contact_email: '',
  skills: [],
  sections: undefined,
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

export function EditorClient({
  initialPortfolio,
  initialProjects,
}: EditorClientProps) {
  const router = useRouter()
  const { uploadImage } = useImageUpload()

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

  // ---- Save state ------------------------------------------------

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)

  // Ref to track the previous projects for diff on step exit
  const previousProjectsRef = useRef<LocalProject[]>(
    initialProjects.map(projectToLocal)
  )

  // Ref to track whether a photo upload is pending (blob URL)
  const pendingPhotoFileRef = useRef<File | null>(null)

  // ---- Auto-save debounce ----------------------------------------

  const debouncedPortfolio = useDebounce(portfolioData, 1500)

  // Track whether this is the first render to skip the initial save
  const isInitialMountRef = useRef(true)

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      return
    }

    // Do not auto-save if title is empty (nothing meaningful to persist)
    if (!debouncedPortfolio.title.trim()) return

    let cancelled = false

    async function save() {
      setSaveStatus('saving')
      setSaveError(null)

      // If there is a pending photo upload, do it first
      if (pendingPhotoFileRef.current) {
        const file = pendingPhotoFileRef.current
        pendingPhotoFileRef.current = null

        const uploadResult = await uploadImage(file)
        if (uploadResult.url) {
          // Update the form data with the real URL before saving
          debouncedPortfolio.photo_url = uploadResult.url
          // Also update local state so the UI shows the persisted URL
          if (!cancelled) {
            setPortfolioData((prev) => ({
              ...prev,
              photo_url: uploadResult.url ?? prev.photo_url,
            }))
          }
        } else if (uploadResult.error) {
          if (!cancelled) {
            setSaveStatus('error')
            setSaveError(uploadResult.error)
          }
          return
        }
      }

      const result = await upsertPortfolio(debouncedPortfolio)

      if (cancelled) return

      if (result.error) {
        setSaveStatus('error')
        setSaveError(result.error)
      } else {
        setSaveStatus('saved')
        setSaveError(null)
        if (result.data) {
          setPortfolioId(result.data.id)
        }
      }
    }

    void save()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPortfolio])

  // Fade saved indicator after 2s
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

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
      // Clear field error on change
      setErrors((prev) => {
        if (prev[field]) {
          const next = { ...prev }
          delete next[field]
          return next
        }
        return prev
      })

      // Special case: photo_url from StepPersonalInfo sends a blob URL
      // We need to intercept the File from the input and upload it
      if (field === 'photo_url' && typeof value === 'string' && value.startsWith('blob:')) {
        // The actual File will be captured via the fileInputRef in StepPersonalInfo.
        // Since we can't get the File from a blob URL directly, we fetch it back.
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

        // Set the blob URL for immediate local preview
        setPortfolioData((prev) => ({ ...prev, photo_url: value }))
        return
      }

      setPortfolioData((prev) => ({
        ...prev,
        [field]: value,
      }))
    },
    []
  )

  // ---- Projects change handler -----------------------------------

  const handleProjectsChange = useCallback((updated: ProjectFormData[]) => {
    // ProjectFormData from StepProjects doesn't have _dbId,
    // but we must preserve existing _dbId from our local state.
    setProjects((prev) => {
      return updated.map((p, i) => {
        // If there's a matching previous project at the same index with same title,
        // preserve its _dbId. Otherwise check if it exists by title match as fallback.
        const prevAtIndex = prev[i]
        if (prevAtIndex && prevAtIndex._dbId && prevAtIndex.title === p.title) {
          return { ...p, _dbId: prevAtIndex._dbId }
        }
        // Search for a project with the same _dbId by matching title and description
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

      // Step 2: always valid (0 projects is ok)
      // Step 3: template is always set (has default 'minimal')

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    [portfolioData.title]
  )

  const canGoNext = useMemo(() => {
    if (currentStep === 1) return portfolioData.title.trim() !== ''
    if (currentStep === 2) return true
    if (currentStep === 3) return portfolioData.template.trim() !== ''
    return false // Step 5 (Publish) is handled by StepPublish
  }, [currentStep, portfolioData.title, portfolioData.template])

  // ---- Project sync on leaving step 2 ----------------------------

  const syncProjects = useCallback(async () => {
    if (!portfolioId) {
      // No portfolio yet -- save portfolio first, then sync projects
      if (portfolioData.title.trim()) {
        setSaveStatus('saving')
        const result = await upsertPortfolio(portfolioData)
        if (result.data) {
          setPortfolioId(result.data.id)
          // Now sync with the new portfolio id
          await syncProjectsWithId(result.data.id)
        }
        setSaveStatus(result.error ? 'error' : 'saved')
        if (result.error) setSaveError(result.error)
      }
      return
    }
    await syncProjectsWithId(portfolioId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioId, projects, portfolioData])

  const syncProjectsWithId = useCallback(
    async (pId: string) => {
      setSaveStatus('saving')

      const prev = previousProjectsRef.current
      const current = projects

      // Detect deleted projects (had _dbId in prev, not in current)
      const currentDbIds = new Set(
        current.filter((p) => p._dbId).map((p) => p._dbId)
      )
      const deletedProjects = prev.filter(
        (p) => p._dbId && !currentDbIds.has(p._dbId)
      )

      // Process deletes
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

      // Process creates and updates
      const updatedProjects: LocalProject[] = []
      for (const p of current) {
        if (p._dbId) {
          // Update existing
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
          // Create new
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

      // Update local state with DB ids
      setProjects(updatedProjects)
      previousProjectsRef.current = updatedProjects
      setSaveStatus('saved')
      setSaveError(null)
    },
    [projects]
  )

  // ---- Navigation ------------------------------------------------

  const handleNext = useCallback(async () => {
    if (!validateStep(currentStep)) return

    // Mark current step as complete
    setCompletedSteps((prev) =>
      prev.includes(currentStep) ? prev : [...prev, currentStep]
    )

    // Sync projects when leaving step 2
    if (currentStep === 2) {
      await syncProjects()
    }

    // Navigate to next step in the STEPS sequence (1 → 2 → 3 → 5)
    const stepOrder = [1, 2, 3, 5]
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
      // Sync projects when leaving step 2
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
        // Save portfolio + projects BEFORE redirecting to Stripe
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
    [portfolioData, syncProjectsWithId]
  )

  // ---- Check if selected template needs purchase ----------------

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
      // Ensure portfolio is saved with all latest data
      const result = await upsertPortfolio({ ...portfolioData })

      if (result.error) {
        setSaveError(result.error)
        setIsPublishing(false)
        return
      }

      if (result.data) {
        setPortfolioId(result.data.id)
      }

      // Sync projects one final time
      const pId = result.data?.id ?? portfolioId
      if (pId) {
        await syncProjectsWithId(pId)
      }

      // If user is on free plan, redirect to Stripe Checkout for subscription
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

      // Paid users: publish directly
      // Set slug + published = true via Server Action
      const publishResult = await publishPortfolio(slug)

      if (publishResult.error) {
        setSaveError(publishResult.error)
        setIsPublishing(false)
        return
      }

      // Redirect to the live portfolio
      router.push(`/portfolio/${slug}`)
    } catch {
      setSaveError('Erreur lors de la publication')
    } finally {
      setIsPublishing(false)
    }
  }, [billingPlan, portfolioData, portfolioId, router, slug, syncProjectsWithId])

  // ---- Derived data for step components --------------------------

  // Strip _dbId from projects for the UI components that expect plain ProjectFormData
  const projectsForUI: ProjectFormData[] = useMemo(
    () =>
      projects.map(({ _dbId: _unusedDbId, ...rest }) => rest),
    [projects]
  )

  // ---- Render ----------------------------------------------------

  return (
    <div className="fixed inset-0 left-0 lg:left-64 bg-background z-40">
      <EditorLayout
        saveStatus={saveStatus}
        saveError={saveError}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepChange={handleStepChange}
        onNext={handleNext}
        onPrevious={handlePrevious}
        canGoNext={canGoNext}
        portfolioData={portfolioData}
        projects={projectsForUI}
      >
        {currentStep === 1 && (
          <StepPersonalInfo
            data={portfolioData}
            onChange={handleFieldChange}
            errors={errors}
          />
        )}
        {currentStep === 2 && (
          <StepProjects
            projects={projectsForUI}
            onProjectsChange={handleProjectsChange}
          />
        )}
        {currentStep === 3 && (
          <div className="space-y-4">
            <StepCustomization
              data={portfolioData}
              onChange={handleFieldChange}
              purchasedTemplates={purchasedTemplates}
            />
            {/* Premium template purchase banner */}
            {selectedTemplateNeedsPurchase && selectedTemplateConfig && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mx-auto max-w-lg rounded-[var(--radius-lg)] border border-accent/20 bg-accent/5 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <Loader2 className={cn('h-4 w-4 text-accent', checkoutLoading ? 'animate-spin' : 'hidden')} />
                    <svg
                      className={cn('h-4 w-4 text-accent', checkoutLoading && 'hidden')}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Template &laquo; {selectedTemplateConfig.label} &raquo; est premium
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Achete ce template une seule fois pour l&apos;utiliser a vie dans ton portfolio.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleTemplatePurchase(selectedTemplateConfig.name)}
                      disabled={checkoutLoading}
                      className={cn(
                        'mt-3 inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-semibold transition-all duration-200',
                        checkoutLoading
                          ? 'bg-accent/40 text-white/60 cursor-not-allowed'
                          : 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-[0_2px_8px_rgba(232,85,61,0.2)]'
                      )}
                    >
                      {checkoutLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Redirection...
                        </>
                      ) : (
                        'Acheter ce template (2.99 EUR)'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
        {currentStep === 5 && (
          <StepPublish
            data={portfolioData}
            projects={projectsForUI}
            slug={slug}
            onSlugChange={setSlug}
            onPublish={handlePublish}
            isPublishing={isPublishing}
            billingPlan={billingPlan}
            selectedTemplateNeedsPurchase={selectedTemplateNeedsPurchase}
          />
        )}
      </EditorLayout>
    </div>
  )
}
