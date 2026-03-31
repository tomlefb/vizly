import Link from 'next/link'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import { templateMap } from '@/components/templates'
import { DEMO_PORTFOLIO, DEMO_COLORS } from '@/lib/demo-data'
import type { TemplateName } from '@/types/templates'

export default async function MesTemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Check which premium templates the user has purchased
  const { data: purchases } = await supabase
    .from('purchased_templates')
    .select('template_name')
    .eq('user_id', user.id)

  const purchasedNames = new Set(
    (purchases ?? []).map((p) => p.template_name)
  )

  const freeTemplates = TEMPLATE_CONFIGS.filter((t) => !t.isPremium)
  const premiumTemplates = TEMPLATE_CONFIGS.filter((t) => t.isPremium)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
          Templates
        </h1>
        <p className="mt-1 text-sm text-muted">
          Decouvre tous les templates disponibles. Clique sur un template pour le voir en detail.
        </p>
      </div>

      {/* Free templates */}
      <section>
        <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold mb-4">
          Gratuits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {freeTemplates.map((template) => (
            <TemplateCard key={template.name} template={template} owned />
          ))}
        </div>
      </section>

      {/* Premium templates */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold">
            Premium
          </h2>
          <span className="text-xs text-muted">2,99&euro; / template</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {premiumTemplates.map((template) => (
            <TemplateCard
              key={template.name}
              template={template}
              owned={purchasedNames.has(template.name)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function TemplateCard({
  template,
  owned,
}: {
  template: (typeof TEMPLATE_CONFIGS)[number]
  owned: boolean
}) {
  const TemplateComponent = templateMap[template.name as TemplateName]
  const colors = DEMO_COLORS[template.name] ?? { primary: '#E8553D', secondary: '#1A1A1A' }

  const demoProps = {
    ...DEMO_PORTFOLIO,
    portfolio: {
      ...DEMO_PORTFOLIO.portfolio,
      primary_color: colors.primary,
      secondary_color: colors.secondary,
    },
    isPremium: template.isPremium,
  }

  return (
    <Link
      href={`/templates/${template.name}`}
      className="group rounded-[var(--radius-xl)] border border-border bg-surface overflow-hidden transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-accent/30"
    >
      {/* Template preview */}
      <div className="relative border-b border-border bg-white overflow-hidden">
        {/* Browser chrome */}
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

        {/* Scaled template render */}
        <div className="relative h-[200px] overflow-hidden">
          {TemplateComponent && (
            <div
              className="absolute top-0 left-0 origin-top-left pointer-events-none"
              style={{
                width: '1280px',
                transform: 'scale(0.38)',
                transformOrigin: 'top left',
              }}
            >
              <TemplateComponent {...demoProps} />
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors duration-200 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-[var(--radius-md)] bg-accent px-4 py-2 text-xs font-semibold text-white shadow-lg">
              Voir le detail
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-[family-name:var(--font-satoshi)] text-base font-semibold">
            {template.label}
          </h3>
          <div className="flex items-center gap-2">
            {template.isPremium && owned && (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                Achete
              </span>
            )}
            {template.isPremium && !owned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/90 px-2 py-0.5 text-[10px] font-semibold text-background">
                <Star className="h-2.5 w-2.5 fill-current" />
                2,99&euro;
              </span>
            )}
            {!template.isPremium && (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                Gratuit
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          {template.description}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Ideal pour : {template.idealFor}
        </p>
      </div>
    </Link>
  )
}
