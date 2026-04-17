'use client'

import { useCallback, useMemo } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEFAULT_PORTFOLIO_COLOR } from '@/lib/constants'
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
    const colors = DEMO_COLORS[name] ?? { primary: DEFAULT_PORTFOLIO_COLOR, secondary: '#1A1A1A' }
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
        'group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-surface text-left transition-all duration-200',
        isSelected
          ? 'border-[1.5px] border-foreground shadow-[var(--shadow-offset-accent-2)]'
          : 'border-border-light hover:border-border hover:shadow-[var(--shadow-card-hover)]'
      )}
    >
      <div className="relative w-full overflow-hidden" style={{ minHeight: '160px' }}>
        <TemplatePreview templateName={name} templateProps={demoProps} scale={0.18} height="100%" />
        {isSelected && (
          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent">
            <Check className="h-3 w-3 text-accent-fg" strokeWidth={2.5} />
          </div>
        )}
      </div>
      <div className="p-2.5 bg-surface">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{idealFor}</p>
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
        'group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-surface text-left transition-all duration-200',
        isSelected
          ? 'border-[1.5px] border-foreground shadow-[var(--shadow-offset-accent-2)]'
          : 'border-border-light hover:border-border hover:shadow-[var(--shadow-card-hover)]'
      )}
    >
      <div className="relative w-full overflow-hidden" style={{ minHeight: '160px' }}>
        <TemplatePreview templateName={name} templateProps={demoProps} scale={0.18} height="100%" />
        {/* Premium badge — discrete top left */}
        <div className="absolute top-2 left-2 rounded-full bg-foreground/80 px-2 py-0.5 backdrop-blur-sm">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white">{isLocked ? 'Premium' : 'Acheté'}</span>
        </div>
        {isSelected && (
          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent">
            <Check className="h-3 w-3 text-accent-fg" strokeWidth={2.5} />
          </div>
        )}
      </div>
      <div className="p-2.5 bg-surface">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold text-foreground">{label}</p>
          <span className="rounded-full bg-accent-light px-1.5 py-px text-[9px] font-semibold text-accent-deep">2,99 €</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{idealFor}</p>
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
        <h3 className="mb-3 text-xs font-semibold text-muted uppercase tracking-wider">
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
        <h3 className="mb-3 text-xs font-semibold text-muted uppercase tracking-wider">
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
