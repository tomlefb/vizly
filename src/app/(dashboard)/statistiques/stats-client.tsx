'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TemplatePreview } from '@/components/shared/TemplatePreview'
import type { TemplateProps } from '@/types'

// ── Types ──

export interface PortfolioStats {
  id: string
  title: string
  slug: string | null
  published: boolean
  template: string
  templateProps: TemplateProps
  totalViews: number
  viewsToday: number
  viewsLast30: number
  viewsPrev30: number
  sources: Array<{ source: string; count: number }>
}

interface StatsClientProps {
  portfolios: PortfolioStats[]
}

// ── Component ──

export function StatsClient({ portfolios }: StatsClientProps) {
  const publishedPortfolios = useMemo(
    () => portfolios.filter((p) => p.published),
    [portfolios],
  )

  const [selectedId, setSelectedId] = useState<string | null>(
    publishedPortfolios[0]?.id ?? null,
  )

  const selected = useMemo(() => {
    if (!selectedId) return null
    return portfolios.find((p) => p.id === selectedId) ?? null
  }, [selectedId, portfolios])

  const trendPercent = useMemo(() => {
    if (!selected) return 0
    if (selected.viewsPrev30 > 0) {
      return Math.round(
        ((selected.viewsLast30 - selected.viewsPrev30) /
          selected.viewsPrev30) *
          100,
      )
    }
    return selected.viewsLast30 > 0 ? 100 : 0
  }, [selected])

  if (publishedPortfolios.length === 0) {
    return (
      <div>
        <Header />
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted">
            Publie un projet pour commencer à voir ses statistiques.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header />

      {/* ─── Sélecteur de projet ─── */}
      <div className="flex flex-wrap gap-2">
        {publishedPortfolios.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedId(p.id)}
            className={cn(
              'inline-flex h-9 items-center rounded-[var(--radius-md)] border px-4 text-sm transition-colors duration-150',
              selectedId === p.id
                ? 'border-accent bg-accent font-medium text-white'
                : 'border-border bg-surface text-muted-foreground hover:bg-surface-warm hover:text-foreground',
            )}
          >
            {p.slug ? `${p.slug}.vizly.fr` : p.title}
          </button>
        ))}
      </div>

      {selected && (
        <>
        {/* ─── KPIs (pleine largeur) ─── */}
        <div className="mt-8 grid grid-cols-3 divide-x divide-border-light overflow-hidden rounded-[var(--radius-lg)] border border-border">
          <KpiCell label="Vues totales" value={selected.totalViews} />
          <KpiCell
            label="30 derniers jours"
            value={selected.viewsLast30}
            trend={trendPercent}
          />
          <KpiCell label="Aujourd'hui" value={selected.viewsToday} />
        </div>

        {/* ─── Sources + Preview côte à côte ─── */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-sm font-medium text-foreground">
                Sources
              </h2>
              <span className="text-xs text-muted">30 derniers jours</span>
            </div>

            {selected.sources.length > 0 ? (
              <div className="mt-3 overflow-hidden rounded-[var(--radius-lg)] border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-light bg-surface-warm">
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted">
                        Source
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted">
                        Visiteurs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {selected.sources.map((s) => (
                      <tr key={s.source}>
                        <td className="px-4 py-2.5 text-foreground">
                          {s.source}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-foreground tabular-nums">
                          {s.count.toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Pas encore de données sur les sources.
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="hidden lg:block">
            <div className="sticky top-6 overflow-hidden rounded-[var(--radius-lg)] border border-border">
              <div className="flex items-center gap-2 border-b border-border-light bg-surface-warm px-3 py-1.5">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                </div>
                <div className="flex flex-1 justify-center">
                  <div className="max-w-[180px] truncate rounded-[2px] border border-border-light bg-background px-2 py-px font-mono text-[9px] text-muted">
                    {selected.slug
                      ? `${selected.slug}.vizly.fr`
                      : 'Non publié'}
                  </div>
                </div>
              </div>
              <TemplatePreview
                templateName={selected.template}
                templateProps={selected.templateProps}
                scale={0.25}
                height="350px"
              />
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  )
}

// ── Sub-components ──

function Header() {
  return (
    <header className="mb-8">
      <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Mes <span className="text-accent">statistiques</span>.
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Performances et vues de tes portfolios.
      </p>
    </header>
  )
}

function KpiCell({
  label,
  value,
  trend,
}: {
  label: string
  value: number
  trend?: number
}) {
  return (
    <div className="bg-surface px-5 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1.5 font-[family-name:var(--font-satoshi)] text-2xl font-bold text-foreground tabular-nums">
        {value.toLocaleString('fr-FR')}
      </p>
      {trend !== undefined && (
        <div className="mt-1 flex items-center gap-1">
          {trend > 0 ? (
            <ArrowUp className="h-3 w-3 text-success" strokeWidth={2} />
          ) : trend < 0 ? (
            <ArrowDown className="h-3 w-3 text-destructive" strokeWidth={2} />
          ) : (
            <Minus className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              trend > 0
                ? 'text-success'
                : trend < 0
                  ? 'text-destructive'
                  : 'text-muted-foreground',
            )}
          >
            {trend > 0 ? '+' : ''}
            {trend} % vs 30j préc.
          </span>
        </div>
      )}
    </div>
  )
}
