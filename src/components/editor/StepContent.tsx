'use client'

import Link from 'next/link'
import { useId } from 'react'
import { Lock, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProjectsEditor } from './ProjectsEditor'
import { ContentBlocksEditor } from './ContentBlocksEditor'
import type { ProjectFormData } from '@/lib/validations'
import type { CustomBlock } from '@/types/custom-blocks'
import type { KpiItem } from '@/types/kpis'
import type { LayoutBlock } from '@/types/layout-blocks'

interface StepContentProps {
  projects: ProjectFormData[]
  onProjectsChange: (projects: ProjectFormData[]) => void
  customBlocks: CustomBlock[]
  onCustomBlocksChange: (blocks: CustomBlock[]) => void
  kpis: KpiItem[]
  onKpisChange: (kpis: KpiItem[]) => void
  layoutBlocks: LayoutBlock[]
  onLayoutBlocksChange: (blocks: LayoutBlock[]) => void
  contactEmail: string
  onContactEmailChange: (email: string) => void
  billingPlan: 'free' | 'starter' | 'pro'
  className?: string
}

export function StepContent({
  projects, onProjectsChange,
  customBlocks, onCustomBlocksChange,
  kpis, onKpisChange,
  layoutBlocks, onLayoutBlocksChange,
  contactEmail, onContactEmailChange,
  billingPlan,
  className,
}: StepContentProps) {
  return (
    <div className={cn('space-y-10', className)} data-testid="step-content">
      <div className="flex flex-col lg:flex-row lg:gap-12">
        <ProjectsEditor
          projects={projects}
          onProjectsChange={onProjectsChange}
        />
        <ContentBlocksEditor
          customBlocks={customBlocks}
          onCustomBlocksChange={onCustomBlocksChange}
          kpis={kpis}
          onKpisChange={onKpisChange}
          layoutBlocks={layoutBlocks}
          onLayoutBlocksChange={onLayoutBlocksChange}
        />
      </div>

      <div className="border-b border-border-light" />

      <ContactFormSection
        billingPlan={billingPlan}
        contactEmail={contactEmail}
        onContactEmailChange={onContactEmailChange}
      />
    </div>
  )
}

interface ContactFormSectionProps {
  billingPlan: 'free' | 'starter' | 'pro'
  contactEmail: string
  onContactEmailChange: (email: string) => void
}

function ContactFormSection({
  billingPlan,
  contactEmail,
  onContactEmailChange,
}: ContactFormSectionProps) {
  const id = useId()
  const isPro = billingPlan === 'pro'

  return (
    <section className="space-y-4" data-testid="contact-form-section">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
            Formulaire de contact
          </h3>
          <p className="text-sm text-muted mt-1">
            Les visiteurs de ton portfolio peuvent t&apos;envoyer un message directement.
          </p>
        </div>
        {!isPro && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
            <Lock className="h-3 w-3" strokeWidth={2} />
            Pro
          </span>
        )}
      </div>

      {isPro ? (
        <div className="max-w-md">
          <label
            htmlFor={`${id}-contact-email`}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Email de réception
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
            />
            <input
              id={`${id}-contact-email`}
              data-testid="input-contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => onContactEmailChange(e.target.value)}
              placeholder="contact@example.com"
              className="h-10 w-full rounded-[var(--radius-md)] border border-border-light bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:border-foreground focus:outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            Les messages envoyés depuis ton portfolio arriveront à cette adresse.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-light bg-surface-warm p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <p className="text-sm font-medium text-foreground">
              Active le formulaire de contact avec le plan Pro
            </p>
            <p className="mt-1 text-sm text-muted">
              Reçois les messages de tes visiteurs directement par email, sans exposer ton adresse.
            </p>
          </div>
          <Link
            href="/billing"
            className="inline-flex shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
          >
            Passer au Pro
          </Link>
        </div>
      )}
    </section>
  )
}
