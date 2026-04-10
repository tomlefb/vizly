'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type BillingInterval = 'monthly' | 'yearly'

interface PlanFeature {
  label: string
  included: boolean
}

interface Plan {
  name: string
  description: string
  monthlyPrice: string
  yearlyMonthlyPrice: string
  yearlyTotalPrice: string
  features: PlanFeature[]
  cta: string
  href: string
  featured: boolean
}

const plans: Plan[] = [
  {
    name: 'Gratuit',
    description: 'Pour découvrir et créer ton portfolio.',
    monthlyPrice: '0',
    yearlyMonthlyPrice: '0',
    yearlyTotalPrice: '0',
    features: [
      { label: 'Projets illimités', included: true },
      { label: '4 templates gratuits', included: true },
      { label: 'Prévisualisation complète', included: true },
      { label: 'Mise en ligne', included: false },
      { label: 'Domaine personnalisé', included: false },
      { label: 'Analytics', included: false },
    ],
    cta: 'Commencer',
    href: '/register',
    featured: false,
  },
  {
    name: 'Starter',
    description: 'Pour mettre ton portfolio en ligne.',
    monthlyPrice: '4,99',
    yearlyMonthlyPrice: '4,24',
    yearlyTotalPrice: '50,88',
    features: [
      { label: 'Tout du gratuit', included: true },
      { label: '1 portfolio en ligne', included: true },
      { label: 'Badge "Fait avec Vizly"', included: true },
      { label: 'Domaine personnalisé', included: false },
      { label: 'Analytics', included: false },
      { label: 'Formulaire de contact', included: false },
    ],
    cta: 'Choisir Starter',
    href: '/register?plan=starter',
    featured: true,
  },
  {
    name: 'Pro',
    description: 'Pour les pros qui veulent aller plus loin.',
    monthlyPrice: '9,99',
    yearlyMonthlyPrice: '8,49',
    yearlyTotalPrice: '101,88',
    features: [
      { label: 'Tout du Starter', included: true },
      { label: 'Portfolios illimités', included: true },
      { label: 'Domaine personnalisé', included: true },
      { label: 'Analytics & stats', included: true },
      { label: 'Formulaire de contact', included: true },
      { label: 'Support prioritaire', included: true },
    ],
    cta: 'Choisir Pro',
    href: '/register?plan=pro',
    featured: false,
  },
]

export function Pricing() {
  const [interval, setInterval] = useState<BillingInterval>('monthly')

  return (
    <section id="pricing" className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 lg:mb-14">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
            <h2 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl shrink-0">
              Simple, <span className="text-accent">transparent.</span>
            </h2>
            <p className="text-sm text-muted sm:text-base sm:pb-1 leading-snug">
              Commence gratuitement. Tu ne paies que quand tu veux publier ton portfolio.
            </p>
          </div>

          {/* Billing interval toggle */}
          <div className="mt-8 flex items-center gap-3">
            <div className="inline-flex items-center rounded-full bg-[#f4f4f4] p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setInterval('monthly')}
                className={cn(
                  'rounded-full px-4 py-2 transition-colors duration-150',
                  interval === 'monthly'
                    ? 'bg-white border border-border text-foreground'
                    : 'text-muted hover:text-foreground'
                )}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setInterval('yearly')}
                className={cn(
                  'rounded-full px-4 py-2 transition-colors duration-150',
                  interval === 'yearly'
                    ? 'bg-white border border-border text-foreground'
                    : 'text-muted hover:text-foreground'
                )}
              >
                Annuel
              </button>
            </div>
            {interval === 'yearly' && (
              <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                −15% sur l&apos;annuel
              </span>
            )}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {plans.map((plan) => {
            const isFree = plan.monthlyPrice === '0'
            const price =
              interval === 'yearly' ? plan.yearlyMonthlyPrice : plan.monthlyPrice

            return (
              <div
                key={plan.name}
                className={cn(
                  'relative rounded-[var(--radius-lg)] flex flex-col p-7 lg:p-8',
                  plan.featured
                    ? 'border-[1.5px] border-accent md:-translate-y-2'
                    : 'border-[0.5px] border-border'
                )}
              >
                {/* Popular badge */}
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      Populaire
                    </span>
                  </div>
                )}

                {/* Plan name + description */}
                <h3 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-muted">{plan.description}</p>

                {/* Price */}
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-[family-name:var(--font-satoshi)] text-4xl font-bold tracking-tight">
                    {price}
                  </span>
                  <span className="text-lg font-medium text-foreground">€</span>
                  {!isFree && (
                    <span className="text-sm text-muted ml-0.5">/mois</span>
                  )}
                </div>

                {/* Yearly sub-price line */}
                <div className="h-5 mt-1">
                  {interval === 'yearly' && !isFree && (
                    <p className="text-xs font-medium text-accent">
                      soit {plan.yearlyTotalPrice}€/an
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="my-6 border-t border-border" />

                {/* Features */}
                <ul className="space-y-3 flex-1" role="list">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.label}
                      className="flex items-center gap-3 text-sm"
                    >
                      {feature.included ? (
                        <Check
                          className="h-4 w-4 shrink-0 text-success"
                          strokeWidth={2.5}
                        />
                      ) : (
                        <X
                          className="h-4 w-4 shrink-0 text-muted-foreground/40"
                          strokeWidth={2}
                        />
                      )}
                      <span
                        className={
                          feature.included
                            ? 'text-foreground'
                            : 'text-muted-foreground/50'
                        }
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
                    'mt-8 block text-center rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold transition-colors duration-150',
                    plan.featured
                      ? 'bg-accent text-white hover:bg-accent-hover'
                      : 'border border-border text-foreground hover:bg-surface-warm'
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            )
          })}
        </div>

        {/* Note */}
        <p className="text-xs text-muted-foreground mt-8">
          Tous les prix sont en euros, TTC · Annulation possible à tout moment
        </p>
      </div>
    </section>
  )
}
