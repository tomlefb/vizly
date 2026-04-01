'use client'

import { useCallback } from 'react'
import { Palette, Type, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TemplateSelector } from './TemplateSelector'
import { ColorPicker } from './ColorPicker'
import { FontSelector } from './FontSelector'
import { SectionOrganizer } from './SectionOrganizer'
import { DEFAULT_SECTIONS, type SectionBlock } from '@/types/sections'
import type { PortfolioFormData } from '@/lib/validations'
import type { TemplateName } from '@/types/templates'

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
      className={cn('space-y-10', className)}
      data-testid="step-customization"
    >
      {/* Section: Template */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
            <LayoutGrid className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
              Template
            </h2>
            <p className="text-sm text-muted-foreground">
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

      {/* Section: Colors */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
            <Palette className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
              Couleurs
            </h2>
            <p className="text-sm text-muted-foreground">
              Personnalise les couleurs de ton portfolio
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
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
      </section>

      {/* Section: Font */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
            <Type className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
              Typographie
            </h2>
            <p className="text-sm text-muted-foreground">
              Choisis la police de ton portfolio
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
