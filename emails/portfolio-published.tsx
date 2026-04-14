import { Button, Heading, Section, Text } from '@react-email/components'
import { Layout } from './_components/Layout'
import {
  button,
  colors,
  heading,
  paragraph,
  paragraphMuted,
  radius,
  spacing,
} from './_styles'
import { getEmailStrings } from '../src/lib/emails/i18n'
import type { EmailDataMap, EmailLocale } from '../src/lib/emails/types'

interface PortfolioPublishedEmailProps {
  data: EmailDataMap['portfolio-published']
  locale?: EmailLocale
}

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vizly.fr'

const urlBox = {
  backgroundColor: colors.surfaceWarm,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  padding: `${spacing.base} ${spacing.lg}`,
  margin: `0 0 ${spacing.lg} 0`,
  fontFamily:
    'Menlo, "SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
  fontSize: '15px',
  color: colors.foreground,
  wordBreak: 'break-all' as const,
  textAlign: 'left' as const,
}

const ctaSection = {
  margin: `0 0 ${spacing.lg} 0`,
  textAlign: 'left' as const,
}

const shareSection = {
  margin: 0,
}

const shareLink = {
  color: colors.muted,
  textDecoration: 'underline',
}

export default function PortfolioPublishedEmail({
  data,
  locale = 'fr',
}: PortfolioPublishedEmailProps) {
  const t = getEmailStrings(locale).portfolioPublished
  const greeting = data.name
    ? t.greeting.replace('{name}', data.name)
    : t.greetingNoName

  // Display URL as compact "slug.vizly.fr" without protocol — cleaner
  // visually. The actual link target uses the full https URL.
  const displayUrl = `${data.portfolioSlug}.${APP_DOMAIN}`

  // LinkedIn: shareArticle is the only LinkedIn share URL that accepts a
  // pre-filled summary. The newer share-offsite endpoint accepts only `url`
  // and pulls the preview from the destination page's Open Graph tags.
  // shareArticle was officially deprecated in 2021 but still works in the
  // wild as of 2026; if LinkedIn fully removes it, the composer will just
  // open with the URL preview only — graceful degradation.
  const linkedinTitle = data.portfolioTitle || t.share.fallbackTitle
  const shareLinkedInUrl =
    `https://www.linkedin.com/shareArticle?mini=true` +
    `&url=${encodeURIComponent(data.portfolioUrl)}` +
    `&title=${encodeURIComponent(linkedinTitle)}` +
    `&summary=${encodeURIComponent(t.share.linkedinText)}`

  // X (Twitter): the intent/tweet endpoint appends `url` after `text`
  // automatically and t.co-shortens it (~23 chars). Don't include the
  // URL in the text itself.
  const shareXUrl =
    `https://twitter.com/intent/tweet` +
    `?text=${encodeURIComponent(t.share.xText)}` +
    `&url=${encodeURIComponent(data.portfolioUrl)}`

  return (
    <Layout preview={t.preheader} locale={locale}>
      <Heading style={heading} as="h1">
        {t.heading}
      </Heading>

      <Text style={paragraph}>{greeting}</Text>
      <Text style={paragraph}>{t.body}</Text>

      <Section>
        <Text style={urlBox}>
          <a
            href={data.portfolioUrl}
            style={{ color: colors.foreground, textDecoration: 'none' }}
          >
            {displayUrl}
          </a>
        </Text>
      </Section>

      <Section style={ctaSection}>
        <Button href={data.portfolioUrl} style={button}>
          {t.cta}
        </Button>
      </Section>

      <Section style={shareSection}>
        <Text style={paragraphMuted}>
          <a href={shareLinkedInUrl} style={shareLink}>
            {t.share.linkedinLabel}
          </a>
          {'  ·  '}
          <a href={shareXUrl} style={shareLink}>
            {t.share.xLabel}
          </a>
        </Text>
      </Section>
    </Layout>
  )
}

PortfolioPublishedEmail.PreviewProps = {
  data: {
    name: 'Tom',
    portfolioTitle: 'Tom Lefebvre — Designer Produit',
    portfolioUrl: 'https://tom.vizly.fr',
    portfolioSlug: 'tom',
  },
  locale: 'fr',
} satisfies PortfolioPublishedEmailProps
