'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { TemplateConfig } from '@/types/templates'
import { DEMO_PORTFOLIO, DEMO_COLORS } from '@/lib/demo-data'
import { TemplatePreview } from '@/components/shared/TemplatePreview'
import { TemplatePurchaseModal } from '@/components/billing/TemplatePurchaseModal'

interface Props {
  freeTemplates: TemplateConfig[]
  premiumTemplates: TemplateConfig[]
  purchasedNames: string[]
}

export function MesTemplatesGrid({
  freeTemplates,
  premiumTemplates,
  purchasedNames,
}: Props) {
  const t = useTranslations('mesTemplates')
  const router = useRouter()
  const [activePurchase, setActivePurchase] = useState<TemplateConfig | null>(
    null,
  )

  const purchasedSet = new Set(purchasedNames)
  const ownedTemplates = [
    ...freeTemplates,
    ...premiumTemplates.filter((t) => purchasedSet.has(t.name)),
  ]
  const availableToBuy = premiumTemplates.filter(
    (t) => !purchasedSet.has(t.name),
  )

  return (
    <>
      <section>
        <div className="mb-5 flex items-baseline gap-2">
          <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold">
            {t('sectionOwned')}
          </h2>
          <span className="text-xs text-muted-foreground">
            {t('count', { count: ownedTemplates.length })}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {ownedTemplates.map((template) => (
            <TemplateCard
              key={template.name}
              template={template}
              variant="owned"
              isPurchased={purchasedSet.has(template.name)}
              t={t}
            />
          ))}
        </div>
      </section>

      {availableToBuy.length > 0 && (
        <section>
          <div className="mb-5 flex items-baseline gap-2">
            <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold">
              {t('sectionPremium')}
            </h2>
            <span className="text-xs text-muted-foreground">
              {t('count', { count: availableToBuy.length })}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {availableToBuy.map((template) => (
              <TemplateCard
                key={template.name}
                template={template}
                variant="buy"
                onBuy={() => setActivePurchase(template)}
                t={t}
              />
            ))}
          </div>
        </section>
      )}

      {activePurchase && (
        <TemplatePurchaseModal
          open={activePurchase !== null}
          onClose={() => setActivePurchase(null)}
          templateId={activePurchase.name}
          templateLabel={activePurchase.label}
          onSuccess={() => {
            setActivePurchase(null)
            router.refresh()
          }}
          onAlreadyOwned={() => {
            setActivePurchase(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

type TemplateCardProps =
  | {
      template: TemplateConfig
      variant: 'owned'
      isPurchased: boolean
      onBuy?: undefined
      t: ReturnType<typeof useTranslations<'mesTemplates'>>
    }
  | {
      template: TemplateConfig
      variant: 'buy'
      isPurchased?: undefined
      onBuy: () => void
      t: ReturnType<typeof useTranslations<'mesTemplates'>>
    }

function TemplateCard({
  template,
  variant,
  isPurchased,
  onBuy,
  t,
}: TemplateCardProps) {
  const colors = DEMO_COLORS[template.name] ?? {
    primary: '#D4634E',
    secondary: '#1A1A1A',
  }
  const demoProps = {
    ...DEMO_PORTFOLIO,
    portfolio: {
      ...DEMO_PORTFOLIO.portfolio,
      primary_color: colors.primary,
      secondary_color: colors.secondary,
    },
    isPremium: template.isPremium,
  }

  const chrome = (
    <div className="border-b border-border-light bg-background overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border-light bg-surface-warm px-3 py-1.5">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex flex-1 justify-center">
          <div className="rounded-[2px] border border-border-light bg-background px-2 py-px font-mono text-[9px] text-muted">
            pseudo.vizly.fr
          </div>
        </div>
      </div>
      <TemplatePreview
        templateName={template.name}
        templateProps={demoProps}
        scale={0.48}
        height="220px"
      />
    </div>
  )

  const badge =
    variant === 'owned' ? (
      isPurchased ? (
        <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
          {t('badgePurchased')}
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-surface-warm px-2 py-0.5 text-[10px] font-semibold text-muted">
          {t('badgeFree')}
        </span>
      )
    ) : (
      <span className="inline-flex items-center rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-semibold text-background">
        2,99&nbsp;€
      </span>
    )

  const meta = (
    <div className="p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--font-satoshi)] text-base font-semibold text-foreground">
          {template.label}
        </h3>
        {badge}
      </div>
      <p className="text-sm text-muted leading-relaxed">
        {template.description}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {t('idealFor')}&nbsp;: {template.idealFor}
      </p>
    </div>
  )

  if (variant === 'owned') {
    return (
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border-light bg-surface transition-all duration-200 hover:border-border hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        {chrome}
        {meta}
      </div>
    )
  }

  const buyButton = (
    <button
      type="button"
      onClick={onBuy}
      className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] bg-accent px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
    >
      {t('buy')}
    </button>
  )

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border-light bg-surface transition-all duration-200 hover:border-border hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="group relative">
        {chrome}
        {/* Desktop hover overlay — reveals buy button on top of the preview */}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-surface/90 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100 md:flex">
          {buyButton}
        </div>
      </div>
      {meta}
      {/* Mobile fallback — inline button, always visible */}
      <div className="flex justify-center px-5 pb-5 md:hidden">{buyButton}</div>
    </div>
  )
}
