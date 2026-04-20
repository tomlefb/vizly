'use client'

import Link from 'next/link'
import { useId } from 'react'
import { Lock, MessageSquare } from 'lucide-react'
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
  contactFormEnabled: boolean
  onContactFormEnabledChange: (enabled: boolean) => void
  contactFormTitle: string
  onContactFormTitleChange: (title: string) => void
  contactFormDescription: string
  onContactFormDescriptionChange: (desc: string) => void
  billingPlan: 'free' | 'starter' | 'pro'
  className?: string
}

export function StepContent({
  projects, onProjectsChange,
  customBlocks, onCustomBlocksChange,
  kpis, onKpisChange,
  layoutBlocks, onLayoutBlocksChange,
  contactFormEnabled, onContactFormEnabledChange,
  contactFormTitle, onContactFormTitleChange,
  contactFormDescription, onContactFormDescriptionChange,
  billingPlan,
  className,
}: StepContentProps) {
  return (
    <div className={cn(className)} data-testid="step-content">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-10">
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
        <ContactFormColumn
          billingPlan={billingPlan}
          enabled={contactFormEnabled}
          onEnabledChange={onContactFormEnabledChange}
          title={contactFormTitle}
          onTitleChange={onContactFormTitleChange}
          description={contactFormDescription}
          onDescriptionChange={onContactFormDescriptionChange}
        />
      </div>
    </div>
  )
}

interface ContactFormColumnProps {
  billingPlan: 'free' | 'starter' | 'pro'
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  title: string
  onTitleChange: (title: string) => void
  description: string
  onDescriptionChange: (desc: string) => void
}

function ContactFormColumn({
  billingPlan,
  enabled,
  onEnabledChange,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
}: ContactFormColumnProps) {
  const id = useId()
  const isPro = billingPlan === 'pro'

  const inputClass =
    'w-full h-10 rounded-[var(--radius-md)] border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:border-foreground disabled:cursor-not-allowed disabled:bg-surface-warm disabled:text-muted-foreground'
  const textareaClass =
    'w-full rounded-[var(--radius-md)] border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 resize-y min-h-[72px] focus:outline-none focus:border-foreground disabled:cursor-not-allowed disabled:bg-surface-warm disabled:text-muted-foreground'

  return (
    <section className="space-y-4 mt-8 lg:mt-0" data-testid="contact-form-column">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
          Formulaire de contact
        </h3>
        {!isPro && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
            <Lock className="h-3 w-3" strokeWidth={2} />
            Pro
          </span>
        )}
      </div>

      {!isPro ? (
        <div className="rounded-[var(--radius-lg)] border border-border-light bg-surface-warm p-5">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent/10">
            <MessageSquare className="h-5 w-5 text-accent" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-foreground">
            Laisse les visiteurs t&apos;écrire
          </p>
          <p className="mt-1 text-sm text-muted leading-relaxed">
            Un formulaire affiché sur ton portfolio. Les messages arrivent dans ta boîte mail, sans exposer ton adresse.
          </p>
          <Link
            href="/billing"
            className="mt-5 inline-flex w-full items-center justify-center rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
          >
            Passer au Pro
          </Link>
        </div>
      ) : (
        <>
          {/* Toggle activation */}
          <div className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-border-light bg-surface p-3">
            <div className="flex-1">
              <label
                htmlFor={`${id}-enabled`}
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Activer sur mon portfolio
              </label>
              <p className="mt-0.5 text-xs text-muted">
                Affiche le formulaire dans la section contact.
              </p>
            </div>
            <button
              id={`${id}-enabled`}
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => onEnabledChange(!enabled)}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
                enabled ? 'bg-accent' : 'bg-border'
              )}
            >
              <span
                className={cn(
                  'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200',
                  enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
                )}
              />
            </button>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor={`${id}-title`}
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Titre
            </label>
            <input
              id={`${id}-title`}
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              disabled={!enabled}
              placeholder="Me contacter"
              maxLength={100}
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor={`${id}-description`}
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Phrase d&apos;accroche
            </label>
            <textarea
              id={`${id}-description`}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              disabled={!enabled}
              placeholder="Intéressé par mon profil ? N'hésite pas à m'écrire."
              maxLength={300}
              rows={3}
              className={textareaClass}
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {description.length}/300
            </p>
          </div>
        </>
      )}
    </section>
  )
}
