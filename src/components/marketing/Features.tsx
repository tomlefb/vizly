import {
  ClipboardList,
  Palette,
  Zap,
  Smartphone,
  Paintbrush,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: ClipboardList,
    title: 'Formulaire guide',
    description:
      'Remplis tes infos etape par etape, on s\'occupe de la mise en page. Zero prise de tete.',
    accent: 'bg-accent/8 text-accent',
    span: 'md:col-span-2',
  },
  {
    icon: Palette,
    title: 'Templates pro',
    description:
      '8 templates uniques, du minimal au brutalist. Chacun avec sa propre personnalite.',
    accent: 'bg-[#2D5A3D]/8 text-[#2D5A3D]',
    span: 'md:col-span-1',
  },
  {
    icon: Zap,
    title: 'Live en 5 min',
    description:
      'Ton site sur pseudo.vizly.fr, instantanement. Pas d\'attente, pas de deploiement complique.',
    accent: 'bg-[#8B6914]/8 text-[#8B6914]',
    span: 'md:col-span-1',
  },
  {
    icon: Smartphone,
    title: 'Mobile-first',
    description:
      'Un rendu parfait sur telephone, tablette et desktop. Tes visiteurs verront toujours le meilleur.',
    accent: 'bg-[#4A3D8F]/8 text-[#4A3D8F]',
    span: 'md:col-span-1',
  },
  {
    icon: Paintbrush,
    title: 'Personnalisable',
    description:
      'Couleurs, typographies, organisation. Mets ta touche personnelle en quelques clics.',
    accent: 'bg-[#8F3D6B]/8 text-[#8F3D6B]',
    span: 'md:col-span-1',
  },
  {
    icon: Layers,
    title: 'Projets illimites',
    description:
      'Montre tout ton travail, sans aucune limite. Portfolio complet, tout le temps.',
    accent: 'bg-[#3D6B8F]/8 text-[#3D6B8F]',
    span: 'md:col-span-2',
  },
] as const

export function Features() {
  return (
    <section id="features" className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header -- left-aligned for asymmetry */}
        <div className="max-w-2xl mb-10 lg:mb-14">
          <h2 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Tout ce qu&apos;il faut{' '}
            <span className="text-muted">pour briller en ligne</span>
          </h2>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            Un outil simple qui fait une chose et la fait bien : mettre ton
            travail en valeur.
          </p>
        </div>

        {/* Feature grid -- varied sizes using col-span */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-5">
          {features.map(({ icon: Icon, title, description, accent, span }) => (
            <article
              key={title}
              className={cn(
                'group relative rounded-[var(--radius-lg)] border border-border-light bg-surface p-7 lg:p-8 transition-all duration-300 hover:border-border hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]',
                span
              )}
            >
              <div
                className={cn(
                  'inline-flex items-center justify-center w-11 h-11 rounded-[var(--radius-md)] mb-5 transition-transform duration-300 group-hover:scale-105',
                  accent
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </div>

              <h3 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold mb-2">
                {title}
              </h3>

              <p className="text-sm text-muted leading-relaxed">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
