'use client'

import { useState, useEffect, useRef, type ComponentType } from 'react'
import { getDemoPortfolio, DEMO_HANDLES } from '@/lib/demo-data'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import type { TemplateName } from '@/types/templates'
import type { TemplateProps } from '@/types'

/* ------------------------------------------------------------------ */
/*  Wall entries — derived from the shared demo-data source            */
/* ------------------------------------------------------------------ */

interface WallEntry {
  template: TemplateName
  url: string
  props: TemplateProps
}

const ENTRIES: WallEntry[] = TEMPLATE_CONFIGS.map((config) => ({
  template: config.name,
  url: `${DEMO_HANDLES[config.name] ?? config.name}.vizly.fr`,
  props: getDemoPortfolio(config.name, config.isPremium),
}))

/* ------------------------------------------------------------------ */
/*  Distribute across 3 columns                                       */
/* ------------------------------------------------------------------ */

const COL_1 = [0, 3, 6].flatMap((i) => ENTRIES[i] ? [ENTRIES[i]] : []) // minimal, colore, elegant
const COL_2 = [1, 4, 7].flatMap((i) => ENTRIES[i] ? [ENTRIES[i]] : []) // dark, creatif, bento
const COL_3 = [2, 5].flatMap((i) => ENTRIES[i] ? [ENTRIES[i]] : [])    // classique, brutalist

/* ------------------------------------------------------------------ */
/*  Auto-height template preview (measures real content)              */
/* ------------------------------------------------------------------ */

const RENDER_WIDTH = 768
const SCALE_BOOST = 1.0

function AutoHeightPreview({ templateName, templateProps }: { templateName: string; templateProps: TemplateProps }) {
  const [Component, setComponent] = useState<ComponentType<TemplateProps> | null>(null)
  const [height, setHeight] = useState(320)
  const [scale, setScale] = useState(0.19)
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const mod = await import('@/components/templates')
        const map = mod.templateMap as Record<string, ComponentType<TemplateProps>>
        const comp = map[templateName as TemplateName]
        if (!cancelled && comp) setComponent(() => comp)
      } catch { /* template not found */ }
    }
    void load()
    return () => { cancelled = true }
  }, [templateName])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale((entry.contentRect.width / RENDER_WIDTH) * SCALE_BOOST)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [Component])

  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setHeight(entry.contentRect.height * scale)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [Component, scale])

  if (!Component) {
    return <div className="h-[320px] bg-surface-warm/50" />
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden" style={{ height }}>
      <div
        ref={innerRef}
        className="absolute top-0 pointer-events-none"
        style={{
          width: `${RENDER_WIDTH}px`,
          left: '50%',
          marginLeft: `${-RENDER_WIDTH / 2}px`,
          transformOrigin: 'top center',
          transform: `scale(${scale})`,
        }}
      >
        <Component {...templateProps} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Card: mini browser frame + auto-height template preview           */
/* ------------------------------------------------------------------ */

function Card({ entry }: { entry: WallEntry }) {
  return (
    <div className="w-full rounded-[var(--radius-lg)] ring-1 ring-border overflow-hidden">
      {/* Mini browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-warm px-2.5 py-1.5">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6259]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFBF2F]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#29CE42]" />
        </div>
        <div className="flex-1 flex justify-center">
          <span className="text-[8px] text-muted-foreground font-mono truncate">
            {entry.url}
          </span>
        </div>
      </div>

      {/* Real template preview — auto-height */}
      <AutoHeightPreview templateName={entry.template} templateProps={entry.props} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Column: duplicated track for seamless infinite scroll             */
/* ------------------------------------------------------------------ */

interface ColumnProps {
  entries: WallEntry[]
  direction: 'up' | 'down'
  duration: string
  className?: string
}

function Column({ entries, direction, duration, className }: ColumnProps) {
  const doubled = [...entries, ...entries]
  const animClass = direction === 'up' ? 'animate-scroll-up' : 'animate-scroll-down'

  return (
    <div className={`flex-1 min-w-0 overflow-hidden ${className ?? ''}`}>
      <div
        className={`flex flex-col gap-3 ${animClass}`}
        style={{ animationDuration: duration, willChange: 'transform' }}
      >
        {doubled.map((entry, i) => (
          <Card key={`${entry.template}-${i}`} entry={entry} />
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Wall container with mask fade                                     */
/* ------------------------------------------------------------------ */

export function HeroPortfolioWall() {
  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-[54%] overflow-hidden hidden md:flex gap-3 px-2"
      aria-hidden="true"
      style={{
        maskImage:
          'linear-gradient(to right, transparent 0%, black 35%), linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
        maskComposite: 'intersect',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 35%), linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskComposite: 'source-in',
      }}
    >
      <Column entries={COL_1} direction="up" duration="42s" />
      <Column entries={COL_2} direction="down" duration="36s" />
      <Column entries={COL_3} direction="up" duration="52s" className="hidden lg:block" />
    </div>
  )
}
