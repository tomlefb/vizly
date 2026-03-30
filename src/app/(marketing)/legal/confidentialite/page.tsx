import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialite',
  description: 'Politique de confidentialite de Vizly — comment nous protegeons vos donnees.',
}

export default function ConfidentialitePage() {
  return (
    <article className="prose-legal">
      <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight mb-2">
        Politique de confidentialite
      </h1>
      <p className="text-sm text-muted mb-10">Derniere mise a jour : 30 mars 2026</p>

      <Section title="1. Donnees collectees">
        Vizly collecte les donnees suivantes lors de l&apos;inscription et de l&apos;utilisation du service :
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Email et mot de passe (ou identifiants Google OAuth)</li>
          <li>Nom et prenom</li>
          <li>Photo de profil</li>
          <li>Contenu du portfolio (bio, projets, images, liens)</li>
          <li>Donnees de paiement (traitees par Stripe, jamais stockees par Vizly)</li>
        </ul>
      </Section>

      <Section title="2. Finalite du traitement">
        Les donnees sont collectees pour :
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Fournir le service de creation et hebergement de portfolios</li>
          <li>Envoyer des emails transactionnels (bienvenue, contact, expiration)</li>
          <li>Gerer les abonnements et paiements</li>
          <li>Ameliorer le service (statistiques anonymisees)</li>
        </ul>
      </Section>

      <Section title="3. Stockage et hebergement">
        Les donnees sont stockees chez <strong>Supabase</strong> (serveurs UE) pour la base de donnees
        et le stockage d&apos;images. L&apos;application est hebergee chez <strong>Vercel</strong>
        (edge global). Les paiements sont traites par <strong>Stripe</strong>. Vizly ne stocke aucune
        information de carte bancaire.
      </Section>

      <Section title="4. Partage des donnees">
        Vizly ne revend ni ne partage les donnees personnelles a des tiers a des fins commerciales.
        Les donnees sont partagees uniquement avec les sous-traitants necessaires au fonctionnement
        du service (Supabase, Vercel, Stripe, Resend).
      </Section>

      <Section title="5. Cookies">
        Vizly utilise uniquement des cookies fonctionnels necessaires au fonctionnement du service
        (session d&apos;authentification). Aucun cookie de tracking, publicitaire ou analytique
        tiers n&apos;est utilise.
      </Section>

      <Section title="6. Droits RGPD">
        Conformement au RGPD, vous disposez des droits suivants :
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li><strong>Acces</strong> : obtenir une copie de vos donnees personnelles</li>
          <li><strong>Rectification</strong> : corriger vos donnees inexactes</li>
          <li><strong>Suppression</strong> : demander la suppression de vos donnees</li>
          <li><strong>Portabilite</strong> : recevoir vos donnees dans un format standard</li>
          <li><strong>Opposition</strong> : vous opposer au traitement de vos donnees</li>
        </ul>
        <p className="mt-2">
          Pour exercer ces droits, contactez-nous a{' '}
          <a href="mailto:tom@vizly.fr" className="text-accent hover:underline">tom@vizly.fr</a>.
          Nous repondrons sous 30 jours.
        </p>
      </Section>

      <Section title="7. Contact">
        Pour toute question relative a la protection de vos donnees :{' '}
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
