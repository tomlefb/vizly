import type { Metadata } from 'next'
import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import { CTA } from '@/components/marketing/CTA'
import { ScrollReveal, StaggerItem } from '@/components/shared/ScrollReveal'
import { ProfileMockup } from '@/components/marketing/features/ProfileMockup'
import { KpiMockup } from '@/components/marketing/features/KpiMockup'
import { DesignMockup } from '@/components/marketing/features/DesignMockup'
import { PublishMockup } from '@/components/marketing/features/PublishMockup'

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
        <section className="pt-20 pb-16 lg:pt-32 lg:pb-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <ScrollReveal className="max-w-2xl">
              <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Tout ce qu&apos;il faut pour publier un portfolio qui{' '}
                <span className="text-accent">te ressemble</span>.
              </h1>
              <p className="mt-5 text-lg text-muted leading-relaxed max-w-xl">
                De l&apos;idée à la mise en ligne, sans rien sacrifier sur la personnalisation.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ── Section 2 — Étape 1 : Profil ── */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <ScrollReveal>
                <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
                  1. Tu poses qui tu es.
                </h2>
                <p className="mt-4 text-muted leading-relaxed">
                  Nom, bio, photo, contact, réseaux sociaux, compétences. Tout est structuré
                  pour ne rien oublier. Ta bio est limitée à 500 caractères — assez pour te
                  présenter, assez court pour rester percutant.
                </p>
              </ScrollReveal>
              <ScrollReveal>
                <ProfileMockup />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Section 3 — Étape 2 : Contenu ── */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <ScrollReveal className="mb-10 lg:mb-14">
              <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
                2. Tu construis ton contenu, comme tu veux.
              </h2>
            </ScrollReveal>

            {/* Sous-sections A & B */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12 lg:mb-16">
              <ScrollReveal>
                <h3 className="text-[15px] font-semibold text-foreground mb-1.5">Projets</h3>
                <p className="text-sm text-muted leading-relaxed">
                  Ajoute tes projets avec titre, description, jusqu&apos;à cinq images, lien
                  externe et tags. Réorganise-les dans l&apos;ordre que tu veux.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.08}>
                <h3 className="text-[15px] font-semibold text-foreground mb-1.5">
                  Blocs personnalisés
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Tu veux ajouter une section qui n&apos;existe nulle part ailleurs&nbsp;?
                  Crée tes propres blocs texte avec titre, sous-titre et contenu enrichi.
                </p>
              </ScrollReveal>
            </div>

            {/* Sous-section C — KPIs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-12 lg:mb-16">
              <ScrollReveal>
                <h3 className="text-[15px] font-semibold text-foreground mb-1.5">
                  KPIs — ton différenciateur
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Dix façons de mettre tes chiffres en valeur&nbsp;: compteurs, anneaux de
                  progression, barres, donuts, timelines, étoiles, comparaisons avant/après.
                  Parce qu&apos;un portfolio sans données mesurables, c&apos;est juste un CV.
                </p>
              </ScrollReveal>
              <ScrollReveal>
                <KpiMockup />
              </ScrollReveal>
            </div>

            {/* Sous-section D */}
            <ScrollReveal>
              <h3 className="text-[15px] font-semibold text-foreground mb-1.5">Blocs layout</h3>
              <p className="text-sm text-muted leading-relaxed max-w-lg">
                Organise ta page en grilles d&apos;une à trois colonnes. Mélange texte,
                images et KPIs comme tu veux.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ── Section 4 — Étape 3 : Design ── */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <ScrollReveal className="lg:order-2">
                <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
                  3. Tu personnalises sans coder.
                </h2>
                <p className="mt-4 text-muted leading-relaxed">
                  Choisis ton template parmi huit styles, ta palette parmi six presets ou en
                  custom, ta typographie parmi toute la bibliothèque Google Fonts. Active ou
                  désactive chaque section, réorganise-les. Et tu vois tout en direct sur la
                  preview, en desktop, tablette ou mobile.
                </p>
              </ScrollReveal>
              <ScrollReveal className="lg:order-1">
                <DesignMockup />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Section 5 — Étape 4 : Publication ── */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <ScrollReveal>
                <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
                  4. Tu publies sur ton sous-domaine.
                </h2>
                <p className="mt-4 text-muted leading-relaxed">
                  Choisis ton pseudo, vérifie qu&apos;il est disponible en temps réel, et
                  publie. Ton portfolio est live sur pseudo.vizly.fr en un clic. Tu peux le
                  modifier à tout moment depuis ton dashboard.
                </p>
              </ScrollReveal>
              <ScrollReveal>
                <PublishMockup />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Section 6 — Les détails qui changent tout ── */}
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
