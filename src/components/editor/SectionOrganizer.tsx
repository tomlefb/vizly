'use client'

import { useCallback } from 'react'
import { ChevronUp, ChevronDown, Eye, EyeOff, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSectionLabel, type SectionBlock, type SectionId } from '@/types/sections'
import type { CustomBlock } from '@/types/custom-blocks'

interface SectionOrganizerProps {
  sections: SectionBlock[]
  customBlocks?: CustomBlock[]
  onChange: (sections: SectionBlock[]) => void
}

export function SectionOrganizer({ sections, customBlocks = [], onChange }: SectionOrganizerProps) {
  const customTitleMap = new Map(customBlocks.map((b) => [`custom-${b.id}`, b.title]))
  const sorted = [...sections].sort((a, b) => a.order - b.order)

  const moveUp = useCallback(
    (id: SectionId) => {
      const idx = sorted.findIndex((s) => s.id === id)
      if (idx <= 0) return
      const swapWith = sorted[idx - 1]
      if (!swapWith) return
      const updated = sorted.map((s, i) => {
        if (i === idx - 1) return { ...s, order: idx }
        if (i === idx) return { ...s, order: idx - 1 }
        return s
      })
      onChange(updated)
    },
    [sorted, onChange]
  )

  const moveDown = useCallback(
    (id: SectionId) => {
      const idx = sorted.findIndex((s) => s.id === id)
      if (idx < 0 || idx >= sorted.length - 1) return
      const updated = sorted.map((s, i) => {
        if (i === idx) return { ...s, order: idx + 1 }
        if (i === idx + 1) return { ...s, order: idx }
        return s
      })
      onChange(updated)
    },
    [sorted, onChange]
  )

  const toggleVisibility = useCallback(
    (id: SectionId) => {
      if (id === 'hero') return
      const updated = sorted.map((s) =>
        s.id === id ? { ...s, visible: !s.visible } : s
      )
      onChange(updated)
    },
    [sorted, onChange]
  )

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
          Sections
        </h3>
        <p className="text-sm text-muted mt-1">
          Organise et choisis les sections de ton portfolio
        </p>
      </div>

      <div className="space-y-1.5">
        {sorted.map((section, index) => {
          const isHero = section.id === 'hero'
          const isFirst = index === 0
          const isLast = index === sorted.length - 1

          return (
            <div
              key={section.id}
              className={cn(
                'flex items-center gap-2 bg-surface border border-border-light rounded-[var(--radius-md)] px-3 py-2.5 transition-colors duration-200 hover:border-border',
                !section.visible && 'opacity-50'
              )}
            >
              {/* Grip */}
              <GripVertical className="h-5 w-5 text-muted-foreground/40 hover:text-muted cursor-grab shrink-0 transition-colors" strokeWidth={1.5} />

              {/* Label */}
              <span
                className={cn(
                  'flex-1 text-sm font-medium',
                  section.visible ? 'text-foreground' : 'text-muted-foreground line-through'
                )}
              >
                {getSectionLabel(section.id, customTitleMap.get(section.id))}
              </span>

              {/* Move buttons */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => moveUp(section.id)}
                  disabled={isFirst}
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors hover:bg-surface-warm hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                  aria-label="Monter"
                >
                  <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(section.id)}
                  disabled={isLast}
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors hover:bg-surface-warm hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                  aria-label="Descendre"
                >
                  <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* Toggle visibility */}
              <button
                type="button"
                onClick={() => toggleVisibility(section.id)}
                disabled={isHero}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors',
                  isHero
                    ? 'text-muted-foreground/20 cursor-not-allowed'
                    : section.visible
                      ? 'text-foreground hover:bg-surface-warm'
                      : 'text-muted-foreground/40 hover:bg-surface-warm hover:text-foreground'
                )}
                aria-label={section.visible ? 'Masquer' : 'Afficher'}
              >
                {section.visible ? (
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Utilise les flèches pour réorganiser. L&apos;œil active ou désactive une section.
      </p>
    </section>
  )
}
