/**
 * payment-failed — transactional email when Stripe fails to charge a
 * subscription's payment method.
 *
 * Tone: Stripe-style. Factual, calm, action-oriented. Critical to NOT be
 * alarmist — payment failures already trigger anxiety (expired card,
 * insufficient funds, fraud detection). Frame everything around what
 * stays intact (subscription active, portfolios online) and what the user
 * can do (update card). Avoid negative verbs ("lose", "remove",
 * "deactivate") — use neutral framing ("revert to Free", "won't go
 * through") instead.
 *
 * Reassurance is integrated into the body sentence directly (not deferred
 * to a separate paragraph after the receipt) so it lands BEFORE the user
 * has to scan details or think about clicking anything.
 */

import {
  Button,
  Column,
  Heading,
  Row,
  Section,
  Text,
} from '@react-email/components'
import { Layout } from './_components/Layout'
import {
  button,
  colors,
  fonts,
  heading,
  paragraph,
  paragraphMuted,
  radius,
  spacing,
} from './_styles'
import { getEmailStrings } from '../src/lib/emails/i18n'
import type { EmailDataMap, EmailLocale } from '../src/lib/emails/types'

interface PaymentFailedEmailProps {
  data: EmailDataMap['payment-failed']
  locale?: EmailLocale
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vizly.fr'

const receiptBox = {
  backgroundColor: colors.surfaceWarm,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  padding: spacing.lg,
  margin: `0 0 ${spacing.lg} 0`,
}

const receiptLabelCol = {
  width: '45%',
  paddingTop: spacing.xs,
  paddingBottom: spacing.xs,
  paddingRight: spacing.md,
  fontFamily: fonts.sans,
  fontSize: '14px',
  lineHeight: 1.5,
  color: colors.muted,
  verticalAlign: 'top' as const,
}

const receiptValueCol = {
  paddingTop: spacing.xs,
  paddingBottom: spacing.xs,
  fontFamily: fonts.sans,
  fontSize: '14px',
  lineHeight: 1.5,
  color: colors.foreground,
  verticalAlign: 'top' as const,
}

const ctaSection = {
  margin: `0 0 ${spacing.lg} 0`,
  textAlign: 'left' as const,
}

const nextStepsParagraph = {
  ...paragraphMuted,
  marginBottom: spacing.sm,
}

function formatCurrency(
  amount: number,
  currency: string,
  locale: EmailLocale,
): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

function formatDate(iso: string, locale: EmailLocale): string {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(iso))
}

export default function PaymentFailedEmail({
  data,
  locale = 'fr',
}: PaymentFailedEmailProps) {
  const t = getEmailStrings(locale).paymentFailed

  const greeting = data.name
    ? t.greeting.replace('{name}', data.name)
    : t.greetingNoName

  const body = t.body.replace('{planName}', data.planName)

  const formattedAmount = formatCurrency(data.amount, data.currency, locale)
  const formattedAttemptedAt = formatDate(data.attemptedAt, locale)
  const formattedDeadline = formatDate(data.gracePeriodEndDate, locale)

  // Stripe doesn't always provide nextAttemptDate (e.g. when the retry
  // schedule is exhausted or when the invoice is in dunning). Fall back
  // to a localised "in the coming days" string so the row stays visible.
  const formattedNextAttempt = data.nextAttemptDate
    ? formatDate(data.nextAttemptDate, locale)
    : t.valueNextAttemptFallback

  const nextStepsText = t.nextSteps.replace('{date}', formattedDeadline)
  const billingUrl = `${APP_URL}/billing`

  return (
    <Layout preview={t.preheader} locale={locale}>
      <Heading style={heading} as="h1">
        {t.heading}
      </Heading>

      <Text style={paragraph}>{greeting}</Text>
      <Text style={paragraph}>{body}</Text>

      <Section style={receiptBox}>
        <Row>
          <Column style={receiptLabelCol}>{t.labelPlan}</Column>
          <Column style={receiptValueCol}>Vizly {data.planName}</Column>
        </Row>
        <Row>
          <Column style={receiptLabelCol}>{t.labelAmount}</Column>
          <Column style={receiptValueCol}>{formattedAmount}</Column>
        </Row>
        <Row>
          <Column style={receiptLabelCol}>{t.labelAttemptedAt}</Column>
          <Column style={receiptValueCol}>{formattedAttemptedAt}</Column>
        </Row>
        <Row>
          <Column style={receiptLabelCol}>{t.labelNextAttempt}</Column>
          <Column style={receiptValueCol}>{formattedNextAttempt}</Column>
        </Row>
        <Row>
          <Column style={receiptLabelCol}>{t.labelDeadline}</Column>
          <Column style={receiptValueCol}>{formattedDeadline}</Column>
        </Row>
      </Section>

      <Section style={ctaSection}>
        <Button href={billingUrl} style={button}>
          {t.cta}
        </Button>
      </Section>

      <Text style={nextStepsParagraph}>{nextStepsText}</Text>
      <Text style={paragraphMuted}>{t.footerNote}</Text>
    </Layout>
  )
}

PaymentFailedEmail.PreviewProps = {
  data: {
    name: 'Tom',
    planName: 'Pro',
    amount: 999,
    currency: 'EUR',
    attemptedAt: '2026-04-13',
    nextAttemptDate: '2026-04-16',
    gracePeriodEndDate: '2026-04-20',
  },
  locale: 'fr',
} satisfies PaymentFailedEmailProps
