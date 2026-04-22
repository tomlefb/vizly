import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { VzLogo } from '@/components/ui/vizly'

export async function Footer() {
  const t = await getTranslations('footer')

  const footerNav = [
    {
      titleKey: 'produit.title' as const,
      links: [
        { labelKey: 'produit.features' as const, href: '/fonctionnalites' },
        { labelKey: 'produit.templates' as const, href: '/templates' },
        { labelKey: 'produit.pricing' as const, href: '/tarifs' },
      ],
    },
    {
      titleKey: 'ressources.title' as const,
      links: [
        { labelKey: 'ressources.blog' as const, href: '/blog' },
        { labelKey: 'ressources.faq' as const, href: '/legal/faq' },
      ],
    },
    {
      titleKey: 'legal.title' as const,
      links: [
        { labelKey: 'legal.mentions' as const, href: '/legal/mentions' },
        { labelKey: 'legal.cgu' as const, href: '/legal/cgu' },
        { labelKey: 'legal.privacy' as const, href: '/legal/confidentialite' },
        { labelKey: 'legal.contact' as const, href: '/legal/contact' },
        { labelKey: 'legal.report' as const, href: '/legal/signalement' },
      ],
    },
  ]

  return (
    <footer className="border-t border-border-light bg-surface-warm" role="contentinfo">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-12 lg:gap-16">
          {/* Brand column -- wider */}
          <div className="col-span-2 md:col-span-6">
            <VzLogo size={22} />
            <p className="mt-4 text-sm text-muted leading-relaxed max-w-xs">
              {t('tagline')}
            </p>
          </div>

          {/* Nav columns */}
          {footerNav.map((section) => (
            <div
              key={section.titleKey}
              className="md:col-span-2"
            >
              <h3 className="font-[family-name:var(--font-satoshi)] text-sm font-semibold mb-4">
                {t(section.titleKey)}
              </h3>
              <ul className="space-y-2.5" role="list">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors duration-200 hover:text-foreground"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {t('copyright', { year: new Date().getFullYear().toString() })}
          </p>
        </div>
      </div>
    </footer>
  )
}
