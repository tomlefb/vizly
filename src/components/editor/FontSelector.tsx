'use client'

import { useCallback, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ColorPicker } from './ColorPicker'

const AVAILABLE_FONTS = [
  { name: 'DM Sans', family: '"DM Sans", sans-serif', style: 'Sans-serif' },
  { name: 'Inter', family: '"Inter", sans-serif', style: 'Sans-serif' },
  { name: 'Poppins', family: '"Poppins", sans-serif', style: 'Sans-serif' },
  { name: 'Playfair Display', family: '"Playfair Display", serif', style: 'Serif' },
  { name: 'Merriweather', family: '"Merriweather", serif', style: 'Serif' },
  { name: 'Space Grotesk', family: '"Space Grotesk", sans-serif', style: 'Sans-serif' },
  { name: 'Outfit', family: '"Outfit", sans-serif', style: 'Sans-serif' },
  { name: 'Manrope', family: '"Manrope", sans-serif', style: 'Sans-serif' },
  { name: 'Lora', family: '"Lora", serif', style: 'Serif' },
  { name: 'Nunito', family: '"Nunito", sans-serif', style: 'Sans-serif' },
  { name: 'Raleway', family: '"Raleway", sans-serif', style: 'Sans-serif' },
  { name: 'JetBrains Mono', family: '"JetBrains Mono", monospace', style: 'Monospace' },
] as const

interface FontDropdownProps {
  label: string
  value: string
  onChange: (font: string) => void
}

function FontDropdown({ label, value, onChange }: FontDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedFont = AVAILABLE_FONTS.find((f) => f.name === value)
  const selectedFamily = selectedFont?.family ?? '"DM Sans", sans-serif'

  const handleSelect = useCallback(
    (fontName: string) => {
      onChange(fontName)
      setOpen(false)
    },
    [onChange]
  )

  return (
    <div ref={containerRef} className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          onBlur={(e) => {
            if (!containerRef.current?.contains(e.relatedTarget)) {
              setOpen(false)
            }
          }}
          className={cn(
            'flex w-full items-center justify-between rounded-[var(--radius-md)] border bg-surface px-3 py-2.5 text-left transition-colors duration-150',
            open
              ? 'border-foreground'
              : 'border-border-light hover:border-border'
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate" style={{ fontFamily: selectedFamily }}>
              {value}
            </p>
            {selectedFont && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedFont.style}
              </p>
            )}
          </div>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full rounded-[var(--radius-md)] border border-border-light bg-surface shadow-[var(--shadow-card-hover)] max-h-60 overflow-y-auto">
            {AVAILABLE_FONTS.map((font) => {
              const isSelected = value === font.name
              return (
                <button
                  key={font.name}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(font.name)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                    isSelected
                      ? 'bg-surface-sunken text-foreground'
                      : 'hover:bg-surface-warm text-foreground'
                  )}
                >
                  <span className="text-sm flex-1 truncate" style={{ fontFamily: font.family }}>
                    {font.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {font.style}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

interface FontSelectorProps {
  value: string
  valueBody: string
  titleColor: string
  bodyColor: string
  onChange: (font: string) => void
  onChangeBody: (font: string) => void
  onChangeTitleColor: (color: string) => void
  onChangeBodyColor: (color: string) => void
  className?: string
}

export function FontSelector({
  value,
  valueBody,
  titleColor,
  bodyColor,
  onChange,
  onChangeBody,
  onChangeTitleColor,
  onChangeBodyColor,
  className,
}: FontSelectorProps) {
  const titleFont = AVAILABLE_FONTS.find((f) => f.name === value)
  const bodyFont = AVAILABLE_FONTS.find((f) => f.name === valueBody)

  return (
    <div
      className={cn('space-y-5', className)}
      data-testid="font-selector"
    >
      <div className="space-y-3">
        <FontDropdown
          label="Police de titre"
          value={value}
          onChange={onChange}
        />
        {/* Mini preview of the title font in the picked title color */}
        <p
          className="text-[15px] pl-1"
          style={{ fontFamily: titleFont?.family ?? 'inherit', color: titleColor }}
        >
          Aa Bb Cc 123
        </p>
        <ColorPicker
          value={titleColor}
          onChange={onChangeTitleColor}
          label="Couleur titre"
        />
      </div>

      <div className="space-y-3 border-t border-border-light pt-5">
        <FontDropdown
          label="Police de texte"
          value={valueBody}
          onChange={onChangeBody}
        />
        <p
          className="text-[13px] pl-1"
          style={{ fontFamily: bodyFont?.family ?? 'inherit', color: bodyColor }}
        >
          Aa Bb Cc 123
        </p>
        <ColorPicker
          value={bodyColor}
          onChange={onChangeBodyColor}
          label="Couleur texte"
        />
      </div>
    </div>
  )
}
