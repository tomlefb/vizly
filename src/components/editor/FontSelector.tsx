'use client'

import { useCallback, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
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
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
            'flex w-full items-center justify-between rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition-all duration-150',
            open
              ? 'border-accent ring-2 ring-accent/20'
              : 'border-border bg-surface hover:border-border-light'
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate" style={{ fontFamily: selectedFamily }}>
              {value}
            </p>
            {selectedFont && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {selectedFont.style}
              </p>
            )}
          </div>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full rounded-[var(--radius-md)] border border-border bg-background shadow-lg max-h-60 overflow-y-auto">
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
                      ? 'bg-accent/5 text-foreground'
                      : 'hover:bg-surface-warm text-foreground'
                  )}
                >
                  <span className="text-sm flex-1 truncate" style={{ fontFamily: font.family }}>
                    {font.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {font.style}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
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
  onChange: (font: string) => void
  onChangeBody: (font: string) => void
  className?: string
}

export function FontSelector({
  value,
  valueBody,
  onChange,
  onChangeBody,
  className,
}: FontSelectorProps) {
  return (
    <div
      className={cn('grid gap-4', className)}
      data-testid="font-selector"
    >
      <FontDropdown
        label="Police de titre"
        value={value}
        onChange={onChange}
      />
      <FontDropdown
        label="Police de texte"
        value={valueBody}
        onChange={onChangeBody}
      />
    </div>
  )
}
