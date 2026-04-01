'use client'

import { useCallback, useMemo } from 'react'
import { Check, Sparkles } from 'lucide-react'
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
        'group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200',
        isSelected
          ? 'border-accent border-[3px] shadow-[0_4px_16px_rgba(212,99,78,0.15)]'
          : 'border-border hover:scale-[1.03] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]'
      )}
    >
      <div className="relative w-full overflow-hidden" style={{ minHeight: '280px' }}>
        <TemplatePreview templateName={name} templateProps={demoProps} scale={0.22} height="100%" />
        {isSelected && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 shadow-sm">
            <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
            <span className="text-[11px] font-semibold text-white">Selectionne</span>
          </div>
        )}
      </div>
      <div className="p-3.5 bg-surface">
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
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
        'group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200',
        isSelected
          ? 'border-accent border-[3px] shadow-[0_4px_16px_rgba(212,99,78,0.15)]'
          : 'border-border hover:scale-[1.03] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]'
      )}
    >
      <div className="relative w-full overflow-hidden" style={{ minHeight: '280px' }}>
        <TemplatePreview templateName={name} templateProps={demoProps} scale={0.22} height="100%" />
        {/* Premium badge — top left */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-foreground/80 px-2.5 py-1 backdrop-blur-sm">
          <Sparkles className="h-3 w-3 text-white" />
          <span className="text-[11px] font-semibold text-white">Premium</span>
        </div>
        {isSelected && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 shadow-sm">
            <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
            <span className="text-[11px] font-semibold text-white">Selectionne</span>
          </div>
        )}
      </div>
      <div className="p-3.5 bg-surface">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-foreground">{label}</p>
          <span className="rounded-full bg-accent-light px-2 py-0.5 text-[11px] font-semibold text-accent">2.99€</span>
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
        <h3 className="text-[13px] font-semibold text-muted uppercase tracking-wide mb-3">
          Templates gratuits
        </h3>
        <div className="grid grid-cols-2 gap-4">
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
        <h3 className="text-[13px] font-semibold text-muted uppercase tracking-wide mb-3">
          Templates premium
        </h3>
        <div className="grid grid-cols-2 gap-4">
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
