import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getPortfoliosWithDomains } from '@/actions/portfolio'
import { DomainAssignmentForm } from './domain-assignment-form'
import type { PlanType } from '@/lib/constants'

export default async function DomainesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'free') as PlanType

  if (plan !== 'pro') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
          Domaines personnalises
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted leading-relaxed">
          Connecte ton propre nom de domaine a chacun de tes portfolios pour une presence en ligne 100% professionnelle.
        </p>
        <Link
          href="/billing"
          className="mt-6 inline-flex items-center h-10 rounded-lg bg-[#E8553D] px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#D4442E]"
        >
          Passer au Pro
        </Link>
      </div>
    )
  }

  const { data: portfolios } = await getPortfoliosWithDomains()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
          Domaines personnalises
        </h1>
        <p className="mt-1 text-sm text-muted">
          Assigne un nom de domaine personnalise a chacun de tes projets.
        </p>
      </div>

      {/* DNS instruction */}
      <div className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50/50 p-4">
        <p className="text-sm font-medium text-amber-800">Configuration DNS</p>
        <p className="mt-1 text-xs text-amber-700">
          Pour chaque domaine, crée un enregistrement <span className="font-mono font-semibold">CNAME</span> pointant vers <span className="font-mono font-semibold">cname.vizly.fr</span> chez ton registrar.
        </p>
      </div>

      {portfolios.length > 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface divide-y divide-border">
          {portfolios.map((portfolio) => (
            <div key={portfolio.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {portfolio.title || 'Sans titre'}
                  </h3>
                  <p className="text-xs text-muted">
                    {portfolio.slug ? `${portfolio.slug}.vizly.fr` : 'Non publie'}
                    {portfolio.published && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                        En ligne
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <DomainAssignmentForm
                portfolioId={portfolio.id}
                currentDomain={portfolio.custom_domain ?? ''}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted">
            Crée un projet pour lui assigner un domaine personnalisé.
          </p>
          <Link
            href="/editor"
            className="mt-4 inline-flex items-center text-sm font-medium text-accent hover:text-accent-hover"
          >
            Creer un projet
          </Link>
        </div>
      )}
    </div>
  )
}
