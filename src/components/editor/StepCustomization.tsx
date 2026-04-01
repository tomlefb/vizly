'use client'

import { useCallback, useState } from 'react'
import { Palette, Type, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TemplateSelector } from './TemplateSelector'
import { ColorPicker } from './ColorPicker'
import { FontSelector } from './FontSelector'
import { SectionOrganizer } from './SectionOrganizer'
import { DEFAULT_SECTIONS, type SectionBlock } from '@/types/sections'
import type { PortfolioFormData } from '@/lib/validations'
import type { TemplateName } from '@/types/templates'

const COLOR_PALETTES = [
  { name: 'Terracotta', primary: '#D4634E', secondary: '#FDF2EF' },
  { name: 'Ocean', primary: '#0891B2', secondary: '#E0F7FA' },
  { name: 'Foret', primary: '#059669', secondary: '#ECFDF5' },
  { name: 'Crepuscule', primary: '#7C3AED', secondary: '#F3E8FF' },
  { name: 'Soleil', primary: '#D97706', secondary: '#FEF3C7' },
  { name: 'Monochrome', primary: '#1A1A1A', secondary: '#F5F5F5' },
] as const

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
      className={cn('space-y-6', className)}
      data-testid="step-customization"
    >
      {/* Section: Template */}
      <section className="space-y-5 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
            <LayoutGrid className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-[20px] font-medium text-foreground font-[family-name:var(--font-satoshi)]">
              Template
            </h2>
            <p className="text-[13px] text-muted-foreground">
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
      <section className="space-y-5 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
            <Palette className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-[20px] font-medium text-foreground font-[family-name:var(--font-satoshi)]">
              Couleurs
            </h2>
            <p className="text-[13px] text-muted-foreground">
              Personnalise les couleurs de ton portfolio
            </p>
          </div>
        </div>

        {/* Color palettes */}
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
                  'flex flex-col items-center gap-2 rounded-lg border p-3 transition-all duration-200',
                  isActive
                    ? 'border-accent ring-2 ring-accent ring-offset-2'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex gap-1">
                  <div className="h-8 w-8 rounded-full border border-gray-200" style={{ backgroundColor: palette.primary }} />
                  <div className="h-8 w-8 rounded-full border border-gray-200" style={{ backgroundColor: palette.secondary }} />
                </div>
                <span className="text-xs font-medium text-foreground">{palette.name}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowCustomColors((v) => !v)}
          className="text-sm text-accent hover:underline cursor-pointer"
        >
          {showCustomColors ? 'Masquer la personnalisation' : 'Personnaliser les couleurs'}
        </button>

        {showCustomColors && (
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
        )}
      </section>

      {/* Section: Font */}
      <section className="space-y-5 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
            <Type className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-[20px] font-medium text-foreground font-[family-name:var(--font-satoshi)]">
              Typographie
            </h2>
            <p className="text-[13px] text-muted-foreground">
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
