'use client'

import { Check, X, Minus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { ScrollReveal } from '@/components/shared/ScrollReveal'

type CellValue = true | false | string

interface Row {
  labelKey: string
  free: CellValue
  starter: CellValue
  pro: CellValue
}

const ROWS: Row[] = [
  { labelKey: 'onlinePublish', free: false, starter: 'publishOne', pro: 'publishUnlimited' },
  { labelKey: 'subdomain', free: false, starter: true, pro: true },
  { labelKey: 'customDomain', free: false, starter: false, pro: true },
  { labelKey: 'https', free: false, starter: true, pro: true },
  { labelKey: 'hosting', free: false, starter: true, pro: true },
  { labelKey: 'contactForm', free: false, starter: false, pro: true },
  { labelKey: 'analytics', free: false, starter: false, pro: true },
  { labelKey: 'prioritySupport', free: false, starter: false, pro: true },
  { labelKey: 'vizlyBadge', free: 'badgePreview', starter: 'badgePresent', pro: 'badgeNone' },
]

function CellContent({ value, t }: { value: CellValue; t: (key: string) => string }) {
  if (value === true) {
    return <Check className="h-4 w-4 text-success mx-auto" strokeWidth={2.5} />
  }
  if (value === false) {
    return <X className="h-4 w-4 text-muted-foreground/30 mx-auto" strokeWidth={2} />
  }
  return (
    <span className="text-sm text-foreground">{t(`values.${value}`)}</span>
  )
}

function MobilePlanCard({
  planKey,
  t,
}: {
  planKey: 'free' | 'starter' | 'pro'
  t: (key: string) => string
}) {
  return (
    <div className="border border-border rounded-[var(--radius-lg)] p-5">
      <h4 className="font-[family-name:var(--font-satoshi)] text-base font-semibold mb-4">
        {t(`plans.${planKey}`)}
      </h4>
      <ul className="space-y-2">
        {ROWS.map((row) => {
          const value = row[planKey]
          return (
            <li key={row.labelKey} className="flex items-center gap-2.5 text-sm">
              {value === true ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.5} />
              ) : value === false ? (
                <Minus className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" strokeWidth={2} />
              ) : (
                <Check className="h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.5} />
              )}
              <span className={value === false ? 'text-muted-foreground/50' : 'text-foreground'}>
                {t(`rows.${row.labelKey}`)}
                {typeof value === 'string' && (
                  <span className="text-muted ml-1">— {t(`values.${value}`)}</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function ComparisonTable() {
  const t = useTranslations('comparison')

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal className="mb-10 lg:mb-14">
          <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
            {t('title')} <span className="text-accent">{t('titleAccent')}</span>
          </h2>
          <p className="mt-3 text-muted leading-relaxed max-w-2xl">
            {t('intro')}
          </p>
        </ScrollReveal>

        {/* ── Desktop table ── */}
        <ScrollReveal>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-4 pr-6 text-sm font-semibold text-foreground w-2/5" />
                  <th className="pb-4 px-6 text-sm font-semibold text-foreground text-center w-1/5">
                    {t('plans.free')}
                  </th>
                  <th className="pb-4 px-6 text-sm font-semibold text-foreground text-center w-1/5">
                    {t('plans.starter')}
                  </th>
                  <th className="pb-4 px-6 text-sm font-semibold text-foreground text-center w-1/5">
                    {t('plans.pro')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, rowIdx) => (
                  <tr
                    key={row.labelKey}
                    className={cn(
                      rowIdx % 2 === 1 && 'bg-[#FAFAFA]'
                    )}
                  >
                    <td className="py-3 pr-6 text-sm text-foreground">
                      {t(`rows.${row.labelKey}`)}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <CellContent value={row.free} t={t} />
                    </td>
                    <td className="py-3 px-6 text-center">
                      <CellContent value={row.starter} t={t} />
                    </td>
                    <td className="py-3 px-6 text-center">
                      <CellContent value={row.pro} t={t} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>

        {/* ── Mobile: card per plan ── */}
        <div className="lg:hidden space-y-6">
          <ScrollReveal>
            <MobilePlanCard planKey="free" t={t} />
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <MobilePlanCard planKey="starter" t={t} />
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <MobilePlanCard planKey="pro" t={t} />
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

