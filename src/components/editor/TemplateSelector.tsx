'use client'

import { useCallback } from 'react'
import { Check, Lock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import type { TemplateName } from '@/types/templates'

/** Visual style hints per template for the preview placeholder */
const TEMPLATE_VISUALS: Record<TemplateName, { bg: string; accent: string; pattern: string }> = {
  minimal: { bg: '#FAFAF8', accent: '#1A1A1A', pattern: 'grid' },
  dark: { bg: '#0F0F0F', accent: '#00FF88', pattern: 'dots' },
  classique: { bg: '#F5F0EB', accent: '#2D3748', pattern: 'lines' },
  colore: { bg: '#FFF5F0', accent: '#FF6B35', pattern: 'waves' },
  creatif: { bg: '#1A0A2E', accent: '#FF3CAC', pattern: 'diagonal' },
  brutalist: { bg: '#FFFF00', accent: '#000000', pattern: 'blocks' },
  elegant: { bg: '#FAF8F5', accent: '#8B7355', pattern: 'serif' },
  bento: { bg: '#F2F2F7', accent: '#007AFF', pattern: 'bento' },
}

interface TemplateSelectorProps {
  value: TemplateName
  onChange: (template: TemplateName) => void
  purchasedTemplates?: TemplateName[]
  className?: string
}

function TemplatePreviewPlaceholder({ name }: { name: TemplateName }) {
  const visual = TEMPLATE_VISUALS[name]

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: visual.bg }}
    >
      {/* Simple stylized pattern per template */}
      {visual.pattern === 'grid' && (
        <div className="absolute inset-3 grid grid-cols-3 gap-1.5 opacity-20">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-sm" style={{ backgroundColor: visual.accent }} />
          ))}
        </div>
      )}
      {visual.pattern === 'dots' && (
        <div className="absolute inset-3 flex flex-wrap gap-2 opacity-30">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-2 w-2 rounded-full" style={{ backgroundColor: visual.accent }} />
          ))}
        </div>
      )}
      {visual.pattern === 'lines' && (
        <div className="absolute inset-3 flex flex-col gap-1.5 opacity-15">
          <div className="h-3 w-1/3 rounded-sm" style={{ backgroundColor: visual.accent }} />
          <div className="h-1.5 w-2/3 rounded-sm" style={{ backgroundColor: visual.accent }} />
          <div className="h-1.5 w-1/2 rounded-sm" style={{ backgroundColor: visual.accent }} />
          <div className="mt-auto h-px w-full" style={{ backgroundColor: visual.accent }} />
          <div className="h-1.5 w-3/4 rounded-sm" style={{ backgroundColor: visual.accent }} />
        </div>
      )}
      {visual.pattern === 'waves' && (
        <div className="absolute inset-0 flex items-end opacity-15">
          <svg viewBox="0 0 100 30" className="w-full" preserveAspectRatio="none">
            <path d="M0 20 Q25 5 50 20 Q75 35 100 20 V30 H0Z" fill={visual.accent} />
          </svg>
        </div>
      )}
      {visual.pattern === 'diagonal' && (
        <div className="absolute inset-0 opacity-15">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-px origin-left rotate-[-35deg]"
              style={{
                backgroundColor: visual.accent,
                width: '150%',
                top: `${i * 25}%`,
                left: '-10%',
              }}
            />
          ))}
        </div>
      )}
      {visual.pattern === 'blocks' && (
        <div className="absolute inset-2 grid grid-cols-2 gap-1 opacity-25">
          <div className="col-span-2 h-4 rounded-none" style={{ backgroundColor: visual.accent }} />
          <div className="h-8 rounded-none" style={{ backgroundColor: visual.accent }} />
          <div className="h-6 rounded-none mt-2" style={{ backgroundColor: visual.accent }} />
        </div>
      )}
      {visual.pattern === 'serif' && (
        <div className="absolute inset-3 flex flex-col items-center justify-center gap-1 opacity-20">
          <div className="text-[10px] font-serif italic" style={{ color: visual.accent }}>Aa</div>
          <div className="h-px w-8" style={{ backgroundColor: visual.accent }} />
          <div className="h-1 w-12 rounded-sm" style={{ backgroundColor: visual.accent }} />
        </div>
      )}
      {visual.pattern === 'bento' && (
        <div className="absolute inset-2 grid grid-cols-3 grid-rows-2 gap-1 opacity-15">
          <div className="col-span-2 rounded-[3px]" style={{ backgroundColor: visual.accent }} />
          <div className="rounded-[3px]" style={{ backgroundColor: visual.accent }} />
          <div className="rounded-[3px]" style={{ backgroundColor: visual.accent }} />
          <div className="col-span-2 rounded-[3px]" style={{ backgroundColor: visual.accent }} />
        </div>
      )}
    </div>
  )
}

export function TemplateSelector({
  value,
  onChange,
  purchasedTemplates = [],
  className,
}: TemplateSelectorProps) {
  const handleSelect = useCallback(
    (name: TemplateName) => {
      onChange(name)
    },
    [onChange]
  )

  const freeTemplates = TEMPLATE_CONFIGS.filter((t) => !t.isPremium)
  const premiumTemplates = TEMPLATE_CONFIGS.filter((t) => t.isPremium)

  return (
    <div className={cn('space-y-6', className)} data-testid="template-selector">
      {/* Free templates */}
      <div>
        <h3 className="text-sm font-semibold text-foreground font-[family-name:var(--font-satoshi)] mb-3">
          Templates gratuits
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {freeTemplates.map((template) => {
            const isSelected = value === template.name
            return (
              <button
                key={template.name}
                type="button"
                data-testid={`template-card-${template.name}`}
                onClick={() => handleSelect(template.name)}
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border text-left transition-all duration-200',
                  isSelected
                    ? 'border-accent ring-2 ring-accent/20 shadow-[0_4px_16px_rgba(232,85,61,0.12)]'
                    : 'border-border hover:border-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                )}
              >
                {/* Preview */}
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <TemplatePreviewPlaceholder name={template.name} />
                  {isSelected && (
                    <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent shadow-sm">
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 bg-surface">
                  <p className="text-sm font-semibold text-foreground">
                    {template.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {template.idealFor}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Premium templates */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
            Templates premium
          </h3>
          <span className="inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wide">
            <Sparkles className="h-3 w-3" />
            2.99 EUR
          </span>
        </div>

        {/* 2x2 grid but with varied sizing for visual interest */}
        <div className="grid grid-cols-2 gap-3">
          {premiumTemplates.map((template) => {
            const isSelected = value === template.name
            const isPurchased = purchasedTemplates.includes(template.name)
            const isLocked = !isPurchased

            return (
              <button
                key={template.name}
                type="button"
                data-testid={`template-card-${template.name}`}
                onClick={() => handleSelect(template.name)}
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border text-left transition-all duration-200',
                  isSelected
                    ? 'border-accent ring-2 ring-accent/20 shadow-[0_4px_16px_rgba(232,85,61,0.12)]'
                    : 'border-border hover:border-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                )}
              >
                {/* Preview */}
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <TemplatePreviewPlaceholder name={template.name} />

                  {/* Lock overlay for unpurchased */}
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 backdrop-blur-[1px]">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 shadow-sm border border-border">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent shadow-sm">
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 bg-surface">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground">
                      {template.label}
                    </p>
                    {isLocked && (
                      <span className="inline-flex items-center rounded-[var(--radius-sm)] bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold text-accent uppercase tracking-wider">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {template.idealFor}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
