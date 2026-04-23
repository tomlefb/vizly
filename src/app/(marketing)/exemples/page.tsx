import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { VzHighlight } from '@/components/ui/vizly'
import { CTASectionTemplates } from '@/components/marketing/CTASection'

export const metadata: Metadata = {
  title: 'Exemples de portfolios',
  description:
    '8 portfolios en ligne construits avec Vizly — un par template. Photographes, développeurs, architectes, étudiants : trouve l’exemple qui te ressemble.',
  alternates: { canonical: '/exemples' },
}

type Showcase = {
  slug: string
  name: string
  metier: string
  template: string
  templateLabel: string
  palette: {
    bg: string
    fg: string
    accent: string
  }
  highlight: string
}

// Palettes choisies pour échoir dans la DA : fonds crème / noir / nude /
// pastel — aucune couleur saturée sauf le safran qui reste la signature
// commune. Chaque card prend la couleur du template en fond discret.
const SHOWCASES: Showcase[] = [
  {
    slug: 'kenza',
    name: 'Kenza Amrani',
    metier: 'Photographe · mode & éditorial',
    template: 'creatif',
    templateLabel: 'Créatif',
    palette: { bg: '#FFFDF5', fg: '#1A1A1A', accent: '#8B6914' },
    highlight: 'Série portrait, campagne mode, expo galerie.',
  },
  {
    slug: 'studio-noir',
    name: 'Studio Noir',
    metier: 'DA · identité visuelle & type design',
    template: 'brutalist',
    templateLabel: 'Brutalist',
    palette: { bg: '#0A0A0A', fg: '#FFFFFF', accent: '#F1B434' },
    highlight: 'Posters, brand identity, zine, type experiment.',
  },
  {
    slug: 'ines-v',
    name: 'Inès Vieira',
    metier: 'Architecte d’intérieur · haut de gamme',
    template: 'elegant',
    templateLabel: 'Élégant',
    palette: { bg: '#FDFBF7', fg: '#1A1A1A', accent: '#8F6B4A' },
    highlight: 'Loft Marais, villa Côte d’Azur, boutique hôtel.',
  },
  {
    slug: 'axl-studio',
    name: 'Axel Moreau',
    metier: 'Product designer · scale-up',
    template: 'bento',
    templateLabel: 'Bento',
    palette: { bg: '#F8F7FF', fg: '#1A1A1A', accent: '#4A3D8F' },
    highlight: 'Design system, onboarding, dashboard, app mobile.',
  },
  {
    slug: 'thomas-l',
    name: 'Thomas Lefèvre',
    metier: 'Backend engineer · Go & Rust',
    template: 'minimal',
    templateLabel: 'Minimal',
    palette: { bg: '#F5F5F5', fg: '#1A1A1A', accent: '#1A1A1A' },
    highlight: '8 ans d’XP, ex-Doctolib, dispo en freelance.',
  },
  {
    slug: 'nora',
    name: 'Nora Belhaj',
    metier: 'Creative developer · WebGL & 3D',
    template: 'dark',
    templateLabel: 'Dark',
    palette: { bg: '#0A0A0A', fg: '#E6E6E6', accent: '#00D4FF' },
    highlight: 'Experiences 3D, audio visualizer, awwwards SOTD.',
  },
  {
    slug: 'jeanne-m',
    name: 'Jeanne Marchand',
    metier: 'Étudiante · marketing digital',
    template: 'classique',
    templateLabel: 'Classique',
    palette: { bg: '#FAFAF8', fg: '#1A1A1A', accent: '#2D5A3D' },
    highlight: 'ESSEC, 3 stages, campagnes Meta Ads & SEO.',
  },
  {
    slug: 'yacine',
    name: 'Yacine Kadi',
    metier: 'Community manager · social media',
    template: 'colore',
    templateLabel: 'Coloré',
    palette: { bg: '#FFF5E6', fg: '#1A1A1A', accent: '#FF6B6B' },
    highlight: 'TikTok 4M vues, Meta Ads, newsletter 12k.',
  },
]

export default function ExemplesPage() {
  return (
    <>
      <main className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 pt-12 pb-8 sm:pt-16 lg:pt-24 lg:pb-12">
        {/* Header */}
        <ScrollReveal className="max-w-3xl">
          <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl leading-[1.08]">
            Des <VzHighlight>portfolios réels</VzHighlight>, un par template.
          </h1>
          <p className="mt-4 text-lg text-muted leading-relaxed">
            Chaque exemple ci-dessous est un portfolio en ligne, bâti avec
            Vizly et live sur un subdomain{' '}
            <span className="font-medium text-foreground">*.vizly.fr</span>.
            Ouvre-les sur ton téléphone pour voir le rendu mobile.
          </p>
        </ScrollReveal>

        {/* Grid */}
        <ScrollReveal className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-2 lg:gap-6">
          {SHOWCASES.map((s) => (
            <a
              key={s.slug}
                href={`https://${s.slug}.vizly.fr`}
                target="_blank"
                rel="noreferrer noopener"
                className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border-light transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                style={{ backgroundColor: s.palette.bg }}
              >
                {/* Browser chrome mockup */}
                <div
                  className="flex items-center gap-2 border-b px-4 py-2.5"
                  style={{
                    borderColor: 'rgba(127,127,127,0.15)',
                  }}
                >
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57] opacity-70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FDBC2E] opacity-70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28C941] opacity-70" />
                  </div>
                  <div
                    className="ml-3 flex-1 truncate rounded-[var(--radius-sm)] px-3 py-1 text-xs font-medium"
                    style={{
                      color: s.palette.fg,
                      backgroundColor: 'rgba(127,127,127,0.08)',
                      opacity: 0.85,
                    }}
                  >
                    {s.slug}.vizly.fr
                  </div>
                </div>

                {/* Card content */}
                <div className="flex flex-1 flex-col justify-between gap-6 p-6 lg:p-8">
                  <div>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
                      style={{
                        color: s.palette.accent,
                        backgroundColor: 'rgba(127,127,127,0.08)',
                      }}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: s.palette.accent }}
                      />
                      Template · {s.templateLabel}
                    </span>

                    <h2
                      className="mt-5 font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-[28px] leading-tight"
                      style={{ color: s.palette.fg }}
                    >
                      {s.name}
                    </h2>
                    <p
                      className="mt-1.5 text-sm font-medium"
                      style={{ color: s.palette.fg, opacity: 0.65 }}
                    >
                      {s.metier}
                    </p>
                    <p
                      className="mt-4 text-sm leading-relaxed"
                      style={{ color: s.palette.fg, opacity: 0.55 }}
                    >
                      {s.highlight}
                    </p>
                  </div>

                  <div
                    className="flex items-center justify-between pt-2"
                    style={{ color: s.palette.fg }}
                  >
                    <span className="text-sm font-semibold">
                      Voir le portfolio
                    </span>
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      style={{
                        backgroundColor: s.palette.accent,
                        color: s.palette.bg,
                      }}
                      aria-hidden
                    >
                      <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                  </div>
                </div>
              </a>
          ))}
        </ScrollReveal>

        {/* Secondary note + link to templates page */}
        <ScrollReveal className="mt-14 rounded-[var(--radius-lg)] border border-border-light bg-surface-warm p-6 sm:p-8 lg:mt-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold tracking-tight">
                Ces 8 personas sont fictifs — les designs sont réels.
              </h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed sm:max-w-xl">
                Chaque portfolio ci-dessus utilise le template brut, sans code
                custom ni dev. Tu peux obtenir le même rendu en remplissant
                le formulaire guidé Vizly, en 5 minutes.
              </p>
            </div>
            <Link
              href="/templates"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-warm"
            >
              Voir tous les templates
            </Link>
          </div>
        </ScrollReveal>
      </main>
      <CTASectionTemplates />
    </>
  )
}
