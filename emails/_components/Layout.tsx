import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'
import {
  body,
  card,
  container,
  contentSection,
  footerLink,
  footerSection,
  footerText,
  headerSection,
  hr,
  logoDot,
  logoText,
} from '../_styles'

interface LayoutProps {
  preview: string
  locale?: 'fr' | 'en'
  children: ReactNode
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vizly.fr'

const FOOTER_COPY: Record<'fr' | 'en', { tagline: string; legal: string }> = {
  fr: {
    tagline: 'Vizly — le builder de portfolios qui te fait gagner du temps.',
    legal:
      'Tu reçois cet email car tu as un compte sur Vizly. Pour toute question, réponds simplement à ce message.',
  },
  en: {
    tagline: 'Vizly — the portfolio builder that saves you time.',
    legal:
      'You are receiving this email because you have a Vizly account. Reply to this message if you have any questions.',
  },
}

export function Layout({ preview, locale = 'fr', children }: LayoutProps) {
  const copy = FOOTER_COPY[locale]

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={card}>
            <Section style={headerSection}>
              <Text style={logoText}>
                Vizly<span style={logoDot}>•</span>
              </Text>
            </Section>

            <Section style={contentSection}>{children}</Section>

            <Hr style={hr} />

            <Section style={footerSection}>
              <Text style={footerText}>
                {copy.tagline}
                <br />
                {copy.legal}
                <br />
                <a href={APP_URL} style={footerLink}>
                  vizly.fr
                </a>
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
