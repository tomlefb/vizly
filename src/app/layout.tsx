import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { DM_Sans } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import NextTopLoader from 'nextjs-toploader'
import './globals.css'

const satoshi = localFont({
  src: [
    {
      path: '../../public/fonts/Satoshi-Variable.woff2',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Satoshi-VariableItalic.woff2',
      style: 'italic',
    },
  ],
  variable: '--font-satoshi',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
})

// Canonical host unique pour tout le site. Le next.config redirige en 301
// `vizly.fr` → `www.vizly.fr`, donc on fige `https://www.vizly.fr` ici pour
// que tous les canonicals, OG URLs et metadataBase soient cohérents — ça évite
// les "pages en double sans URL canonique" signalées par Google Search Console.
const CANONICAL_URL = 'https://www.vizly.fr'

export const metadata: Metadata = {
  title: {
    default: 'Vizly · Crée ton portfolio en 5 minutes',
    template: '%s · Vizly',
  },
  description:
    'Crée un portfolio en ligne professionnel en quelques minutes. Choisis un template, remplis tes infos, et ton site est live sur pseudo.vizly.fr.',
  metadataBase: new URL(CANONICAL_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Vizly · Crée ton portfolio en 5 minutes',
    description:
      'Le builder de portfolios le plus simple. Remplis, personnalise, publie.',
    url: CANONICAL_URL,
    siteName: 'Vizly',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Vizly — Crée ton portfolio en ligne',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vizly · Crée ton portfolio en 5 minutes',
    description:
      'Le builder de portfolios le plus simple. Remplis, personnalise, publie.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  applicationName: 'Vizly',
  authors: [{ name: 'Vizly', url: CANONICAL_URL }],
  creator: 'Vizly',
  publisher: 'Vizly',
  category: 'technology',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  // Graph JSON-LD global : Organization (identité entreprise pour Knowledge
  // Panel), WebSite (avec SearchAction pour sitelinks search box), et
  // SoftwareApplication (produit avec AggregateOffer). Les @id croisés
  // permettent à Google de lier les entités.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${CANONICAL_URL}/#organization`,
        name: 'Vizly',
        url: CANONICAL_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${CANONICAL_URL}/logo.png`,
          width: 512,
          height: 512,
        },
        description:
          'Builder de portfolios en ligne. Crée ton site portfolio professionnel en quelques minutes.',
        email: 'tom@vizly.fr',
      },
      {
        '@type': 'WebSite',
        '@id': `${CANONICAL_URL}/#website`,
        url: CANONICAL_URL,
        name: 'Vizly',
        description:
          'Crée un portfolio en ligne professionnel en quelques minutes.',
        publisher: { '@id': `${CANONICAL_URL}/#organization` },
        inLanguage: ['fr-FR', 'en-US'],
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${CANONICAL_URL}/#software`,
        name: 'Vizly',
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web',
        description:
          'Crée un portfolio en ligne professionnel en quelques minutes.',
        url: CANONICAL_URL,
        publisher: { '@id': `${CANONICAL_URL}/#organization` },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'EUR',
          lowPrice: '0',
          highPrice: '9.99',
          offerCount: '3',
        },
      },
    ],
  }

  // Pre-paint sidebar state : fire avant le premier paint pour poser
  // un data attribute sur <html> que globals.css utilise en !important
  // pour forcer la width de la sidebar et le padding-left du main, même
  // si le SSR a émis des inline styles incorrects (edge cache, cookie
  // race). Évite le flash au F5 sur les pages dashboard.
  const sidebarPrePaintScript = `(function(){try{var m=document.cookie.match(/(?:^|; )vizly-sidebar-expanded=([^;]*)/);var c=m&&m[1]==='0';var e=location.pathname.indexOf('/editor')===0;if(c||e)document.documentElement.setAttribute('data-sidebar-collapsed','');}catch(_){}})();`

  return (
    <html lang={locale} className={`${satoshi.variable} ${dmSans.variable} overscroll-none`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: sidebarPrePaintScript }} />
        {/*
          NextTopLoader : hex inline acceptable ici — le composant ne
          lit pas les CSS custom properties. `#C2831A` = `--color-accent-deep`,
          la version foncée du safran, lisible sur fond crème.
        */}
        <NextTopLoader
          color="#C2831A"
          height={2}
          showSpinner={false}
          shadow={false}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
