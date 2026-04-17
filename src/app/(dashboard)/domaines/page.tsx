import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPortfoliosWithDomains } from '@/actions/portfolio'
import { Globe } from 'lucide-react'
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
        <Globe
          className="h-9 w-9 text-muted-foreground/50"
          strokeWidth={1.5}
        />
        <h3 className="mt-5 font-[family-name:var(--font-satoshi)] text-lg font-semibold text-foreground">
          Domaines personnalisés
        </h3>
        <p className="mt-2 text-sm text-muted">
          Connecte ton propre nom de domaine à chacun de tes portfolios.
          Disponible avec le plan Pro.
        </p>
        <div className="mt-7">
          <Link
            href="/billing"
            className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-accent px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
          >
            Passer au Pro
          </Link>
        </div>
      </div>
    )
  }

  const { data: portfolios } = await getPortfoliosWithDomains()

  return (
    <div>
      <header className="mb-10">
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Mes <span className="text-accent">domaines</span>.
        </h1>
        <p className="mt-1.5 text-sm text-muted">
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
            <ul className="mt-6 divide-y divide-border-light rounded-[var(--radius-lg)] border border-border overflow-hidden">
              {portfolios.map((portfolio) => (
                <li key={portfolio.id} className="bg-surface px-5 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {portfolio.title || 'Sans titre'}
                      </h3>
                      <p className="text-xs text-muted">
                        {portfolio.slug
                          ? `${portfolio.slug}.vizly.fr`
                          : 'Non publié'}
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
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted">
                Crée un projet pour lui assigner un domaine personnalisé.
              </p>
              <Link
                href="/editor"
                className="mt-4 inline-flex items-center text-sm font-medium text-accent hover:text-accent-hover transition-colors"
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
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-warm text-xs font-semibold text-foreground">
        {step}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted leading-relaxed">
          {description}
        </p>
      </div>
    </li>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-surface-warm px-1.5 py-0.5 font-mono text-xs font-medium text-foreground">
      {children}
    </code>
  )
}
