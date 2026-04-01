'use client'

import { useCallback, useState } from 'react'
import { Palette, Type, LayoutGrid, Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TemplateSelector } from './TemplateSelector'
import { ColorPicker } from './ColorPicker'
import { FontSelector } from './FontSelector'
import { SectionOrganizer } from './SectionOrganizer'
import { DEFAULT_SECTIONS, type SectionBlock } from '@/types/sections'
import type { PortfolioFormData } from '@/lib/validations'
import type { TemplateName } from '@/types/templates'

const COLOR_PALETTES = [
  { name: 'Terracotta', primary: '#D4634E', secondary: '#FAF8F6', accent: '#1A1A1A' },
  { name: 'Ocean', primary: '#2563EB', secondary: '#EFF6FF', accent: '#1E293B' },
  { name: 'Foret', primary: '#16A34A', secondary: '#F0FDF4', accent: '#1A1A1A' },
  { name: 'Crepuscule', primary: '#7C3AED', secondary: '#F5F3FF', accent: '#1E1B3A' },
  { name: 'Minuit', primary: '#1E293B', secondary: '#F8FAFC', accent: '#D4634E' },
  { name: 'Aurore', primary: '#E07A48', secondary: '#FFFBEB', accent: '#292524' },
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
      className={cn('space-y-5', className)}
      data-testid="step-customization"
    >
      {/* Section: Template */}
      <section className="space-y-4 border-b border-border/30 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-violet-50">
            <LayoutGrid className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-base font-medium text-foreground font-[family-name:var(--font-satoshi)]">
              Template
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Choisis le style de ton portfolio
            </p>
          </div>
        </div>

        <TemplateSelector
          value={data.template as TemplateName}
          onChange={handleTemplateChange}
          purchasedTemplates={purchasedTemplates}
        />
      </section>

      {/* Section: Colors — dots style */}
      <section className="space-y-4 border-b border-border/30 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-pink-50">
            <Palette className="h-3.5 w-3.5 text-pink-600" />
          </div>
          <div>
            <h2 className="text-base font-medium text-foreground font-[family-name:var(--font-satoshi)]">
              Couleurs
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Personnalise les couleurs de ton portfolio
            </p>
          </div>
        </div>

        {/* Color palette dots */}
        <div className="grid grid-cols-3 gap-3">
          {COLOR_PALETTES.map((palette) => {
            const isActive = data.primary_color.toLowerCase() === palette.primary.toLowerCase() &&
              data.secondary_color.toLowerCase() === palette.secondary.toLowerCase()
            return (
              <button
                key={palette.name}
                type="button"
                onClick={() => {
                  handlePrimaryColorChange(palette.primary)
                  handleSecondaryColorChange(palette.secondary)
                }}
                className={cn(
                  'relative flex items-center gap-2.5 rounded-[var(--radius-md)] border-2 px-3 py-2.5 transition-all duration-200',
                  isActive
                    ? 'border-accent shadow-[0_0_0_2px_rgba(212,99,78,0.15)]'
                    : 'border-border hover:border-border-light'
                )}
              >
                {/* Color dots */}
                <div className="flex items-center -space-x-1">
                  <span className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: palette.primary }} />
                  <span className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: palette.secondary }} />
                  <span className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: palette.accent }} />
                </div>
                <span className="text-[11px] font-medium text-foreground">{palette.name}</span>
                {isActive && <Check className="h-3 w-3 text-accent ml-auto" strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>

        {/* Custom colors expandable */}
        <button
          type="button"
          onClick={() => setShowCustomColors((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-accent transition-colors"
        >
          Couleurs personnalisees
          <ChevronRight className={cn('h-3 w-3 transition-transform', showCustomColors && 'rotate-90')} />
        </button>

        {showCustomColors && (
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorPicker
              value={data.primary_color}
              onChange={handlePrimaryColorChange}
              label="Couleur principale"
            />
            <ColorPicker
              value={data.secondary_color}
              onChange={handleSecondaryColorChange}
              label="Couleur secondaire"
            />
          </div>
        )}
      </section>

      {/* Section: Typography */}
      <section className="space-y-4 border-b border-border/30 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-teal-50">
            <Type className="h-3.5 w-3.5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-base font-medium text-foreground font-[family-name:var(--font-satoshi)]">
              Typographie
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Choisis les polices de ton portfolio
            </p>
          </div>
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
