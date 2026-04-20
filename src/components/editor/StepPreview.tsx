'use client'

import { useMemo } from 'react'
import { Eye, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VzBtn } from '@/components/ui/vizly'
import { templateMap } from '@/components/templates'
import type { PortfolioFormData, ProjectFormData } from '@/lib/validations'
import type { TemplateProps } from '@/types'

interface StepPreviewProps {
  data: PortfolioFormData
  projects: ProjectFormData[]
  onBack: () => void
  onContinue: () => void
  className?: string
}

export function StepPreview({
  data,
  projects,
  onBack,
  onContinue,
  className,
}: StepPreviewProps) {
  const TemplateComponent = useMemo(
    () => templateMap[data.template] ?? templateMap['minimal'],
    [data.template]
  )

  const templateProps: TemplateProps = useMemo(
    () => ({
      portfolio: {
        title: data.title || 'Ton nom',
        bio: data.bio ?? null,
        photo_url: data.photo_url || null,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        background_color: data.background_color ?? '#FFFFFF',
        font: data.font,
        font_body: data.font_body ?? data.font,
        social_links: (data.social_links as Record<string, string> | null) ?? null,
        contact_email: data.contact_email || null,
      },
      projects: projects.map((p, i) => ({
        id: `preview-${i}`,
        title: p.title,
        description: p.description ?? null,
        images: p.images,
        external_link: p.external_link ?? null,
        tags: p.tags,
        display_order: p.display_order,
      })),
      skills: data.skills ?? [],
      sections: (data.sections ?? []) as TemplateProps['sections'],
      customBlocks: data.custom_blocks ?? [],
      kpis: (data.kpis ?? []) as TemplateProps['kpis'],
      layoutBlocks: (data.layout_blocks ?? []) as TemplateProps['layoutBlocks'],
      isPremium: false,
    }),
    [data, projects]
  )

  return (
    <div className={cn('space-y-6', className)} data-testid="step-preview">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-surface-sunken mx-auto">
          <Eye className="h-6 w-6 text-foreground" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-semibold text-foreground font-[family-name:var(--font-satoshi)] tracking-tight">
          Voici à quoi ressemblera ton portfolio
        </h2>
        <p className="text-sm text-muted max-w-md mx-auto">
          Template : <span className="font-medium capitalize text-foreground">{data.template}</span>.
          Tu peux toujours revenir modifier.
        </p>
      </div>

      {/* Actual template rendering */}
      <div className="rounded-[var(--radius-lg)] border border-border-light overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-border-light bg-surface-warm px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="rounded-[var(--radius-sm)] bg-surface border border-border-light px-4 py-1 text-xs text-muted-foreground font-mono">
              pseudo.vizly.fr
            </div>
          </div>
        </div>

        {/* Template render (scaled down) */}
        <div
          className="max-h-[600px] overflow-y-auto"
          style={{ backgroundColor: data.background_color ?? '#FFFFFF' }}
        >
          {TemplateComponent && (
            <TemplateComponent {...templateProps} />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <VzBtn variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;édition
        </VzBtn>
        <VzBtn variant="primary" onClick={onContinue}>
          Continuer vers la publication
          <ArrowRight className="h-4 w-4" />
        </VzBtn>
      </div>
    </div>
  )
}
