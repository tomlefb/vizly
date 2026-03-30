import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'

const footerNav = {
  produit: {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalites', href: '#features' },
      { label: 'Templates', href: '/templates' },
      { label: 'Tarifs', href: '#pricing' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  ressources: {
    title: 'Ressources',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Guide de demarrage', href: '/blog/guide-demarrage' },
      { label: 'Exemples de portfolios', href: '/exemples' },
      { label: 'FAQ', href: '/legal/faq' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Mentions legales', href: '/legal/mentions' },
      { label: 'CGU', href: '/legal/cgu' },
      { label: 'Politique de confidentialite', href: '/legal/confidentialite' },
      { label: 'Contact', href: '/legal/contact' },
    ],
  },
} as const

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-warm" role="contentinfo">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
          {/* Brand column -- wider */}
          <div className="md:col-span-4 lg:col-span-5">
            <Logo size="md" />
            <p className="mt-4 text-sm text-muted leading-relaxed max-w-xs">
              Le moyen le plus simple de creer un portfolio en ligne
              professionnel. Remplis, personnalise, publie.
            </p>
          </div>

          {/* Nav columns */}
          {Object.values(footerNav).map((section) => (
            <div
              key={section.title}
              className="md:col-span-2 lg:col-span-2"
            >
              <h3 className="font-[family-name:var(--font-satoshi)] text-sm font-semibold mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2.5" role="list">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors duration-200 hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Vizly. Tous droits reserves.
          </p>
          <p className="text-xs text-muted-foreground">
            Fait avec <span aria-label="amour">&#10084;&#65039;</span> en France
          </p>
        </div>
      </div>
    </footer>
  )
}
