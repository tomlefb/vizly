'use client'

import { useState, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const FAQ_ITEMS = [
  {
    q: "C'est quoi Vizly ?",
    a: "Vizly est un builder de portfolios en ligne. Tu remplis un formulaire guide, tu choisis un template, et ton site portfolio est live sur pseudo.vizly.fr en quelques minutes. Aucune competence technique requise.",
  },
  {
    q: 'Combien ca coute ?',
    a: "Creer et previsualiser ton portfolio est 100% gratuit. La mise en ligne demarre a 4,99 EUR/mois (plan Starter). Le plan Pro a 9,99 EUR/mois ajoute un domaine custom, un formulaire de contact et des analytics. Les templates premium sont a 2,99 EUR l'unite (achat unique).",
  },
  {
    q: 'Je peux utiliser mon propre nom de domaine ?',
    a: "Oui, avec le plan Pro (9,99 EUR/mois). Tu achetes ton domaine chez le registrar de ton choix et tu pointes ton DNS vers Vizly. On t'accompagne avec un guide pas a pas.",
  },
  {
    q: 'Que se passe-t-il si j\'arrete de payer ?',
    a: "Ton portfolio est mis hors ligne sous 24 heures. Tu recois un email d'avertissement. Toutes tes donnees sont conservees 30 jours. Si tu reactives ton abonnement pendant cette periode, tout revient en ligne instantanement.",
  },
  {
    q: 'Mes donnees sont-elles securisees ?',
    a: "Oui. Tes donnees sont stockees chez Supabase (serveurs UE). Les paiements sont traites par Stripe (aucune CB stockee chez nous). Nous utilisons uniquement des cookies fonctionnels. Tu peux supprimer ton compte et tes donnees a tout moment.",
  },
  {
    q: 'Combien de projets je peux mettre ?',
    a: "Autant que tu veux. Il n'y a aucune limite sur le nombre de projets, quel que soit ton plan.",
  },
  {
    q: 'Je peux changer de template apres publication ?',
    a: "Oui, tu peux changer de template a tout moment depuis l'editeur. Tes donnees sont conservees, seule la presentation change.",
  },
  {
    q: 'Les templates premium sont-ils un abonnement ?',
    a: "Non, c'est un achat unique a 2,99 EUR. Tu achetes un template une fois et tu le gardes pour toujours.",
  },
  {
    q: 'Comment supprimer mon compte ?',
    a: 'Va dans Parametres > Supprimer mon compte. Toutes tes donnees seront supprimees definitivement.',
  },
  {
    q: 'Comment contacter le support ?',
    a: "Envoie un email a tom@vizly.fr. On repond generalement sous 24 heures.",
  },
  {
    q: 'Vizly est-il adapte aux mobiles ?',
    a: "Oui, tous les templates sont responsive mobile-first. Ton portfolio s'affiche parfaitement sur telephone, tablette et desktop.",
  },
  {
    q: 'Je peux exporter mon portfolio ?',
    a: "Pour le moment, les portfolios sont heberges exclusivement sur Vizly. L'export est prevu dans une future mise a jour.",
  },
] as const

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = useCallback((i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i))
  }, [])

  return (
    <div className="divide-y divide-border" role="list">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} role="listitem">
          <button
            type="button"
            onClick={() => toggle(i)}
            className="flex w-full items-center justify-between py-5 text-left transition-colors duration-150 hover:text-accent"
            aria-expanded={openIndex === i}
            aria-controls={`faq-answer-${i}`}
          >
            <span className="text-sm font-semibold text-foreground pr-4">
              {item.q}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                openIndex === i && 'rotate-180'
              )}
            />
          </button>
          <div
            id={`faq-answer-${i}`}
            className={cn(
              'overflow-hidden transition-all duration-200',
              openIndex === i ? 'max-h-96 pb-5' : 'max-h-0'
            )}
            role="region"
            aria-hidden={openIndex !== i}
          >
            <p className="text-sm text-muted leading-relaxed">{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
