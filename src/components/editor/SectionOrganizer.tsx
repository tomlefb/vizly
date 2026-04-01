'use client'

import { useCallback } from 'react'
import { ChevronUp, ChevronDown, Eye, EyeOff, GripVertical, LayoutList } from 'lucide-react'
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
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
          <LayoutList className="h-3.5 w-3.5 text-accent" />
        </div>
        <div>
          <h2 className="text-base font-medium text-foreground font-[family-name:var(--font-satoshi)]">
            Sections
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Organise et choisis les sections de ton portfolio
          </p>
        </div>
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
                'flex items-center gap-2 bg-white border border-border/60 rounded-[var(--radius-sm)] px-3 py-2.5 transition-colors duration-200 hover:bg-surface-warm',
                !section.visible && 'opacity-50'
              )}
            >
              {/* Grip — more visible */}
              <GripVertical className="h-5 w-5 text-muted-foreground/40 hover:text-muted cursor-grab shrink-0 transition-colors" />

              {/* Label */}
              <span
                className={cn(
                  'flex-1 text-[13px] font-medium',
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
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors hover:bg-white hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                  aria-label="Monter"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(section.id)}
                  disabled={isLast}
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors hover:bg-white hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                  aria-label="Descendre"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Toggle visibility — terracotta when visible */}
              <button
                type="button"
                onClick={() => toggleVisibility(section.id)}
                disabled={isHero}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors',
                  isHero
                    ? 'text-muted-foreground/20 cursor-not-allowed'
                    : section.visible
                      ? 'text-accent hover:bg-accent/10'
                      : 'text-muted-foreground/40 hover:bg-surface-warm hover:text-foreground'
                )}
                aria-label={section.visible ? 'Masquer' : 'Afficher'}
              >
                {section.visible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Utilise les fleches pour reorganiser. L&apos;oeil active ou desactive une section.
      </p>
    </section>
  )
}
