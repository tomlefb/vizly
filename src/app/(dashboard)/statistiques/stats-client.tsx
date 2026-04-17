'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Link2,
  Minus,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──

export interface PortfolioStats {
  id: string
  title: string
  slug: string | null
  published: boolean
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
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {publishedPortfolios.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] border px-4 text-sm font-medium transition-colors duration-150',
                selectedId === p.id
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-surface text-foreground hover:bg-surface-warm',
              )}
            >
              {p.title}
              {p.slug && (
                <span
                  className={cn(
                    'text-xs',
                    selectedId === p.id
                      ? 'text-background/60'
                      : 'text-muted-foreground',
                  )}
                >
                  {p.slug}.vizly.fr
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <>
          {/* ─── KPI cards ─── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard icon={Eye} label="Vues totales" value={selected.totalViews} />
            <StatCard
              icon={TrendingUp}
              label="30 derniers jours"
              value={selected.viewsLast30}
              trend={trendPercent}
            />
            <StatCard icon={Eye} label="Aujourd'hui" value={selected.viewsToday} />
          </div>

          {/* ─── Sources ─── */}
          <section className="mt-10">
            <h2 className="font-[family-name:var(--font-satoshi)] text-base font-semibold text-foreground">
              Sources
            </h2>
            <p className="mt-1 text-sm text-muted">
              D&apos;où viennent les visiteurs de{' '}
              <span className="font-medium text-foreground">
                {selected.title}
              </span>{' '}
              (30 derniers jours).
            </p>

            {selected.sources.length > 0 ? (
              <ul className="mt-6 space-y-1">
                {selected.sources.map((s) => {
                  const maxCount = selected.sources[0]?.count ?? 1
                  const widthPct = Math.max(
                    8,
                    Math.round((s.count / maxCount) * 100),
                  )
                  return (
                    <li key={s.source} className="group relative">
                      <div
                        className="absolute inset-y-0 left-0 rounded-[var(--radius-sm)] bg-surface-warm transition-colors group-hover:bg-accent/5"
                        style={{ width: `${widthPct}%` }}
                      />
                      <div className="relative flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Link2
                            className="h-3 w-3 shrink-0 text-muted-foreground"
                            strokeWidth={1.5}
                          />
                          <span className="text-sm text-foreground truncate">
                            {s.source}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground tabular-nums">
                          {s.count.toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted">
                  Pas encore de données sur les sources.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

// ── Sub-components ──

function Header() {
  return (
    <header className="mb-10">
      <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Mes <span className="text-accent">statistiques</span>.
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Performances et vues de tes portfolios.
      </p>
    </header>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: number
  trend?: number
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-sm text-muted">{label}</p>
      </div>
      <p className="mt-2 font-[family-name:var(--font-satoshi)] text-3xl font-bold text-foreground tabular-nums">
        {value.toLocaleString('fr-FR')}
      </p>
      {trend !== undefined && (
        <div className="mt-1.5 flex items-center gap-1">
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
