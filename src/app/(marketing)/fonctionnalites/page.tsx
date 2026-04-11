import type { Metadata } from 'next'
import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import { CTA } from '@/components/marketing/CTA'
import { ScrollReveal, StaggerItem } from '@/components/shared/ScrollReveal'
import { ProfileMockup } from '@/components/marketing/features/ProfileMockup'
import { KpiMockup } from '@/components/marketing/features/KpiMockup'
import { DesignMockup } from '@/components/marketing/features/DesignMockup'
import { PublishMockup } from '@/components/marketing/features/PublishMockup'
import { FeaturesStepperPreview } from '@/components/marketing/features/FeaturesStepperPreview'

export const metadata: Metadata = {
  title: 'Fonctionnalités',
  description:
    'Tout ce qu\'il faut pour publier un portfolio qui te ressemble. Profil, projets, KPIs, design personnalisable et publication en un clic.',
}

const DETAILS = [
  {
    title: 'Auto-save permanent.',
    description:
      'Tu ne perds jamais ton travail. Chaque modification est enregistrée au fur et à mesure.',
  },
  {
    title: 'Preview responsive instantanée.',
    description:
      'Tu vois exactement ce que verra un visiteur sur mobile, tablette ou desktop, sans publier.',
  },
  {
    title: 'Validation à chaque étape.',
    description:
      'Pas de risque de publier un portfolio incomplet ou cassé, on vérifie au passage.',
  },
  {
    title: 'Templates premium à l\u2019unité.',
    description:
      'Tu craques sur un template payant\u00a0? Achète-le seul pour 2,99\u00a0\u20ac, sans abonnement.',
  },
]

export default function FonctionnalitesPage() {
  return (
    <>
      <Header />
      <main>
        {/* ── Section 1 — Hero ── */}
        <section className="pt-16 pb-4 lg:pt-24 lg:pb-8">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <ScrollReveal className="max-w-2xl">
                <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  Tout ce qu&apos;il faut pour publier un portfolio qui{' '}
                  <span className="text-accent">te ressemble</span>.
                </h1>
                <p className="mt-5 text-lg text-muted leading-relaxed max-w-xl">
                  De l&apos;idée à la mise en ligne, sans rien sacrifier sur la personnalisation.
                </p>
              </ScrollReveal>
              <ScrollReveal className="shrink-0" delay={0.15}>
                <FeaturesStepperPreview />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Étape 1 — Profil : texte gauche, mockup droite ── */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <ScrollReveal margin="0% 0px">
                <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
                  1. Tu poses qui <span className="text-accent">tu es</span>.
                </h2>
                <p className="mt-4 text-muted leading-relaxed">
                  Nom, bio, photo, contact, réseaux sociaux, compétences. Tout est structuré
                  pour ne rien oublier. Ta bio est limitée à 500&nbsp;caractères&nbsp;&mdash;
                  assez pour te présenter, assez court pour rester percutant. Tes réseaux
                  sociaux s&apos;affichent en boutons cliquables sur ton portfolio publié, et
                  tes compétences deviennent des tags élégants que les recruteurs peuvent
                  scanner en trois secondes.
                </p>
              </ScrollReveal>
              <ScrollReveal className="max-w-xl mx-auto lg:mx-0" margin="0% 0px" delay={0.15}>
                <ProfileMockup />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Étape 2 — Contenu : mockup gauche, texte droite ── */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <ScrollReveal className="max-w-xl mx-auto lg:mx-0 order-2 lg:order-1" margin="0% 0px" delay={0.15}>
                <KpiMockup />
              </ScrollReveal>
              <ScrollReveal className="order-1 lg:order-2" margin="0% 0px">
                <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
                  2. Tu construis ton <span className="text-accent">contenu</span>.
                </h2>
                <p className="mt-4 text-muted leading-relaxed">
                  Projets avec images et tags, blocs texte personnalisés, et surtout dix types
                  de KPIs visuels&nbsp;: compteurs, anneaux de progression, étoiles, timelines,
                  comparaisons avant/après. Parce qu&apos;un portfolio sans données mesurables,
                  c&apos;est juste un CV. Organise tout ça en grilles d&apos;une à trois colonnes,
                  mélange ce que tu veux où tu veux.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Étape 3 — Design : texte gauche, mockup droite ── */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <ScrollReveal margin="0% 0px">
                <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
                  3. Tu personnalises sans <span className="text-accent">coder</span>.
                </h2>
                <p className="mt-4 text-muted leading-relaxed">
                  Choisis ton template parmi huit styles, ta palette parmi six presets ou en
                  custom, ta typographie parmi toute la bibliothèque Google Fonts. Active ou
                  désactive chaque section, réorganise-les dans l&apos;ordre que tu veux. Et tu
                  vois tout en direct sur la preview, en desktop, tablette ou mobile, sans
                  publier ni rafraîchir.
                </p>
              </ScrollReveal>
              <ScrollReveal className="max-w-xl mx-auto lg:mx-0" margin="0% 0px" delay={0.15}>
                <DesignMockup />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Étape 4 — Publication : mockup gauche, texte droite ── */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <ScrollReveal className="max-w-xl mx-auto lg:mx-0 order-2 lg:order-1" margin="0% 0px" delay={0.15}>
                <PublishMockup />
              </ScrollReveal>
              <ScrollReveal className="order-1 lg:order-2" margin="0% 0px">
                <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
                  4. Tu publies sur ton <span className="text-accent">sous-domaine</span>.
                </h2>
                <p className="mt-4 text-muted leading-relaxed">
                  Choisis ton pseudo, vérifie qu&apos;il est disponible en temps réel, et publie
                  en un clic. Ton portfolio est live sur pseudo.vizly.fr immédiatement,
                  partageable par lien. Tu peux le modifier à tout moment depuis ton dashboard,
                  et republier les changements sans rien casser.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Les détails qui changent tout ── */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <ScrollReveal className="mb-8 lg:mb-10">
              <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
                Les détails qui <span className="text-accent">changent tout</span>.
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12">
              {DETAILS.map((detail, i) => (
                <StaggerItem key={detail.title} index={i}>
                  <h3 className="text-[15px] font-semibold text-foreground mb-1.5">
                    {detail.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">{detail.description}</p>
                </StaggerItem>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 7 — CTA ── */}
        <CTA
          title="Prêt à publier"
          titleAccent="le tien"
          description="Gratuit pour commencer. Tu ne paies que si tu décides de publier."
          primaryLabel="Créer mon portfolio"
          primaryHref="/register"
          secondaryLabel="Voir les tarifs"
          secondaryHref="/#pricing"
        />
      </main>
      <Footer />
    </>
  )
}
