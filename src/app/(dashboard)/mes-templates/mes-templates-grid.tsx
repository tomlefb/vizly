'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { TemplateConfig } from '@/types/templates'
import { DEFAULT_PORTFOLIO_COLOR } from '@/lib/constants'
import { DEMO_PORTFOLIO, DEMO_COLORS } from '@/lib/demo-data'
import { TemplatePreview } from '@/components/shared/TemplatePreview'
import { VzBadge, VzBtn } from '@/components/ui/vizly'
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
    primary: DEFAULT_PORTFOLIO_COLOR,
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
    <div className="overflow-hidden border-b border-border-light bg-surface-sunken">
      <div className="flex items-center gap-2 border-b border-border-light bg-surface-warm px-3 py-1.5">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex flex-1 justify-center">
          <div className="rounded-[2px] border border-border-light bg-surface px-2 py-px font-mono text-[9px] text-muted">
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
        <VzBadge variant="online">{t('badgePurchased')}</VzBadge>
      ) : (
        <VzBadge variant="draft">{t('badgeFree')}</VzBadge>
      )
    ) : (
      <VzBadge variant="pro">2,99&nbsp;€</VzBadge>
    )

  const meta = (
    <div className="p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--font-satoshi)] text-base font-semibold text-foreground">
          {template.label}
        </h3>
        {badge}
      </div>
      <p className="text-sm leading-relaxed text-muted">
        {template.description}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {t('idealFor')}&nbsp;: {template.idealFor}
      </p>
    </div>
  )

  if (variant === 'owned') {
    return (
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border-light bg-surface transition-all duration-200 hover:border-border hover:shadow-[var(--shadow-card-hover)]">
        {chrome}
        {meta}
      </div>
    )
  }

  const buyButton = (
    <VzBtn variant="primary" size="md" onClick={onBuy}>
      {t('buy')}
    </VzBtn>
  )

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border-light bg-surface transition-all duration-200 hover:border-border hover:shadow-[var(--shadow-card-hover)]">
      <div className="group relative">
        {chrome}
        {/* Desktop hover overlay — reveals buy button on top of the preview.
            has-[:focus-visible] keeps it a11y for keyboard users. */}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-surface-warm/85 opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 has-[:focus-visible]:pointer-events-auto has-[:focus-visible]:opacity-100 md:flex">
          {buyButton}
        </div>
      </div>
      {meta}
      {/* Mobile fallback — inline button, always visible */}
      <div className="flex justify-center px-5 pb-5 md:hidden">{buyButton}</div>
    </div>
  )
}
