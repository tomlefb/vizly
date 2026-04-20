import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPortfoliosWithDomains } from '@/actions/portfolio'
import { Globe } from 'lucide-react'
import {
  VzBadge,
  VzHighlight,
  vzBtnClasses,
} from '@/components/ui/vizly'
import { DomainAssignmentForm } from './domain-assignment-form'
import type { PlanType } from '@/lib/constants'

export default async function DomainesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'free') as PlanType

  if (plan !== 'pro') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border border-border-light bg-surface-sunken">
          <Globe
            className="h-5 w-5 text-muted-foreground"
            strokeWidth={1.5}
          />
        </div>
        <h3 className="mt-5 font-[family-name:var(--font-satoshi)] text-lg font-semibold text-foreground">
          Domaines personnalisés
        </h3>
        <p className="mt-2 text-sm text-muted">
          Connecte ton propre nom de domaine à chacun de tes portfolios.
          Disponible avec le plan Pro.
        </p>
        <Link
          href="/billing"
          className={vzBtnClasses({ variant: 'primary', size: 'md', className: 'mt-7' })}
        >
          Passer au Pro
        </Link>
      </div>
    )
  }

  const { data: portfolios } = await getPortfoliosWithDomains()

  return (
    <div>
      <header className="mb-10">
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Mes <VzHighlight>domaines</VzHighlight>
        </h1>
        <p className="mt-2 text-sm text-muted">
          Connecte ton propre nom de domaine à tes portfolios.
        </p>
      </header>

      <div className="divide-y divide-border-light">
        {/* ─── Tuto : comment ça marche ─── */}
        <section className="pb-10">
          <h2 className="font-[family-name:var(--font-satoshi)] text-base font-semibold text-foreground">
            Comment ça marche
          </h2>
          <p className="mt-1 text-sm text-muted">
            Trois étapes pour relier ton domaine à ton portfolio Vizly.
          </p>

          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            <TutoStep
              step={1}
              title="Achète un domaine"
              description="Chez un registrar comme OVH, Namecheap, Cloudflare ou Gandi. Si tu en as déjà un, passe à l'étape 2."
            />
            <TutoStep
              step={2}
              title="Configure le DNS"
              description={
                <>
                  Dans les paramètres DNS de ton registrar, ajoute un
                  enregistrement <Code>CNAME</Code> pointant vers{' '}
                  <Code>cname.vizly.fr</Code>.
                </>
              }
            />
            <TutoStep
              step={3}
              title="Assigne-le ici"
              description="Entre ton domaine dans le champ ci-dessous et clique Enregistrer. Le SSL est automatique."
            />
          </ol>
        </section>

        {/* ─── Liste des portfolios + formulaire domaine ─── */}
        <section className="pt-10">
          <h2 className="font-[family-name:var(--font-satoshi)] text-base font-semibold text-foreground">
            Tes portfolios
          </h2>
          <p className="mt-1 text-sm text-muted">
            Assigne un domaine personnalisé à chaque portfolio.
          </p>

          {portfolios.length > 0 ? (
            <ul className="mt-6 divide-y divide-border-light overflow-hidden rounded-[var(--radius-lg)] border border-border-light">
              {portfolios.map((portfolio) => (
                <li
                  key={portfolio.id}
                  className="bg-surface px-5 py-4 transition-colors duration-150 hover:bg-surface-warm"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium text-foreground">
                        {portfolio.title || 'Sans titre'}
                      </h3>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className="font-mono">
                          {portfolio.slug
                            ? `${portfolio.slug}.vizly.fr`
                            : 'Non publié'}
                        </span>
                        {portfolio.published && (
                          <VzBadge variant="online">En ligne</VzBadge>
                        )}
                      </p>
                    </div>
                  </div>
                  <DomainAssignmentForm
                    portfolioId={portfolio.id}
                    currentDomain={portfolio.custom_domain ?? ''}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-border bg-surface-warm p-8 text-center">
              <p className="text-sm text-muted">
                Crée un projet pour lui assigner un domaine personnalisé.
              </p>
              <Link
                href="/editor"
                className="mt-4 inline-flex items-center text-sm font-medium text-accent-deep transition-colors hover:text-foreground"
              >
                Créer un projet
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function TutoStep({
  step,
  title,
  description,
}: {
  step: number
  title: string
  description: React.ReactNode
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border-light bg-surface-warm font-[family-name:var(--font-satoshi)] text-xs font-bold text-foreground">
        {step}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {description}
        </p>
      </div>
    </li>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-[var(--radius-sm)] bg-surface-sunken px-1.5 py-0.5 font-mono text-xs font-medium text-foreground">
      {children}
    </code>
  )
}
