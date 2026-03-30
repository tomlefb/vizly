'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TEMPLATE_CONFIGS, type TemplateName } from '@/types/templates'

type Filter = 'all' | 'free' | 'premium'

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'free', label: 'Gratuits' },
  { value: 'premium', label: 'Premium' },
]

/** Color accents per template for the visual preview cards */
const TEMPLATE_ACCENTS: Record<TemplateName, string> = {
  minimal: '#1A1A1A',
  dark: '#00D4FF',
  classique: '#2D5A3D',
  colore: '#FF6B6B',
  creatif: '#8B6914',
  brutalist: '#E8553D',
  elegant: '#8F6B4A',
  bento: '#4A3D8F',
}

export function TemplateShowcase() {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = TEMPLATE_CONFIGS.filter((t) => {
    if (filter === 'free') return !t.isPremium
    if (filter === 'premium') return t.isPremium
    return true
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-8">
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((template) => {
          const accent = TEMPLATE_ACCENTS[template.name]
          return (
            <Link
              key={template.name}
              href="/register"
              className="group relative rounded-[var(--radius-xl)] border border-border bg-surface overflow-hidden transition-all duration-300 hover:border-accent/30 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
            >
              {/* Premium badge */}
              {template.isPremium && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-foreground/90 px-3 py-1 text-[11px] font-semibold text-background backdrop-blur-sm">
                    <Star className="h-3 w-3 fill-current" />
                    Premium 2,99&euro;
                  </span>
                </div>
              )}

              {/* Visual preview area */}
              <div
                className="relative h-48 sm:h-56"
                style={{ backgroundColor: `${accent}08` }}
              >
                {/* Mock layout blocks */}
                <div className="absolute inset-4 flex gap-3">
                  <div className="flex-1 flex flex-col gap-2">
                    <div
                      className="h-4 w-2/3 rounded-sm"
                      style={{ backgroundColor: `${accent}20` }}
                    />
                    <div
                      className="h-3 w-1/2 rounded-sm"
                      style={{ backgroundColor: `${accent}12` }}
                    />
                    <div className="flex-1 mt-2 rounded-[var(--radius-md)]"
                      style={{ backgroundColor: `${accent}10` }}
                    />
                  </div>
                  <div className="w-1/3 flex flex-col gap-2">
                    <div
                      className="flex-1 rounded-[var(--radius-md)]"
                      style={{ backgroundColor: `${accent}14` }}
                    />
                    <div
                      className="h-1/3 rounded-[var(--radius-md)]"
                      style={{ backgroundColor: `${accent}08` }}
                    />
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors duration-300 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[var(--radius-md)] bg-accent px-5 py-2 text-sm font-semibold text-white shadow-lg">
                    Essayer ce template
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
                  Ideal pour : {template.idealFor}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
