'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { ProfileMockup } from './ProfileMockup'
import { KpiMockup } from './KpiMockup'
import { DesignMockup } from './DesignMockup'
import { PublishMockup } from './PublishMockup'

const STEPS = [
  {
    number: '1',
    title: 'Tu poses qui tu es.',
    text: 'Nom, bio, photo, contact, r\u00e9seaux sociaux, comp\u00e9tences. Tout est structur\u00e9 pour ne rien oublier. Ta bio est limit\u00e9e \u00e0 500\u00a0caract\u00e8res\u00a0\u2014 assez pour te pr\u00e9senter, assez court pour rester percutant. Tes r\u00e9seaux sociaux s\u2019affichent en boutons cliquables sur ton portfolio publi\u00e9, et tes comp\u00e9tences deviennent des tags \u00e9l\u00e9gants que les recruteurs peuvent scanner en trois secondes.',
    Mockup: ProfileMockup,
  },
  {
    number: '2',
    title: 'Tu construis ton contenu.',
    text: 'Projets avec images et tags, blocs texte personnalis\u00e9s, et surtout dix types de KPIs visuels\u00a0: compteurs, anneaux de progression, \u00e9toiles, timelines, comparaisons avant/apr\u00e8s. Parce qu\u2019un portfolio sans donn\u00e9es mesurables, c\u2019est juste un CV. Organise tout \u00e7a en grilles d\u2019une \u00e0 trois colonnes, m\u00e9lange ce que tu veux o\u00f9 tu veux.',
    Mockup: KpiMockup,
  },
  {
    number: '3',
    title: 'Tu personnalises sans coder.',
    text: 'Choisis ton template parmi huit styles, ta palette parmi six presets ou en custom, ta typographie parmi toute la biblioth\u00e8que Google Fonts. Active ou d\u00e9sactive chaque section, r\u00e9organise-les dans l\u2019ordre que tu veux. Et tu vois tout en direct sur la preview, en desktop, tablette ou mobile, sans publier ni rafra\u00eechir.',
    Mockup: DesignMockup,
  },
  {
    number: '4',
    title: 'Tu publies sur ton sous-domaine.',
    text: 'Choisis ton pseudo, v\u00e9rifie qu\u2019il est disponible en temps r\u00e9el, et publie en un clic. Ton portfolio est live sur pseudo.vizly.fr imm\u00e9diatement, partageable par lien. Tu peux le modifier \u00e0 tout moment depuis ton dashboard, et republier les changements sans rien casser.',
    Mockup: PublishMockup,
  },
]

/* ───────────────────────────────────────────────────────────────────
   StepText — un bloc de texte dans la colonne droite.
   useInView détecte quand le bloc entre dans le centre du viewport
   (bande de 20 % au milieu) et remonte l'index à ScrollStorytelling.
   ─────────────────────────────────────────────────────────────────── */

function StepText({
  step,
  index,
  onActivate,
}: {
  step: (typeof STEPS)[number]
  index: number
  onActivate: (index: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { margin: '-40% 0px -40% 0px' })

  useEffect(() => {
    if (isInView) onActivate(index)
  }, [isInView, index, onActivate])

  return (
    <div ref={ref} className="min-h-[70vh] flex items-center py-16">
      <div className="max-w-md">
        <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
          {step.number}. {step.title}
        </h2>
        <p className="mt-4 text-muted leading-relaxed">{step.text}</p>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────
   ScrollStorytelling
   Desktop ≥ lg  : mockup sticky à gauche, texte défilant à droite,
                   crossfade opacity 500 ms entre mockups, stepper dots.
   Mobile < lg   : stacked vertical classique avec ScrollReveal.
   Reduced motion: CSS override → stacked (via data-storytelling).
   ─────────────────────────────────────────────────────────────────── */

export function ScrollStorytelling() {
  const [activeStep, setActiveStep] = useState(0)
  const handleActivate = useCallback((index: number) => setActiveStep(index), [])

  return (
    <>
      {/* ── Desktop : sticky left + scroll right ── */}
      <div className="hidden lg:block" data-storytelling="desktop">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex gap-16">
            {/* Colonne gauche : mockup sticky + stepper */}
            <div className="w-[55%] shrink-0 sticky top-0 h-screen flex items-center">
              <div className="flex-1 relative">
                {STEPS.map(({ number, Mockup }, i) => (
                  <div
                    key={number}
                    className={i === 0 ? 'relative' : 'absolute inset-0'}
                    style={{
                      opacity: activeStep === i ? 1 : 0,
                      transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    aria-hidden={activeStep !== i}
                  >
                    <Mockup />
                  </div>
                ))}
              </div>

              {/* Stepper dots */}
              <div className="ml-8 flex flex-col items-center gap-3">
                {STEPS.map((_, i) => (
                  <Fragment key={i}>
                    <div
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                        activeStep === i ? 'bg-accent' : 'bg-border'
                      }`}
                    />
                    {i < 3 && <div className="w-px h-5 bg-border" />}
                  </Fragment>
                ))}
              </div>
            </div>

            {/* Colonne droite : texte défilant */}
            <div className="flex-1">
              {STEPS.map((step, i) => (
                <StepText
                  key={step.number}
                  step={step}
                  index={i}
                  onActivate={handleActivate}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile / reduced-motion : stacked vertical ── */}
      <div className="lg:hidden" data-storytelling="mobile">
        {STEPS.map(({ number, title, text, Mockup }) => (
          <section key={number} className="py-16 lg:py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <ScrollReveal className="max-w-2xl">
                <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
                  {number}. {title}
                </h2>
                <p className="mt-4 text-muted leading-relaxed">{text}</p>
              </ScrollReveal>
              <ScrollReveal className="mt-10 mx-auto max-w-3xl">
                <Mockup />
              </ScrollReveal>
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
