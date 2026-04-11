'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import { getDemoPortfolio } from '@/lib/demo-data'
import { TemplatePreview } from '@/components/shared/TemplatePreview'
import { StaggerItem } from '@/components/shared/ScrollReveal'
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
                  ? 'bg-foreground text-background'
                  : 'border border-border text-muted hover:text-foreground hover:bg-surface-warm'
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
              className="block group relative rounded-[var(--radius-xl)] border border-border bg-surface overflow-hidden transition-all duration-300 hover:border-accent/30 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
            >
              {/* Premium badge */}
              {template.isPremium && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-foreground/90 px-3 py-1 text-[11px] font-semibold text-background backdrop-blur-sm">
                    <Star className="h-3 w-3 fill-current" />
                    Premium 2,99&euro;
                  </span>
                </div>
              )}

              {/* Real template preview */}
              <div className="relative bg-white overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 bg-surface-warm px-3 py-1.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6259]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFBF2F]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#29CE42]" />
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
                <div className="absolute inset-0 top-[26px] bg-accent/0 group-hover:bg-accent/5 transition-colors duration-300 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[var(--radius-md)] bg-accent px-5 py-2 text-sm font-semibold text-white shadow-lg">
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
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
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
