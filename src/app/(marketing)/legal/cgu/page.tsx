import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions Generales d'Utilisation",
  description: "CGU de la plateforme Vizly · creation de portfolios en ligne.",
}

export default function CGUPage() {
  return (
    <article className="prose-legal">
      <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight mb-2">
        Conditions Generales d&apos;Utilisation
      </h1>
      <p className="text-sm text-muted mb-10">Derniere mise a jour : 10 avril 2026</p>

      <Section title="1. Objet">
        Les presentes Conditions Generales d&apos;Utilisation (CGU) regissent l&apos;utilisation de la
        plateforme Vizly, accessible a l&apos;adresse <strong>vizly.fr</strong>, qui permet aux
        utilisateurs de creer et publier des portfolios en ligne.
      </Section>

      <Section title="2. Editeur">
        Vizly est edite par Tom Lefevre Bonzon, Entrepreneur individuel,
        SIREN 103 332 276, 35700 Rennes, France.
        Contact :{' '}
        <a href="mailto:tom@vizly.fr" className="text-accent hover:underline">tom@vizly.fr</a>.
      </Section>

      <Section title="3. Inscription et compte">
        L&apos;inscription est gratuite et accessible via email/mot de passe ou Google OAuth.
        L&apos;utilisateur s&apos;engage a fournir des informations exactes et a ne pas creer plusieurs
        comptes. Vizly se reserve le droit de suspendre tout compte en cas de violation des presentes CGU.
      </Section>

      <Section title="4. Service gratuit et payant">
        Le plan gratuit permet de creer un portfolio et d&apos;en voir l&apos;apercu. La mise en ligne
        necessite un abonnement payant (Starter a 4,99 EUR/mois ou Pro a 9,99 EUR/mois). Les templates
        premium sont vendus a l&apos;unite (2,99 EUR) et restent accessibles a vie. Les paiements sont
        geres par Stripe. L&apos;abonnement est renouvelable mensuellement et annulable a tout moment.
      </Section>

      <Section title="5. Droit de retractation">
        Conformement a l&apos;article L221-18 du Code de la consommation, vous disposez d&apos;un delai
        de 14 jours a compter de la souscription pour exercer votre droit de retractation et obtenir
        un remboursement integral de votre abonnement. Pour les templates premium (contenus numeriques
        fournis immediatement apres achat), vous acceptez expressement lors de l&apos;achat a renoncer
        a votre droit de retractation conformement a l&apos;article L221-28 du Code de la consommation.
        Pour exercer votre droit de retractation, contactez-nous a{' '}
        <a href="mailto:tom@vizly.fr" className="text-accent hover:underline">tom@vizly.fr</a>.
      </Section>

      <Section title="6. Propriete intellectuelle">
        L&apos;utilisateur reste entierement proprietaire du contenu qu&apos;il publie sur son portfolio
        (textes, images, projets). Vizly detient les droits sur la plateforme, les templates, le code
        source et la marque. Les templates ne peuvent pas etre redistribues ou revendus.
      </Section>

      <Section title="7. Responsabilite">
        Vizly heberge les portfolios mais ne modere pas le contenu publie par les utilisateurs.
        L&apos;utilisateur est seul responsable du contenu de son portfolio et garantit qu&apos;il ne
        viole aucun droit de tiers. Vizly pourra supprimer tout contenu manifestement illicite sur
        signalement.
      </Section>

      <Section title="8. Resiliation et suppression">
        L&apos;utilisateur peut supprimer son compte et ses donnees a tout moment depuis les parametres.
        En cas d&apos;arret de l&apos;abonnement, le portfolio est mis hors ligne sous 24 heures.
        Les donnees sont conservees 30 jours avant suppression definitive.
      </Section>

      <Section title="9. Modifications des CGU">
        Vizly se reserve le droit de modifier les presentes CGU. Les utilisateurs seront informes
        par email de toute modification substantielle. L&apos;utilisation continue du service
        apres notification vaut acceptation des nouvelles conditions.
      </Section>

      <Section title="10. Droit applicable">
        Les presentes CGU sont soumises au droit francais. En cas de litige, les tribunaux de Rennes
        seront seuls competents.
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold mb-3">{title}</h2>
      <p className="text-sm text-muted leading-relaxed">{children}</p>
    </section>
  )
}
