import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check } from 'lucide-react'
import { PERSONA_LANDINGS, getPersonaLanding } from '@/lib/persona-landings'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import { VzHighlight, vzBtnClasses } from '@/components/ui/vizly'

// Route de catch de slugs "portfolio-photographe", "portfolio-developpeur", etc.
// Next.js résout d'abord les segments statiques (blog, templates, tarifs…)
// donc cette route dynamique ne capte que les slugs persona listés dans
// PERSONA_LANDINGS (dynamicParams = false → 404 pour tout slug inconnu).
export const dynamicParams = false

interface PageProps {
  params: Promise<{ persona: string }>
}

export async function generateStaticParams() {
  return PERSONA_LANDINGS.map((p) => ({ persona: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { persona } = await params
  const landing = getPersonaLanding(persona)
  if (!landing) return {}

  const canonical = `/${landing.slug}`

  return {
    title: landing.metaTitle,
    description: landing.metaDescription,
    keywords: [landing.primaryKeyword, ...landing.secondaryKeywords],
    alternates: { canonical },
    openGraph: {
      title: landing.metaTitle,
      description: landing.metaDescription,
      url: canonical,
      type: 'website',
      siteName: 'Vizly',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title: landing.metaTitle,
      description: landing.metaDescription,
    },
  }
}

export default async function PersonaLandingPage({ params }: PageProps) {
  const { persona } = await params
  const landing = getPersonaLanding(persona)
  if (!landing) notFound()

  const template = TEMPLATE_CONFIGS.find((t) => t.name === landing.recommendedTemplate)

  // BreadcrumbList + WebPage JSON-LD pour le rich snippet et l'autorité
  // topique (Google comprend que cette page couvre le sujet `primaryKeyword`).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: 'https://www.vizly.fr',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: landing.metaTitle,
            item: `https://www.vizly.fr/${landing.slug}`,
          },
        ],
      },
      {
        '@type': 'WebPage',
        name: landing.metaTitle,
        description: landing.metaDescription,
        url: `https://www.vizly.fr/${landing.slug}`,
        about: landing.primaryKeyword,
        keywords: [landing.primaryKeyword, ...landing.secondaryKeywords].join(', '),
        inLanguage: 'fr-FR',
        isPartOf: { '@id': 'https://www.vizly.fr/#website' },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        {/* Hero */}
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            {landing.persona}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-satoshi)] text-4xl font-bold tracking-tight sm:text-5xl leading-[1.08]">
            {landing.headline} <VzHighlight>{landing.headlineAccent}</VzHighlight> en ligne
          </h1>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            {landing.intro}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className={vzBtnClasses({ variant: 'primary', size: 'lg' })}
            >
              Créer mon portfolio
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/templates"
              className={vzBtnClasses({ variant: 'secondary', size: 'lg' })}
            >
              Voir les templates
            </Link>
          </div>
        </header>

        {/* Benefits */}
        <section className="mt-16 sm:mt-20">
          <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
            Pourquoi Vizly pour ton portfolio {landing.persona}
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {landing.benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-[var(--radius-lg)] border border-border-light bg-surface p-6 transition-colors hover:border-border"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Recommended template */}
        {template ? (
          <section className="mt-16 sm:mt-20">
            <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
              Le template que l&apos;on recommande pour toi : <VzHighlight>{template.label}</VzHighlight>
            </h2>
            <p className="mt-3 text-base text-muted leading-relaxed">
              {template.description}. Idéal pour {template.idealFor.toLowerCase()}.
            </p>
            <div className="mt-6">
              <Link
                href={`/templates/${template.name}`}
                className={vzBtnClasses({ variant: 'secondary', size: 'md' })}
              >
                Découvrir le template {template.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        ) : null}

        {/* Examples */}
        <section className="mt-16 sm:mt-20">
          <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
            Exemples de portfolios {landing.persona}
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {landing.examples.map((ex) => (
              <li
                key={ex}
                className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-surface-warm px-4 py-3 text-sm text-foreground"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.5} />
                {ex}
              </li>
            ))}
          </ul>
        </section>

        {/* Bottom CTA */}
        <section className="mt-16 sm:mt-20 rounded-[var(--radius-xl)] border border-border-light bg-surface p-8 sm:p-10 text-center">
          <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold text-foreground leading-[1.1] sm:text-3xl">
            Prêt à créer ton portfolio {landing.persona} ?
          </h2>
          <p className="mt-3 text-muted">
            Gratuit à créer, payant uniquement pour publier. Aucune carte demandée pour commencer.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/register"
              className={vzBtnClasses({ variant: 'primary', size: 'lg' })}
            >
              Commencer maintenant
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
