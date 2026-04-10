import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions legales',
  description: 'Mentions legales du site vizly.fr.',
}

export default function MentionsLegalesPage() {
  return (
    <article className="prose-legal">
      <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight mb-2">
        Mentions legales
      </h1>
      <p className="text-sm text-muted mb-10">Derniere mise a jour : 10 avril 2026</p>

      <Section title="Editeur du site">
        <strong>Vizly</strong> — vizly.fr
        <br />
        Tom Lefevre Bonzon, Entrepreneur individuel
        <br />
        SIREN : 103 332 276 — SIRET : 103 332 276 00015
        <br />
        Code APE : 6201Z (Programmation informatique)
        <br />
        18 rue Henri See, 35700 Rennes, France
        <br />
        Email :{' '}
        <a href="mailto:tom@vizly.fr" className="text-accent hover:underline">tom@vizly.fr</a>
      </Section>

      <Section title="Hebergeur">
        <strong>Vercel Inc.</strong>
        <br />
        340 S Lemon Ave #4133, Walnut, CA 91789, USA
        <br />
        Site :{' '}
        <a href="https://vercel.com" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
          vercel.com
        </a>
      </Section>

      <Section title="Base de donnees">
        <strong>Supabase Inc.</strong>
        <br />
        Serveurs heberges dans l&apos;Union Europeenne.
      </Section>

      <Section title="Paiement">
        Les paiements sont traites par <strong>Stripe Inc.</strong> Vizly ne stocke aucune
        donnee de carte bancaire.
      </Section>

      <Section title="Propriete intellectuelle">
        L&apos;ensemble du contenu du site vizly.fr (textes, design, code source, templates, marque)
        est la propriete de Vizly, sauf le contenu cree par les utilisateurs sur leurs portfolios.
        Toute reproduction non autorisee est interdite.
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
