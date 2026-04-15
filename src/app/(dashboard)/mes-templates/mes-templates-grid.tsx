'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
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
  const router = useRouter()
  const [activePurchase, setActivePurchase] = useState<TemplateConfig | null>(
    null,
  )

  const purchasedSet = new Set(purchasedNames)
  const ownedTemplates = [
    ...freeTemplates,
    ...premiumTemplates.filter((t) => purchasedSet.has(t.name)),
  ]
  const availableToBuy = premiumTemplates.filter((t) => !purchasedSet.has(t.name))

  return (
    <>
      <section>
        <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold mb-4">
          Vos templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ownedTemplates.map((template) => (
            <TemplateCard key={template.name} template={template} variant="owned" />
          ))}
        </div>
      </section>

      {availableToBuy.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold">
              Premium
            </h2>
            <span className="text-xs text-muted">2,99&euro; / template</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {availableToBuy.map((template) => (
              <TemplateCard
                key={template.name}
                template={template}
                variant="buy"
                onBuy={() => setActivePurchase(template)}
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

type CardProps =
  | { template: TemplateConfig; variant: 'owned'; onBuy?: undefined }
  | { template: TemplateConfig; variant: 'buy'; onBuy: () => void }

function TemplateCard({ template, variant, onBuy }: CardProps) {
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
    <div className="relative border-b border-border bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-surface-warm px-3 py-1.5">
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
      <TemplatePreview
        templateName={template.name}
        templateProps={demoProps}
        scale={0.48}
        height="220px"
      />
    </div>
  )

  const meta = (
    <div className="p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-[family-name:var(--font-satoshi)] text-base font-semibold">
          {template.label}
        </h3>
        {variant === 'owned' ? (
          template.isPremium ? (
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
              Achete
            </span>
          ) : (
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
              Gratuit
            </span>
          )
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground/90 px-2 py-0.5 text-[10px] font-semibold text-background">
            <Star className="h-2.5 w-2.5 fill-current" />
            2,99&euro;
          </span>
        )}
      </div>
      <p className="text-xs text-muted leading-relaxed">{template.description}</p>
      <p className="text-[11px] text-muted-foreground mt-1">
        Idéal pour&nbsp;: {template.idealFor}
      </p>
    </div>
  )

  if (variant === 'owned') {
    return (
      <div className="rounded-[var(--radius-xl)] border border-border bg-surface overflow-hidden">
        {chrome}
        {meta}
      </div>
    )
  }

  return (
    <div className="group rounded-[var(--radius-xl)] border border-border bg-surface overflow-hidden transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-accent/30">
      <div className="relative">
        {chrome}
        <div className="absolute inset-0 top-[26px] bg-accent/0 group-hover:bg-accent/5 transition-colors duration-200 pointer-events-none" />
      </div>
      {meta}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onBuy}
          className="w-full inline-flex items-center justify-center h-10 rounded-[var(--radius-md)] bg-accent px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
        >
          Acheter (2,99&euro;)
        </button>
      </div>
    </div>
  )
}
