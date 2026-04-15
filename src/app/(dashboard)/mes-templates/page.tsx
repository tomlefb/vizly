import { createClient } from '@/lib/supabase/server'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import { MesTemplatesGrid } from './mes-templates-grid'

export default async function MesTemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: purchases } = await supabase
    .from('purchased_templates')
    .select('template_id')
    .eq('user_id', user.id)

  const purchasedNames = (purchases ?? []).map((p) => p.template_id)

  const freeTemplates = TEMPLATE_CONFIGS.filter((t) => !t.isPremium)
  const premiumTemplates = TEMPLATE_CONFIGS.filter((t) => t.isPremium)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
          Templates
        </h1>
        <p className="mt-1 text-sm text-muted">
          Decouvre tous les templates disponibles. Clique sur un template pour l&apos;utiliser ou l&apos;acheter.
        </p>
      </div>

      <MesTemplatesGrid
        freeTemplates={freeTemplates}
        premiumTemplates={premiumTemplates}
        purchasedNames={purchasedNames}
      />
    </div>
  )
}
