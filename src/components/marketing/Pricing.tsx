import Link from 'next/link'
import { Check, X, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlanFeature {
  label: string
  free: boolean | string
  starter: boolean | string
  pro: boolean | string
}

const planFeatures: PlanFeature[] = [
  {
    label: 'Projets illimites',
    free: true,
    starter: true,
    pro: true,
  },
  {
    label: '4 templates gratuits',
    free: true,
    starter: true,
    pro: true,
  },
  {
    label: 'Preview complete',
    free: true,
    starter: true,
    pro: true,
  },
  {
    label: 'Mise en ligne (pseudo.vizly.fr)',
    free: false,
    starter: '1 projet',
    pro: 'Illimite',
  },
  {
    label: 'Badge "Fait avec Vizly"',
    free: false,
    starter: true,
    pro: true,
  },
  {
    label: 'Domaine personnalise',
    free: false,
    starter: false,
    pro: true,
  },
  {
    label: 'Formulaire de contact',
    free: false,
    starter: false,
    pro: true,
  },
  {
    label: 'Analytics (nombre de vues)',
    free: false,
    starter: false,
    pro: true,
  },
]

const plans = [
  {
    name: 'Gratuit',
    price: '0',
    period: '',
    description: 'Pour decouvrir et creer ton portfolio.',
    cta: 'Commencer',
    href: '/register',
    popular: false,
    key: 'free' as const,
  },
  {
    name: 'Starter',
    price: '4,99',
    period: '/mois',
    description: 'Pour mettre ton portfolio en ligne.',
    cta: 'Choisir Starter',
    href: '/register?plan=starter',
    popular: true,
    key: 'starter' as const,
  },
  {
    name: 'Pro',
    price: '9,99',
    period: '/mois',
    description: 'Pour les pros qui veulent aller plus loin.',
    cta: 'Choisir Pro',
    href: '/register?plan=pro',
    popular: false,
    key: 'pro' as const,
  },
] as const

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-success/10">
        <Check className="h-3 w-3 text-success" strokeWidth={2.5} />
      </span>
    )
  }

  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5">
        <X className="h-3.5 w-3.5 text-muted-foreground/40" strokeWidth={2} />
      </span>
    )
  }

  return (
    <span className="text-xs font-medium text-foreground">{value}</span>
  )
}

export function Pricing() {
  return (
    <section id="pricing" className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 lg:mb-14">
          <h2 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Simple et transparent
          </h2>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            Commence gratuitement. Passe a un plan payant uniquement quand tu
            veux publier ton portfolio.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative rounded-[var(--radius-xl)] border p-7 lg:p-8 flex flex-col transition-shadow duration-300',
                plan.popular
                  ? 'border-accent bg-surface shadow-[0_4px_24px_rgba(212,99,78,0.08)] md:-translate-y-2'
                  : 'border-border-light bg-surface hover:border-border hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
              )}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white tracking-wide">
                    <Star className="h-3 w-3 fill-current" />
                    Populaire
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <h3 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-[family-name:var(--font-satoshi)] text-4xl font-extrabold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-lg font-medium text-foreground">&euro;</span>
                  {plan.period && (
                    <span className="text-sm text-muted ml-0.5">
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1" role="list">
                {planFeatures.map((feature) => (
                  <li
                    key={feature.label}
                    className="flex items-center gap-3 text-sm"
                  >
                    <FeatureValue value={feature[plan.key]} />
                    <span
                      className={cn(
                        feature[plan.key] === false
                          ? 'text-muted-foreground/50'
                          : 'text-foreground'
                      )}
                    >
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                className={cn(
                  'block text-center rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold transition-colors duration-200',
                  plan.popular
                    ? 'bg-accent text-white hover:bg-accent-hover'
                    : 'border border-border text-foreground hover:bg-surface-warm'
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Subtle note */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Tous les prix sont en euros, TTC. Annulation possible a tout moment.
        </p>
      </div>
    </section>
  )
}
