import { Button, Heading, Section, Text } from '@react-email/components'
import { Layout } from './_components/Layout'
import {
  button,
  colors,
  heading,
  paragraph,
  paragraphMuted,
  spacing,
} from './_styles'
import { getEmailStrings } from '../src/lib/emails/i18n'
import type { EmailDataMap, EmailLocale } from '../src/lib/emails/types'

interface WelcomeEmailProps {
  data: EmailDataMap['welcome']
  locale?: EmailLocale
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vizly.fr'
const EDITOR_URL = `${APP_URL}/editor`
const TEMPLATES_URL = `${APP_URL}/templates`

const ctaSection = {
  margin: `${spacing.lg} 0`,
  textAlign: 'left' as const,
}

const secondaryLink = {
  color: colors.muted,
  textDecoration: 'underline',
}

export default function WelcomeEmail({
  data,
  locale = 'fr',
}: WelcomeEmailProps) {
  const t = getEmailStrings(locale).welcome
  const greeting = data.name
    ? t.greeting.replace('{name}', data.name)
    : t.greetingNoName

  return (
    <Layout preview={t.preheader} locale={locale}>
      <Heading style={heading} as="h1">
        {t.heading}
      </Heading>

      <Text style={paragraph}>{greeting}</Text>
      <Text style={paragraph}>{t.body1}</Text>
      <Text style={paragraph}>{t.body2}</Text>

      <Section style={ctaSection}>
        <Button href={EDITOR_URL} style={button}>
          {t.cta}
        </Button>
      </Section>

      <Text style={paragraphMuted}>
        <a href={TEMPLATES_URL} style={secondaryLink}>
          {t.secondary}
        </a>
      </Text>
    </Layout>
  )
}

WelcomeEmail.PreviewProps = {
  data: { name: 'Tom' },
  locale: 'fr',
} satisfies WelcomeEmailProps
