'use client'

import { useCallback, useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEFAULT_PORTFOLIO_COLOR } from '@/lib/constants'
import { TemplateSelector } from './TemplateSelector'
import { ColorPicker } from './ColorPicker'
import { FontSelector } from './FontSelector'
import { SectionOrganizer } from './SectionOrganizer'
import { DEFAULT_SECTIONS, type SectionBlock } from '@/types/sections'
import type { PortfolioFormData } from '@/lib/validations'
import type { TemplateName } from '@/types/templates'

// Palettes de couleurs pour les portfolios des utilisateurs — ce sont
// des choix pour LEUR site, pas l'UI Vizly. La couleur de marque Vizly
// reste le lime et n'apparaît pas comme preset.
// Chaque palette = 3 couleurs : accent (primary_color), texte (secondary_color),
// fond (background_color).
const COLOR_PALETTES = [
  { name: 'Terracotta', accent: DEFAULT_PORTFOLIO_COLOR, text: '#1A1A1A', background: '#FAF8F6' },
  { name: 'Océan', accent: '#2563EB', text: '#1E293B', background: '#EFF6FF' },
  { name: 'Forêt', accent: '#16A34A', text: '#1A1A1A', background: '#F0FDF4' },
  { name: 'Crépuscule', accent: '#7C3AED', text: '#1E1B3A', background: '#F5F3FF' },
  { name: 'Minuit', accent: DEFAULT_PORTFOLIO_COLOR, text: '#F8FAFC', background: '#1E293B' },
  { name: 'Aurore', accent: '#E07A48', text: '#292524', background: '#FFFBEB' },
]

interface StepCustomizationProps {
  data: PortfolioFormData
  onChange: (field: string, value: unknown) => void
  purchasedTemplates?: TemplateName[]
  className?: string
}

export function StepCustomization({
  data,
  onChange,
  purchasedTemplates = [],
  className,
}: StepCustomizationProps) {
  const handleTemplateChange = useCallback(
    (template: TemplateName) => {
      onChange('template', template)
    },
    [onChange]
  )

  const [showCustomColors, setShowCustomColors] = useState(false)

  const handlePrimaryColorChange = useCallback(
    (color: string) => {
      onChange('primary_color', color)
    },
    [onChange]
  )

  const handleSecondaryColorChange = useCallback(
    (color: string) => {
      onChange('secondary_color', color)
    },
    [onChange]
  )

  const handleBackgroundColorChange = useCallback(
    (color: string) => {
      onChange('background_color', color)
    },
    [onChange]
  )

  const handleFontChange = useCallback(
    (font: string) => {
      onChange('font', font)
    },
    [onChange]
  )

  const handleFontBodyChange = useCallback(
    (font: string) => {
      onChange('font_body', font)
    },
    [onChange]
  )

  return (
    <div
      className={cn('space-y-6', className)}
      data-testid="step-customization"
    >
      {/* Section: Template */}
      <section className="space-y-4 border-b border-border-light pb-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
            Template
          </h3>
          <p className="text-sm text-muted mt-1">
            Choisis le style de ton portfolio
          </p>
        </div>

        <TemplateSelector
          value={data.template as TemplateName}
          onChange={handleTemplateChange}
          purchasedTemplates={purchasedTemplates}
        />
      </section>

      {/* Section: Colors — dots style */}
      <section className="space-y-4 border-b border-border-light pb-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
            Couleurs
          </h3>
          <p className="text-sm text-muted mt-1">
            Personnalise les couleurs de ton portfolio
          </p>
        </div>

        {/* Color palette dots */}
        <div className="grid grid-cols-3 gap-3">
          {COLOR_PALETTES.map((palette) => {
            const isActive =
              data.primary_color.toLowerCase() === palette.accent.toLowerCase() &&
              data.secondary_color.toLowerCase() === palette.text.toLowerCase() &&
              (data.background_color ?? '#FFFFFF').toLowerCase() === palette.background.toLowerCase()
            return (
              <button
                key={palette.name}
                type="button"
                onClick={() => {
                  handlePrimaryColorChange(palette.accent)
                  handleSecondaryColorChange(palette.text)
                  handleBackgroundColorChange(palette.background)
                }}
                className={cn(
                  'relative flex items-center gap-2.5 rounded-[var(--radius-md)] border bg-surface px-3 py-2.5 transition-colors duration-200',
                  isActive
                    ? 'border-[1.5px] border-foreground'
                    : 'border-border-light hover:border-border'
                )}
              >
                {/* Color dots : fond, texte, accent */}
                <div className="flex items-center -space-x-1">
                  <span className="w-5 h-5 rounded-full border-2 border-surface" style={{ backgroundColor: palette.background }} />
                  <span className="w-5 h-5 rounded-full border-2 border-surface" style={{ backgroundColor: palette.text }} />
                  <span className="w-5 h-5 rounded-full border-2 border-surface" style={{ backgroundColor: palette.accent }} />
                </div>
                <span className="text-xs font-medium text-foreground">{palette.name}</span>
                {isActive && <Check className="h-3 w-3 text-foreground ml-auto" strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>

        {/* Custom colors expandable */}
        <button
          type="button"
          onClick={() => setShowCustomColors((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground transition-colors"
        >
          Couleurs personnalisées
          <ChevronRight className={cn('h-3 w-3 transition-transform', showCustomColors && 'rotate-90')} />
        </button>

        {showCustomColors && (
          <div className="grid gap-4 sm:grid-cols-3">
            <ColorPicker
              value={data.background_color ?? '#FFFFFF'}
              onChange={handleBackgroundColorChange}
              label="Fond"
            />
            <ColorPicker
              value={data.secondary_color}
              onChange={handleSecondaryColorChange}
              label="Texte"
            />
            <ColorPicker
              value={data.primary_color}
              onChange={handlePrimaryColorChange}
              label="Accent"
            />
          </div>
        )}
      </section>

      {/* Section: Typography */}
      <section className="space-y-4 border-b border-border-light pb-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
            Typographie
          </h3>
          <p className="text-sm text-muted mt-1">
            Choisis les polices de ton portfolio
          </p>
        </div>

        <FontSelector
          value={data.font}
          valueBody={data.font_body ?? data.font}
          onChange={handleFontChange}
          onChangeBody={handleFontBodyChange}
        />
      </section>

      {/* Section: Layout */}
      <SectionOrganizer
        sections={(data.sections as SectionBlock[]) ?? DEFAULT_SECTIONS}
        customBlocks={data.custom_blocks ?? []}
        onChange={(sections) => onChange('sections', sections)}
      />
    </div>
  )
}
