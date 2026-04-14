import { Heading, Section, Text } from '@react-email/components'
import { Layout } from './_components/Layout'
import {
  colors,
  fonts,
  heading,
  paragraph,
  paragraphMuted,
  radius,
  spacing,
} from './_styles'
import type { EmailDataMap, EmailLocale } from '../src/lib/emails/types'

interface ContactNotificationEmailProps {
  data: EmailDataMap['contact-notification']
  locale?: EmailLocale
}

const COPY = {
  fr: {
    previewWith: (portfolio: string) => `Nouveau message via ${portfolio}`,
    previewWithout: 'Nouveau message via Vizly',
    headingWith: 'Nouveau message via ton portfolio',
    headingWithout: 'Nouveau message via Vizly',
    introWith: (portfolio: string) => (
      <>
        Quelqu&apos;un t&apos;a contacté via <strong>{portfolio}</strong>.
      </>
    ),
    introWithout: (
      <>
        Quelqu&apos;un t&apos;a envoyé un message via le formulaire de contact
        de Vizly.
      </>
    ),
    fromLabel: 'De',
    replyHint: (email: string) => (
      <>
        Tu peux répondre directement à{' '}
        <a href={`mailto:${email}`} style={{ color: colors.accent }}>
          {email}
        </a>
        .
      </>
    ),
  },
  en: {
    previewWith: (portfolio: string) => `New message via ${portfolio}`,
    previewWithout: 'New message via Vizly',
    headingWith: 'New message from your portfolio',
    headingWithout: 'New message via Vizly',
    introWith: (portfolio: string) => (
      <>
        Someone reached out via <strong>{portfolio}</strong>.
      </>
    ),
    introWithout: (
      <>Someone sent a message via the Vizly contact form.</>
    ),
    fromLabel: 'From',
    replyHint: (email: string) => (
      <>
        You can reply directly to{' '}
        <a href={`mailto:${email}`} style={{ color: colors.accent }}>
          {email}
        </a>
        .
      </>
    ),
  },
} as const

const messageBox = {
  backgroundColor: colors.surfaceWarm,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  padding: spacing.lg,
  margin: `0 0 ${spacing.base} 0`,
}

const messageMeta = {
  margin: `0 0 ${spacing.sm} 0`,
  fontFamily: fonts.sans,
  fontSize: '13px',
  color: colors.muted,
}

const messageBody = {
  margin: 0,
  fontFamily: fonts.sans,
  fontSize: '14px',
  lineHeight: 1.6,
  color: colors.foreground,
  whiteSpace: 'pre-wrap' as const,
}

export default function ContactNotificationEmail({
  data,
  locale = 'fr',
}: ContactNotificationEmailProps) {
  const t = COPY[locale]
  const hasPortfolio = Boolean(data.portfolioName)

  const preview = hasPortfolio
    ? t.previewWith(data.portfolioName as string)
    : t.previewWithout
  const headingText = hasPortfolio ? t.headingWith : t.headingWithout
  const intro = hasPortfolio
    ? t.introWith(data.portfolioName as string)
    : t.introWithout

  return (
    <Layout preview={preview} locale={locale}>
      <Heading style={heading} as="h1">
        {headingText}
      </Heading>

      <Text style={paragraph}>{intro}</Text>

      <Section style={messageBox}>
        <Text style={messageMeta}>
          <strong style={{ color: colors.foreground }}>{t.fromLabel} :</strong>{' '}
          {data.senderName} &lt;{data.senderEmail}&gt;
        </Text>
        <Text style={messageBody}>{data.message}</Text>
      </Section>

      <Text style={paragraphMuted}>{t.replyHint(data.senderEmail)}</Text>
    </Layout>
  )
}

ContactNotificationEmail.PreviewProps = {
  data: {
    portfolioName: 'Mon portfolio Vizly',
    senderName: 'Alice Martin',
    senderEmail: 'alice@example.com',
    message:
      "Bonjour, j'ai vu ton portfolio et j'aimerais discuter d'une collaboration sur un projet de design produit. Disponible la semaine prochaine ?",
  },
  locale: 'fr',
} satisfies ContactNotificationEmailProps
