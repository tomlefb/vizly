'use client'

import { useCallback } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const AVAILABLE_FONTS = [
  { name: 'DM Sans', family: '"DM Sans", sans-serif', style: 'Moderne, lisible' },
  { name: 'Inter', family: '"Inter", sans-serif', style: 'Neutre, polyvalent' },
  { name: 'Poppins', family: '"Poppins", sans-serif', style: 'Geometrique, friendly' },
  { name: 'Playfair Display', family: '"Playfair Display", serif', style: 'Elegant, editorial' },
  { name: 'Merriweather', family: '"Merriweather", serif', style: 'Classique, serieux' },
  { name: 'Space Grotesk', family: '"Space Grotesk", sans-serif', style: 'Tech, creatif' },
  { name: 'Outfit', family: '"Outfit", sans-serif', style: 'Clean, corporate' },
  { name: 'Manrope', family: '"Manrope", sans-serif', style: 'Epure, minimal' },
  { name: 'Lora', family: '"Lora", serif', style: 'Raffine, litteraire' },
  { name: 'Nunito', family: '"Nunito", sans-serif', style: 'Arrondi, chaleureux' },
  { name: 'Raleway', family: '"Raleway", sans-serif', style: 'Leger, aerien' },
  { name: 'JetBrains Mono', family: '"JetBrains Mono", monospace', style: 'Code, dev' },
] as const

interface FontSelectorProps {
  value: string
  onChange: (font: string) => void
  className?: string
}

export function FontSelector({
  value,
  onChange,
  className,
}: FontSelectorProps) {
  const handleSelect = useCallback(
    (fontName: string) => {
      onChange(fontName)
    },
    [onChange]
  )

  return (
    <div
      className={cn('space-y-3', className)}
      data-testid="font-selector"
      role="radiogroup"
      aria-label="Choix de la police"
    >
      <p className="text-sm font-medium text-foreground font-[family-name:var(--font-satoshi)]">
        Police
      </p>

      <div className="grid gap-2">
        {AVAILABLE_FONTS.map((font) => {
          const isSelected = value === font.name
          return (
            <button
              key={font.name}
              type="button"
              onClick={() => handleSelect(font.name)}
              role="radio"
              aria-checked={isSelected}
              className={cn(
                'group flex items-center justify-between rounded-[var(--radius-md)] border px-4 py-3 text-left transition-all duration-150',
                isSelected
                  ? 'border-accent bg-accent-light/50 shadow-[0_0_0_1px_var(--color-accent)]'
                  : 'border-border bg-surface hover:border-border hover:bg-surface-warm'
              )}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="text-base text-foreground truncate"
                  style={{ fontFamily: font.family }}
                >
                  Aa Bb Cc 123
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-medium text-foreground/80">
                    {font.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {font.style}
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
