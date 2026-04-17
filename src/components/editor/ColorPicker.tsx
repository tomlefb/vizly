'use client'

import { useState, useCallback, useId } from 'react'
import { cn } from '@/lib/utils'
import { DEFAULT_PORTFOLIO_COLOR } from '@/lib/constants'

const PRESET_COLORS = [
  DEFAULT_PORTFOLIO_COLOR, '#D97706', '#059669', '#0891B2',
  '#6366F1', '#A855F7', '#EC4899', '#1A1A1A',
  '#6B7280', '#FAF8F6',
] as const

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label: string
  className?: string
}

export function ColorPicker({
  value,
  onChange,
  label,
  className,
}: ColorPickerProps) {
  const id = useId()
  const [hexInput, setHexInput] = useState(value)

  const handleHexChange = useCallback(
    (raw: string) => {
      setHexInput(raw)
      const normalized = raw.startsWith('#') ? raw : `#${raw}`
      if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
        onChange(normalized)
      }
    },
    [onChange]
  )

  const handlePresetClick = useCallback(
    (color: string) => {
      setHexInput(color)
      onChange(color)
    },
    [onChange]
  )

  return (
    <div className={cn('space-y-3', className)} data-testid="color-picker">
      <label
        htmlFor={`${id}-hex`}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>

      {/* Current color preview + hex input */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-[var(--radius-md)] border border-border-light shrink-0 transition-colors duration-200"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none pointer-events-none">
            #
          </span>
          <input
            id={`${id}-hex`}
            type="text"
            value={hexInput.replace(/^#/, '')}
            onChange={(e) => handleHexChange(e.target.value)}
            maxLength={6}
            placeholder="D4634E"
            className="w-full h-10 rounded-[var(--radius-md)] border border-border-light bg-surface px-3 pl-7 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:border-foreground"
            aria-label={`Code hexadécimal pour ${label}`}
          />
        </div>
      </div>

      {/* Preset palette */}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Couleurs prédéfinies pour ${label}`}>
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handlePresetClick(color)}
            className={cn(
              'w-8 h-8 rounded-full border transition-all duration-150',
              value.toLowerCase() === color.toLowerCase()
                ? 'border-[2px] border-foreground shadow-[var(--shadow-offset-accent-1)]'
                : 'border-border-light hover:border-border'
            )}
            style={{ backgroundColor: color }}
            role="radio"
            aria-checked={value.toLowerCase() === color.toLowerCase()}
            aria-label={`Couleur ${color}`}
          />
        ))}
      </div>
    </div>
  )
}
