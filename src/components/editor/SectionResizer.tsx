'use client'

import { useCallback } from 'react'
import { ChevronUp, ChevronDown, Eye, EyeOff, GripVertical, LayoutPanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSectionLabel, type SectionBlock, type SectionId } from '@/types/sections'
import type { CustomBlock } from '@/types/custom-blocks'

const WIDTH_OPTIONS = [
  { value: 4, label: '\u2153' },
  { value: 6, label: '\u00BD' },
  { value: 8, label: '\u2154' },
  { value: 12, label: 'Full' },
]

interface SectionResizerProps {
  sections: SectionBlock[]
  customBlocks?: CustomBlock[]
  onChange: (sections: SectionBlock[]) => void
}

export function SectionResizer({ sections, customBlocks = [], onChange }: SectionResizerProps) {
  const customTitleMap = new Map(customBlocks.map((b) => [`custom-${b.id}`, b.title]))
  const sorted = [...sections].sort((a, b) => a.order - b.order)
  const visible = sorted.filter(s => s.visible)

  const updateWidth = useCallback((id: SectionId, width: number) => {
    onChange(sorted.map(s => s.id === id ? { ...s, width } : s))
  }, [sorted, onChange])

  const moveUp = useCallback((id: SectionId) => {
    const idx = sorted.findIndex(s => s.id === id)
    if (idx <= 0) return
    onChange(sorted.map((s, i) => {
      if (i === idx - 1) return { ...s, order: idx }
      if (i === idx) return { ...s, order: idx - 1 }
      return s
    }))
  }, [sorted, onChange])

  const moveDown = useCallback((id: SectionId) => {
    const idx = sorted.findIndex(s => s.id === id)
    if (idx < 0 || idx >= sorted.length - 1) return
    onChange(sorted.map((s, i) => {
      if (i === idx) return { ...s, order: idx + 1 }
      if (i === idx + 1) return { ...s, order: idx }
      return s
    }))
  }, [sorted, onChange])

  const toggleVisibility = useCallback((id: SectionId) => {
    if (id === 'hero') return
    onChange(sorted.map(s => s.id === id ? { ...s, visible: !s.visible } : s))
  }, [sorted, onChange])

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
          <LayoutPanelLeft className="h-3.5 w-3.5 text-accent" />
        </div>
        <div>
          <h2 className="text-base font-medium text-foreground font-[family-name:var(--font-satoshi)]">
            Sections & Layout
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Redimensionne et organise les sections
          </p>
        </div>
      </div>

      {/* Visual layout preview */}
      <div className="rounded-[var(--radius-md)] bg-white border border-border/60 p-2">
        <div className="grid grid-cols-12 gap-1" style={{ gridAutoRows: '28px' }}>
          {visible.map(section => (
            <div
              key={section.id}
              style={{ gridColumn: `span ${section.width ?? 12}` }}
              className="rounded-[3px] bg-accent/8 border border-accent/15 px-2 flex items-center overflow-hidden"
            >
              <span className="text-[9px] font-medium text-accent/70 truncate">
                {getSectionLabel(section.id, customTitleMap.get(section.id))}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Section list */}
      <div className="space-y-1">
        {sorted.map((section, index) => {
          const isHero = section.id === 'hero'
          const isFirst = index === 0
          const isLast = index === sorted.length - 1

          return (
            <div
              key={section.id}
              className={cn(
                'flex items-center gap-1.5 bg-white border border-border/60 rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors hover:bg-surface-warm',
                !section.visible && 'opacity-40'
              )}
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 cursor-grab" />

              <span className={cn(
                'flex-1 text-[11px] font-medium min-w-0 truncate',
                section.visible ? 'text-foreground' : 'text-muted-foreground line-through'
              )}>
                {getSectionLabel(section.id, customTitleMap.get(section.id))}
              </span>

              {/* Width quick-select */}
              {section.visible && !isHero && (
                <div className="flex items-center gap-px shrink-0">
                  {WIDTH_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateWidth(section.id, opt.value)}
                      className={cn(
                        'w-7 h-5 flex items-center justify-center text-[9px] font-semibold rounded transition-colors',
                        (section.width ?? 12) === opt.value
                          ? 'bg-accent text-white'
                          : 'text-muted-foreground hover:bg-border-light'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {isHero && section.visible && (
                <span className="text-[9px] text-muted-foreground shrink-0">Full</span>
              )}

              {/* Reorder */}
              <div className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => moveUp(section.id)}
                  disabled={isFirst}
                  className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  aria-label="Monter"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(section.id)}
                  disabled={isLast}
                  className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  aria-label="Descendre"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              {/* Visibility */}
              <button
                type="button"
                onClick={() => toggleVisibility(section.id)}
                disabled={isHero}
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded transition-colors shrink-0',
                  isHero
                    ? 'text-muted-foreground/20 cursor-not-allowed'
                    : section.visible
                      ? 'text-accent hover:bg-accent/10'
                      : 'text-muted-foreground/40 hover:text-foreground'
                )}
                aria-label={section.visible ? 'Masquer' : 'Afficher'}
              >
                {section.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-[10px] text-muted-foreground">
        Les sections dont les largeurs totalisent 12 se placent cote a cote.
      </p>
    </section>
  )
}
