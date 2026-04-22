'use client'

import { useState, useEffect, useRef, type ComponentType } from 'react'
import type { TemplateName } from '@/types/templates'
import type { TemplateProps } from '@/types'

interface TemplatePreviewProps {
  templateName: string
  templateProps: TemplateProps
  scale?: number
  height?: string
  designWidth?: number
}

export function TemplatePreview({
  templateName,
  templateProps,
  scale = 0.35,
  height = '200px',
  designWidth = 1280,
}: TemplatePreviewProps) {
  const [Component, setComponent] = useState<ComponentType<TemplateProps> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [computedScale, setComputedScale] = useState(scale)

  useEffect(() => {
    let cancelled = false

    async function loadTemplate() {
      try {
        const mod = await import('@/components/templates')
        const map = mod.templateMap as Record<string, ComponentType<TemplateProps>>
        const comp = map[templateName as TemplateName]
        if (!cancelled && comp) {
          setComponent(() => comp)
        }
      } catch {
        // Template not found
      }
    }

    void loadTemplate()
    return () => { cancelled = true }
  }, [templateName])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const width = el.clientWidth
      if (width <= 0) return
      const next = Math.min(scale, width / designWidth)
      setComputedScale(next)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [scale, designWidth, Component])

  if (!Component) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center bg-surface-warm/50"
        style={{ height }}
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden" style={{ height }}>
      <div
        className="absolute top-0 left-0 origin-top-left pointer-events-none"
        style={{
          width: `${designWidth}px`,
          transform: `scale(${computedScale})`,
          transformOrigin: 'top left',
        }}
      >
        <Component {...templateProps} isPreview />
      </div>
    </div>
  )
}
