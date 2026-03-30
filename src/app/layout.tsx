import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { DM_Sans } from 'next/font/google'
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
    default: 'Vizly — Crée ton portfolio en 5 minutes',
    template: '%s | Vizly',
  },
  description:
    'Crée un portfolio en ligne professionnel en quelques minutes. Choisis un template, remplis tes infos, et ton site est live sur pseudo.vizly.fr.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? `https://${process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vizly.fr'}`
  ),
  openGraph: {
    title: 'Vizly — Crée ton portfolio en 5 minutes',
    description:
      'Le builder de portfolios le plus simple. Remplis, personnalise, publie.',
    siteName: 'Vizly',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vizly — Crée ton portfolio en 5 minutes',
    description:
      'Le builder de portfolios le plus simple. Remplis, personnalise, publie.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Vizly',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    description:
      'Cree un portfolio en ligne professionnel en quelques minutes.',
    url: 'https://vizly.fr',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: '0',
      highPrice: '9.99',
      offerCount: '3',
    },
  }

  return (
    <html lang="fr" className={`${satoshi.variable} ${dmSans.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
