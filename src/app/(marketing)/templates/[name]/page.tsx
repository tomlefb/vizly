import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Star, ArrowLeft, Check } from 'lucide-react'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import { getDemoPortfolio, DEMO_HANDLES } from '@/lib/demo-data'
import { TemplatePreview } from '@/components/shared/TemplatePreview'
import { FullTemplatePreview } from '@/components/shared/FullTemplatePreview'
import { CTASectionTemplateDetail } from '@/components/marketing/CTASection'
import { VzBadge, vzBtnClasses } from '@/components/ui/vizly'

interface PageProps {
  params: Promise<{ name: string }>
}

export async function generateStaticParams() {
  return TEMPLATE_CONFIGS.map((t) => ({ name: t.name }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name } = await params
  const template = TEMPLATE_CONFIGS.find((t) => t.name === name)
  if (!template) return {}
  return {
    title: `Template ${template.label} — Vizly`,
    description: template.description,
  }
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { name } = await params
  const template = TEMPLATE_CONFIGS.find((t) => t.name === name)

  if (!template) {
    notFound()
  }

  const demoProps = getDemoPortfolio(template.name, template.isPremium)
  const handle = DEMO_HANDLES[template.name] ?? 'pseudo'

  const features = [
    'Personnalisable (couleurs, typo, contenu)',
    'Responsive mobile + desktop',
    'Hébergé sur pseudo.vizly.fr',
    'Publié en 5 minutes',
  ]

  return (
    <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-12 sm:pb-16">
          <Link
            href="/templates"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Tous les templates
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl">
                  {template.label}
                </h1>
                {template.isPremium ? (
                  <VzBadge variant="pro">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Premium
                  </VzBadge>
                ) : (
                  <span className="rounded-full bg-success-bg px-3 py-1 text-xs font-semibold text-success-fg">
                    Gratuit
                  </span>
                )}
              </div>

              <p className="text-lg text-muted leading-relaxed mb-6">
                {template.description}
              </p>

              <div className="rounded-[var(--radius-lg)] border border-border-light bg-surface p-5 mb-6">
                <p className="text-sm font-medium text-foreground mb-1">
                  Idéal pour
                </p>
                <p className="text-sm text-muted">
                  {template.idealFor}
                </p>
              </div>

              <ul className="space-y-2.5 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                    <Check className="h-4 w-4 text-success shrink-0" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className={vzBtnClasses({ variant: 'primary', size: 'lg' })}
                >
                  Créer mon portfolio
                </Link>
                <Link
                  href="/templates"
                  className={vzBtnClasses({ variant: 'secondary', size: 'lg' })}
                >
                  Voir les autres templates
                </Link>
              </div>
            </div>

            {/* Mini preview card */}
            <div className="rounded-[var(--radius-lg)] border border-border-light bg-surface overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border-light bg-surface-warm px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="rounded bg-background border border-border-light px-3 py-0.5 text-[11px] text-muted font-mono">
                    {handle}.vizly.fr
                  </div>
                </div>
              </div>
              <TemplatePreview
                templateName={template.name}
                templateProps={demoProps}
                scale={0.44}
                height="500px"
              />
            </div>
          </div>
        </section>

        {/* Full-width preview */}
        <section className="border-t border-border-light bg-surface-warm/30 pt-10 pb-12 sm:pt-12 sm:pb-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 mb-8">
            <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
              Preview complète
            </h2>
            <p className="mt-2 text-sm text-muted">
              Voici à quoi ressemble un portfolio avec le template {template.label} et du contenu réaliste.
            </p>
          </div>

          <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
            <div className="rounded-[var(--radius-lg)] border border-border-light bg-surface overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-border-light bg-surface-warm px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="rounded bg-background border border-border-light px-3 py-0.5 text-[11px] text-muted font-mono">
                    {handle}.vizly.fr
                  </div>
                </div>
              </div>
              <div className="max-h-[800px] overflow-y-auto">
                <FullTemplatePreview templateName={template.name} templateProps={demoProps} />
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <CTASectionTemplateDetail />
    </main>
  )
}
