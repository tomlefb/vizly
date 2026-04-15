import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description: "CGU de la plateforme Vizly · création de portfolios en ligne.",
}

export default function CGUPage() {
  return (
    <article className="prose-legal">
      <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight mb-2">
        Conditions Générales d&apos;Utilisation
      </h1>
      <p className="text-sm text-muted mb-10">Dernière mise à jour : 10 avril 2026</p>

      <Section title="1. Objet">
        Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;utilisation de la
        plateforme Vizly, accessible à l&apos;adresse <strong>vizly.fr</strong>, qui permet aux
        utilisateurs de créer et publier des portfolios en ligne.
      </Section>

      <Section title="2. Éditeur">
        Vizly est édité par Tom Lefevre Bonzon, Entrepreneur individuel,
        SIREN 103 332 276, 35700 Rennes, France.
        Contact :{' '}
        <a href="mailto:tom@vizly.fr" className="text-accent hover:underline">tom@vizly.fr</a>.
      </Section>

      <Section title="3. Inscription et compte">
        L&apos;inscription est gratuite et accessible via email/mot de passe ou Google OAuth.
        L&apos;utilisateur s&apos;engage à fournir des informations exactes et à ne pas créer plusieurs
        comptes. Vizly se réserve le droit de suspendre tout compte en cas de violation des présentes CGU.
      </Section>

      <Section title="4. Service gratuit et payant">
        Le plan gratuit permet de créer un portfolio et d&apos;en voir l&apos;aperçu. La mise en ligne
        nécessite un abonnement payant (Starter à 4,99&nbsp;€/mois ou Pro à 9,99&nbsp;€/mois). Les templates
        premium sont vendus à l&apos;unité (2,99&nbsp;€) et restent accessibles à vie. Les paiements sont
        gérés par Stripe. L&apos;abonnement est renouvelable mensuellement et annulable à tout moment.
      </Section>

      <Section title="5. Droit de rétractation">
        Conformément à l&apos;article L221-18 du Code de la consommation, vous disposez d&apos;un délai
        de 14 jours à compter de la souscription pour exercer votre droit de rétractation et obtenir
        un remboursement intégral de votre abonnement. Pour les templates premium (contenus numériques
        fournis immédiatement après achat), vous acceptez expressément lors de l&apos;achat à renoncer
        à votre droit de rétractation conformément à l&apos;article L221-28 du Code de la consommation.
        Pour exercer votre droit de rétractation, contactez-nous à{' '}
        <a href="mailto:tom@vizly.fr" className="text-accent hover:underline">tom@vizly.fr</a>.
      </Section>

      <Section title="6. Propriété intellectuelle">
        L&apos;utilisateur reste entièrement propriétaire du contenu qu&apos;il publie sur son portfolio
        (textes, images, projets). Vizly détient les droits sur la plateforme, les templates, le code
        source et la marque. Les templates ne peuvent pas être redistribués ou revendus.
      </Section>

      <Section title="7. Responsabilité">
        Vizly héberge les portfolios mais ne modère pas le contenu publié par les utilisateurs.
        L&apos;utilisateur est seul responsable du contenu de son portfolio et garantit qu&apos;il ne
        viole aucun droit de tiers. Vizly pourra supprimer tout contenu manifestement illicite sur
        signalement.
      </Section>

      <Section title="8. Résiliation et suppression">
        L&apos;utilisateur peut supprimer son compte et ses données à tout moment depuis les paramètres.
        En cas d&apos;arrêt de l&apos;abonnement, le portfolio est mis hors ligne sous 24 heures.
        Les données sont conservées 30 jours avant suppression définitive.
      </Section>

      <Section title="9. Modifications des CGU">
        Vizly se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés
        par email de toute modification substantielle. L&apos;utilisation continue du service
        après notification vaut acceptation des nouvelles conditions.
      </Section>

      <Section title="10. Droit applicable">
        Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux de Rennes
        seront seuls compétents.
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
