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

export const metadata: Metadata = {
  title: {
    default: 'Vizly · Crée ton portfolio en 5 minutes',
    template: '%s · Vizly',
  },
  description:
    'Crée un portfolio en ligne professionnel en quelques minutes. Choisis un template, remplis tes infos, et ton site est live sur pseudo.vizly.fr.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? `https://${process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vizly.fr'}`
  ),
  openGraph: {
    title: 'Vizly · Crée ton portfolio en 5 minutes',
    description:
      'Le builder de portfolios le plus simple. Remplis, personnalise, publie.',
    siteName: 'Vizly',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vizly · Crée ton portfolio en 5 minutes',
    description:
      'Le builder de portfolios le plus simple. Remplis, personnalise, publie.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Vizly',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    description:
      'Crée un portfolio en ligne professionnel en quelques minutes.',
    url: 'https://vizly.fr',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: '0',
      highPrice: '9.99',
      offerCount: '3',
    },
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
