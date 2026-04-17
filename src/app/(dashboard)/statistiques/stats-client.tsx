'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TemplatePreview } from '@/components/shared/TemplatePreview'
import type { TemplateProps } from '@/types'

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
  dailyViews: Array<{ date: string; count: number }>
}

interface StatsClientProps {
  portfolios: PortfolioStats[]
}

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
          {/* ─── Ligne 1 : Preview | KPIs (stretch pour aligner) ─── */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_3fr]">
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
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
                scale={0.35}
              />
            </div>

            <div className="divide-y divide-border-light overflow-hidden rounded-[var(--radius-lg)] border border-border self-start">
              <KpiRow label="Vues totales" value={selected.totalViews} />
              <KpiRow
                label="30 derniers jours"
                value={selected.viewsLast30}
                trend={trendPercent}
              />
              <KpiRow label="Aujourd'hui" value={selected.viewsToday} />
            </div>
          </div>

          {/* ─── Ligne 2 : Sources | Chart (même colonnes, stretch) ─── */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_3fr]">
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

            <DailyChart days={selected.dailyViews} />
          </div>
        </>
      )}
    </div>
  )
}

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

function KpiRow({
  label,
  value,
  trend,
}: {
  label: string
  value: number
  trend?: number
}) {
  return (
    <div className="flex items-center justify-between gap-4 bg-surface px-6 py-5">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
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
      <p className="font-[family-name:var(--font-satoshi)] text-3xl font-bold text-foreground tabular-nums">
        {value.toLocaleString('fr-FR')}
      </p>
    </div>
  )
}

function DailyChart({
  days,
}: {
  days: Array<{ date: string; count: number }>
}) {
  const maxCount = Math.max(...days.map((d) => d.count), 1)
  const ySteps = buildYScale(maxCount)

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-medium text-foreground">Vues par jour</h2>
        <span className="text-xs text-muted">30 derniers jours</span>
      </div>

      <div className="mt-3 flex min-h-[160px] flex-1 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface p-4 pl-2">
        <div className="flex flex-1">
          {/* Y axis */}
          <div className="flex w-7 shrink-0 flex-col-reverse justify-between pr-2 pb-5">
            {ySteps.map((v) => (
              <span
                key={v}
                className="text-right text-[9px] leading-none text-muted tabular-nums"
              >
                {v}
              </span>
            ))}
          </div>

          {/* Bars + X axis */}
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 items-end gap-[3px]">
              {days.map((day) => {
                const pct =
                  day.count > 0
                    ? Math.max(3, Math.round((day.count / maxCount) * 100))
                    : 0
                const date = new Date(day.date + 'T00:00:00')
                const label = `${date.getDate()}/${date.getMonth() + 1}`
                return (
                  <div key={day.date} className="group relative flex-1">
                    <div
                      className="w-full rounded-t-[2px] bg-accent/25 transition-colors group-hover:bg-accent/50"
                      style={{ height: `${pct}%` }}
                    />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[10px] font-medium text-background group-hover:block">
                      {day.count} vue{day.count !== 1 ? 's' : ''} · {label}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-1.5 flex gap-[3px]">
              {days.map((day, i) => {
                const date = new Date(day.date + 'T00:00:00')
                const showLabel =
                  i === 0 || i === days.length - 1 || i % 7 === 0
                return (
                  <div key={day.date} className="flex-1 text-center">
                    {showLabel && (
                      <span className="text-[9px] text-muted tabular-nums">
                        {date.getDate()}/{date.getMonth() + 1}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function buildYScale(max: number): number[] {
  if (max <= 5) return [0, Math.ceil(max / 2), max]
  const step = Math.ceil(max / 4)
  const steps: number[] = [0]
  for (let v = step; v < max; v += step) steps.push(v)
  steps.push(max)
  return steps
}
