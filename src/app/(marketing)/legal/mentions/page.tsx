import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales du site vizly.fr.',
}

export default function MentionsLegalesPage() {
  return (
    <article className="prose-legal">
      <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight mb-2">
        Mentions légales
      </h1>
      <p className="text-sm text-muted mb-10">Dernière mise à jour : 10 avril 2026</p>

      <Section title="Éditeur du site">
        <strong>Vizly</strong> — vizly.fr
        <br />
        Tom Lefevre Bonzon, Entrepreneur individuel
        <br />
        SIREN : 103 332 276 — SIRET : 103 332 276 00015
        <br />
        Code APE : 6201Z (Programmation informatique)
        <br />
        35700 Rennes, France
        <br />
        Email :{' '}
        <a href="mailto:tom@vizly.fr" className="text-accent hover:underline">tom@vizly.fr</a>
      </Section>

      <Section title="Hébergeur">
        <strong>Railway Corporation</strong>
        <br />
        2261 Market Street #4382, San Francisco, CA 94114, USA
        <br />
        Site :{' '}
        <a href="https://railway.com" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
          railway.com
        </a>
      </Section>

      <Section title="Base de données">
        <strong>Supabase Inc.</strong>
        <br />
        Serveurs hébergés dans l&apos;Union Européenne.
      </Section>

      <Section title="Paiement">
        Les paiements sont traités par <strong>Stripe Inc.</strong> Vizly ne stocke aucune
        donnée de carte bancaire.
      </Section>

      <Section title="Propriété intellectuelle">
        L&apos;ensemble du contenu du site vizly.fr (textes, design, code source, templates, marque)
        est la propriété de Vizly, sauf le contenu créé par les utilisateurs sur leurs portfolios.
        Toute reproduction non autorisée est interdite.
      </Section>

      <Section title="Contact">
        Pour toute question :{' '}
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
