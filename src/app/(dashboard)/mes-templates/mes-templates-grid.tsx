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

  return (
    <>
      <section>
        <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold mb-4">
          Gratuits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {freeTemplates.map((template) => (
            <TemplateCard
              key={template.name}
              template={template}
              status="use"
              onAction={() => router.push('/editor')}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold">
            Premium
          </h2>
          <span className="text-xs text-muted">2,99&euro; / template</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {premiumTemplates.map((template) => {
            const owned = purchasedSet.has(template.name)
            return (
              <TemplateCard
                key={template.name}
                template={template}
                status={owned ? 'use' : 'buy'}
                onAction={() => {
                  if (owned) {
                    router.push('/editor')
                  } else {
                    setActivePurchase(template)
                  }
                }}
              />
            )
          })}
        </div>
      </section>

      {activePurchase && (
        <TemplatePurchaseModal
          open={activePurchase !== null}
          onClose={() => setActivePurchase(null)}
          templateId={activePurchase.name}
          templateLabel={activePurchase.label}
          onSuccess={() => {
            setActivePurchase(null)
            router.push('/editor')
          }}
          onAlreadyOwned={() => {
            setActivePurchase(null)
            router.push('/editor')
          }}
        />
      )}
    </>
  )
}

function TemplateCard({
  template,
  status,
  onAction,
}: {
  template: TemplateConfig
  status: 'use' | 'buy'
  onAction: () => void
}) {
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

  const overlayLabel = status === 'buy' ? 'Acheter (2,99\u20AC)' : 'Utiliser ce template'

  return (
    <button
      type="button"
      onClick={onAction}
      className="group text-left rounded-[var(--radius-xl)] border border-border bg-surface overflow-hidden transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-accent/30"
    >
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
        <div className="absolute inset-0 top-[26px] bg-accent/0 group-hover:bg-accent/5 transition-colors duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-[var(--radius-md)] bg-accent px-4 py-2 text-xs font-semibold text-white shadow-lg">
            {overlayLabel}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-[family-name:var(--font-satoshi)] text-base font-semibold">
            {template.label}
          </h3>
          {template.isPremium ? (
            status === 'use' ? (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                Achete
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/90 px-2 py-0.5 text-[10px] font-semibold text-background">
                <Star className="h-2.5 w-2.5 fill-current" />
                2,99&euro;
              </span>
            )
          ) : (
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
              Gratuit
            </span>
          )}
        </div>
        <p className="text-xs text-muted leading-relaxed">{template.description}</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Idéal pour&nbsp;: {template.idealFor}
        </p>
      </div>
    </button>
  )
}
