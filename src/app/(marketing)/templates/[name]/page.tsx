import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Star, ArrowLeft, Check } from 'lucide-react'
import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import { templateMap } from '@/components/templates'
import { DEMO_PORTFOLIO, DEMO_COLORS } from '@/lib/demo-data'

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

  const TemplateComponent = templateMap[template.name]
  if (!TemplateComponent) {
    notFound()
  }

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

  const features = [
    'Personnalisable (couleurs, typo, contenu)',
    'Responsive mobile + desktop',
    'Heberge sur pseudo.vizly.fr',
    'Publie en 5 minutes',
  ]

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 lg:px-8 pt-12 pb-16">
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
                  <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                    <Star className="h-3 w-3 fill-current" />
                    Premium
                  </span>
                ) : (
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                    Gratuit
                  </span>
                )}
              </div>

              <p className="text-lg text-muted leading-relaxed mb-6">
                {template.description}
              </p>

              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 mb-6">
                <p className="text-sm font-medium text-foreground mb-1">
                  Ideal pour
                </p>
                <p className="text-sm text-muted">
                  {template.idealFor}
                </p>
              </div>

              <ul className="space-y-2.5 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-success/10">
                      <Check className="h-3 w-3 text-success" strokeWidth={2.5} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center rounded-[var(--radius-md)] bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
                >
                  {template.isPremium ? 'Essayer ce template (2,99\u20AC)' : 'Utiliser ce template'}
                </Link>
                <Link
                  href="/templates"
                  className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-warm"
                >
                  Voir les autres templates
                </Link>
              </div>
            </div>

            {/* Mini preview card */}
            <div className="rounded-[var(--radius-xl)] border border-border bg-surface overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 border-b border-border bg-surface-warm px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6259]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFBF2F]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#29CE42]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="rounded bg-background border border-border-light px-3 py-0.5 text-[11px] text-muted font-mono">
                    mariedupont.vizly.fr
                  </div>
                </div>
              </div>
              <div className="relative h-[500px] overflow-hidden">
                <div
                  className="absolute top-0 left-0 origin-top-left"
                  style={{
                    width: '1280px',
                    transform: 'scale(0.44)',
                    transformOrigin: 'top left',
                  }}
                >
                  <TemplateComponent {...demoProps} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full-width preview */}
        <section className="border-t border-border bg-surface-warm/30 pt-12 pb-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-8">
            <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
              Preview complete
            </h2>
            <p className="mt-2 text-sm text-muted">
              Voici a quoi ressemble un portfolio avec le template {template.label} et du contenu realiste.
            </p>
          </div>

          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="rounded-[var(--radius-xl)] border border-border bg-surface overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-border bg-surface-warm px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6259]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFBF2F]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#29CE42]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="rounded bg-background border border-border-light px-3 py-0.5 text-[11px] text-muted font-mono">
                    mariedupont.vizly.fr
                  </div>
                </div>
              </div>
              {/* Live template render */}
              <div className="max-h-[800px] overflow-y-auto">
                <TemplateComponent {...demoProps} />
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center">
          <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight mb-3">
            Pret a creer ton portfolio ?
          </h2>
          <p className="text-muted mb-6 max-w-md mx-auto text-sm leading-relaxed">
            Inscris-toi gratuitement, choisis le template {template.label} et personnalise-le en quelques minutes.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center rounded-[var(--radius-md)] bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
          >
            Commencer gratuitement
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}
