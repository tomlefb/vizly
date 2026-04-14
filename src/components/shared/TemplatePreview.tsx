'use client'

import { useState, useEffect, type ComponentType } from 'react'
import type { TemplateName } from '@/types/templates'
import type { TemplateProps } from '@/types'

interface TemplatePreviewProps {
  templateName: string
  templateProps: TemplateProps
  scale?: number
  height?: string
}

export function TemplatePreview({
  templateName,
  templateProps,
  scale = 0.35,
  height = '200px',
}: TemplatePreviewProps) {
  const [Component, setComponent] = useState<ComponentType<TemplateProps> | null>(null)

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

  if (!Component) {
    return (
      <div className="flex items-center justify-center bg-surface-warm/50" style={{ height }}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden" style={{ height }}>
      <div
        className="absolute top-0 left-0 origin-top-left pointer-events-none"
        style={{
          width: '1280px',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <Component {...templateProps} isPreview />
      </div>
    </div>
  )
}
