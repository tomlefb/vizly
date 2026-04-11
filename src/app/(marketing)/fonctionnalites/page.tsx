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

        {/* ── Les 4 étapes — placeholder pour commit 2 ── */}

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
