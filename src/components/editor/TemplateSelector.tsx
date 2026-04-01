'use client'

import { useCallback, useMemo } from 'react'
import { Check, Lock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import type { TemplateName } from '@/types/templates'
import { TemplatePreview } from '@/components/shared/TemplatePreview'
import { DEMO_PORTFOLIO, DEMO_COLORS } from '@/lib/demo-data'

interface TemplateSelectorProps {
  value: TemplateName
  onChange: (template: TemplateName) => void
  purchasedTemplates?: TemplateName[]
  className?: string
}

function useDemoProps(name: TemplateName) {
  return useMemo(() => {
    const colors = DEMO_COLORS[name] ?? { primary: '#D4634E', secondary: '#1A1A1A' }
    return {
      ...DEMO_PORTFOLIO,
      portfolio: {
        ...DEMO_PORTFOLIO.portfolio,
        primary_color: colors.primary,
        secondary_color: colors.secondary,
      },
    }
  }, [name])
}

function FreeTemplateCard({ name, label, idealFor, isSelected, onSelect }: {
  name: TemplateName; label: string; idealFor: string; isSelected: boolean; onSelect: (n: TemplateName) => void
}) {
  const demoProps = useDemoProps(name)
  return (
    <button
      type="button"
      data-testid={`template-card-${name}`}
      onClick={() => onSelect(name)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border text-left transition-all duration-200',
        isSelected
          ? 'border-accent ring-2 ring-accent ring-offset-2'
          : 'border-gray-200 hover:scale-[1.02] hover:shadow-md'
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <TemplatePreview templateName={name} templateProps={demoProps} scale={0.22} height="100%" />
        {isSelected && (
          <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent shadow-sm">
            <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
        )}
      </div>
      <div className="p-3 bg-surface">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{idealFor}</p>
      </div>
    </button>
  )
}

function PremiumTemplateCard({ name, label, idealFor, isSelected, isLocked, onSelect }: {
  name: TemplateName; label: string; idealFor: string; isSelected: boolean; isLocked: boolean; onSelect: (n: TemplateName) => void
}) {
  const demoProps = useDemoProps(name)
  return (
    <button
      type="button"
      data-testid={`template-card-${name}`}
      onClick={() => onSelect(name)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border text-left transition-all duration-200',
        isSelected
          ? 'border-accent ring-2 ring-accent ring-offset-2'
          : 'border-gray-200 hover:scale-[1.02] hover:shadow-md'
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <TemplatePreview templateName={name} templateProps={demoProps} scale={0.22} height="100%" />
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
      <div className="p-3 bg-surface">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">2.99€</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{idealFor}</p>
      </div>
    </button>
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
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Templates gratuits
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {freeTemplates.map((template) => (
            <FreeTemplateCard
              key={template.name}
              name={template.name}
              label={template.label}
              idealFor={template.idealFor}
              isSelected={value === template.name}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      {/* Premium templates */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Templates premium
          </h3>
        </div>

        {/* 2x2 grid but with varied sizing for visual interest */}
        <div className="grid grid-cols-2 gap-3">
          {premiumTemplates.map((template) => (
            <PremiumTemplateCard
              key={template.name}
              name={template.name}
              label={template.label}
              idealFor={template.idealFor}
              isSelected={value === template.name}
              isLocked={!purchasedTemplates.includes(template.name)}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
