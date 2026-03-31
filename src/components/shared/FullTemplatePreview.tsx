'use client'

import { useState, useEffect, type ComponentType } from 'react'
import type { TemplateProps } from '@/types'
import type { TemplateName } from '@/types/templates'

interface FullTemplatePreviewProps {
  templateName: string
  templateProps: TemplateProps
}

export function FullTemplatePreview({ templateName, templateProps }: FullTemplatePreviewProps) {
  const [Component, setComponent] = useState<ComponentType<TemplateProps> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const mod = await import('@/components/templates')
        const map = mod.templateMap as Record<string, ComponentType<TemplateProps>>
        const comp = map[templateName as TemplateName]
        if (!cancelled && comp) setComponent(() => comp)
      } catch { /* ignore */ }
    }

    void load()
    return () => { cancelled = true }
  }, [templateName])

  if (!Component) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      </div>
    )
  }

  return <Component {...templateProps} />
}
