'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import { getDemoPortfolio } from '@/lib/demo-data'
import { TemplatePreview } from '@/components/shared/TemplatePreview'
import { StaggerItem } from '@/components/shared/ScrollReveal'
import { VzBadge } from '@/components/ui/vizly'
import type { ReactNode } from 'react'

type Filter = 'all' | 'free' | 'premium'

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'free', label: 'Gratuits' },
  { value: 'premium', label: 'Premium' },
]

export function TemplateShowcase({ header }: { header?: ReactNode }) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = TEMPLATE_CONFIGS.filter((t) => {
    if (filter === 'free') return !t.isPremium
    if (filter === 'premium') return t.isPremium
    return true
  })

  return (
    <div>
      {/* Header + Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        {header}
        <div className="flex gap-2 shrink-0">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200',
                filter === opt.value
                  ? 'bg-foreground text-surface'
                  : 'border border-border-light text-muted hover:text-foreground hover:bg-surface-warm'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((template, i) => {
          const demoProps = getDemoPortfolio(template.name, template.isPremium)

          return (
            <StaggerItem key={template.name} index={i} stagger={0.05}>
            <Link
              href={`/templates/${template.name}`}
              className="block group relative rounded-[var(--radius-lg)] border border-border-light bg-surface overflow-hidden transition-all duration-300 hover:border-border hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
            >
              {/* Premium badge */}
              {template.isPremium && (
                <div className="absolute top-3 right-3 z-10">
                  <VzBadge variant="pro">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Premium 2,99€
                  </VzBadge>
                </div>
              )}

              {/* Real template preview */}
              <div className="relative bg-surface overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 bg-surface-warm px-3 py-1.5 border-b border-border-light">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-border" />
                    <span className="w-1.5 h-1.5 rounded-full bg-border" />
                    <span className="w-1.5 h-1.5 rounded-full bg-border" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="rounded-[2px] bg-background border border-border-light px-2 py-px text-[9px] text-muted font-mono">
                      pseudo.vizly.fr
                    </div>
                  </div>
                </div>

                {/* Scaled template render */}
                <TemplatePreview
                  templateName={template.name}
                  templateProps={demoProps}
                  scale={0.52}
                  height="240px"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 top-[26px] bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[var(--radius-md)] bg-foreground px-5 py-2 text-sm font-semibold text-surface shadow-[2px_2px_0_var(--color-accent)]">
                    Voir ce template
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-[family-name:var(--font-satoshi)] text-base font-semibold">
                    {template.label}
                  </h3>
                  {!template.isPremium && (
                    <span className="rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-medium text-success-fg">
                      Gratuit
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted leading-relaxed mb-2">
                  {template.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  Idéal pour : {template.idealFor}
                </p>
              </div>
            </Link>
            </StaggerItem>
          )
        })}
      </div>
    </div>
  )
}
