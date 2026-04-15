import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité de Vizly · comment nous protégeons vos données.',
}

export default function ConfidentialitePage() {
  return (
    <article className="prose-legal">
      <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight mb-2">
        Politique de confidentialité
      </h1>
      <p className="text-sm text-muted mb-10">Dernière mise à jour : 10 avril 2026</p>

      <Section title="1. Responsable du traitement">
        Tom Lefevre Bonzon, Entrepreneur individuel
        <br />
        SIREN : 103 332 276 — 35700 Rennes, France
        <br />
        Contact :{' '}
        <a href="mailto:tom@vizly.fr" className="text-accent hover:underline">tom@vizly.fr</a>
      </Section>

      <Section title="2. Données collectées">
        Vizly collecte les données suivantes lors de l&apos;inscription et de l&apos;utilisation du service :
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Email et mot de passe (ou identifiants Google OAuth)</li>
          <li>Nom et prénom</li>
          <li>Photo de profil</li>
          <li>Contenu du portfolio (bio, projets, images, liens)</li>
          <li>Données de paiement (traitées par Stripe, jamais stockées par Vizly)</li>
        </ul>
      </Section>

      <Section title="3. Finalité du traitement">
        Les données sont collectées pour :
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Fournir le service de création et hébergement de portfolios</li>
          <li>Envoyer des emails transactionnels (bienvenue, contact, expiration)</li>
          <li>Gérer les abonnements et paiements</li>
          <li>Améliorer le service (statistiques anonymisées)</li>
        </ul>
      </Section>

      <Section title="4. Stockage et hébergement">
        Les données sont stockées chez <strong>Supabase</strong> (serveurs UE) pour la base de données
        et le stockage d&apos;images. L&apos;application est hébergée chez <strong>Railway</strong>.
        Les paiements sont traités par <strong>Stripe</strong>. Vizly ne stocke aucune
        information de carte bancaire.
      </Section>

      <Section title="5. Partage des données">
        Vizly ne revend ni ne partage les données personnelles à des tiers à des fins commerciales.
        Les données sont partagées uniquement avec les sous-traitants nécessaires au fonctionnement
        du service (Supabase, Railway, Stripe, Resend).
      </Section>

      <Section title="6. Cookies">
        Vizly utilise uniquement des cookies fonctionnels nécessaires au fonctionnement du service
        (session d&apos;authentification). Aucun cookie de tracking, publicitaire ou analytique
        tiers n&apos;est utilisé.
      </Section>

      <Section title="7. Droits RGPD">
        Conformément au RGPD, vous disposez des droits suivants :
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li><strong>Accès</strong> : obtenir une copie de vos données personnelles</li>
          <li><strong>Rectification</strong> : corriger vos données inexactes</li>
          <li><strong>Suppression</strong> : demander la suppression de vos données</li>
          <li><strong>Portabilité</strong> : recevoir vos données dans un format standard</li>
          <li><strong>Opposition</strong> : vous opposer au traitement de vos données</li>
        </ul>
        <p className="mt-2">
          Pour exercer ces droits, contactez-nous à{' '}
          <a href="mailto:tom@vizly.fr" className="text-accent hover:underline">tom@vizly.fr</a>.
          Nous répondrons sous 30 jours.
        </p>
      </Section>

      <Section title="8. Contact">
        Pour toute question relative à la protection de vos données :{' '}
        <a href="mailto:tom@vizly.fr" className="text-accent hover:underline">tom@vizly.fr</a>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold mb-3">{title}</h2>
      <div className="text-sm text-muted leading-relaxed">{children}</div>
    </section>
  )
}
