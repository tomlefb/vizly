/**
 * renewal-reminder — transactional email sent J-7 before a yearly
 * subscription renews.
 *
 * Scope: YEARLY subscriptions ONLY. Monthly subs don't get this reminder
 * — a monthly J-7 would be spam. The literal type billingPeriod: 'yearly'
 * enforces this at compile time (passing 'monthly' fails typecheck with
 * TS 2322 "Type 'monthly' is not assignable to type 'yearly'").
 *
 * NOT triggered by a Stripe event — triggered by a Phase 4 daily cron that
 * scans subscriptions whose current_period_end falls exactly 7 days in the
 * future. Single reminder at J-7, no J-30 or J-1 in addition.
 *
 * Tone: factual and neutral. This is the "no news" template — no bad news
 * (payment-failed), no good news (payment-succeeded), no change. Just a
 * heads-up. Reference registre: Apple's iCloud annual renewal reminders
 * — sober, factual, useful, with the option to act without pushing.
 *
 * Structure: reassurance BEFORE modification option. The happy-path user
 * (who wants to renew) sees "you don't need to do anything" first and
 * stops reading. The minority user (who wants to cancel) reads on to find
 * the modify block. This order respects the majority without hiding the
 * escape hatch from the minority.
 */

import {
  Button,
  Column,
  Heading,
  Row,
  Section,
  Text,
} from '@react-email/components'
import type { CSSProperties } from 'react'
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

interface RenewalReminderEmailProps {
  data: EmailDataMap['renewal-reminder']
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

const subheading: CSSProperties = {
  margin: `0 0 ${spacing.sm} 0`,
  fontFamily: fonts.sans,
  fontSize: '16px',
  fontWeight: 600,
  lineHeight: 1.4,
  color: colors.foreground,
}

const blockParagraph: CSSProperties = {
  ...paragraph,
  margin: `0 0 ${spacing.lg} 0`,
}

const ctaSection = {
  margin: `0 0 ${spacing.lg} 0`,
  textAlign: 'left' as const,
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

export default function RenewalReminderEmail({
  data,
  locale = 'fr',
}: RenewalReminderEmailProps) {
  const t = getEmailStrings(locale).renewalReminder

  const greeting = data.name
    ? t.greeting.replace('{name}', data.name)
    : t.greetingNoName

  const formattedDate = formatDate(data.renewalDate, locale)
  const formattedAmount = formatCurrency(data.amount, data.currency, locale)

  const body = t.body
    .replace('{planName}', data.planName)
    .replace('{date}', formattedDate)
    .replace('{amount}', formattedAmount)

  const preheader = t.preheader.replace('{date}', formattedDate)
  const modifyBody = t.modifyBody.replace('{date}', formattedDate)

  const billingUrl = `${APP_URL}/billing`

  return (
    <Layout preview={preheader} locale={locale}>
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
          <Column style={receiptLabelCol}>{t.labelBilling}</Column>
          <Column style={receiptValueCol}>{t.valueBillingYearly}</Column>
        </Row>
        <Row>
          <Column style={receiptLabelCol}>{t.labelRenewalDate}</Column>
          <Column style={receiptValueCol}>{formattedDate}</Column>
        </Row>
        <Row>
          <Column style={receiptLabelCol}>{t.labelAmount}</Column>
          <Column style={receiptValueCol}>{formattedAmount}</Column>
        </Row>
      </Section>

      <Heading style={subheading} as="h2">
        {t.noActionHeading}
      </Heading>
      <Text style={blockParagraph}>{t.noActionBody}</Text>

      <Heading style={subheading} as="h2">
        {t.modifyHeading}
      </Heading>
      <Text style={blockParagraph}>{modifyBody}</Text>

      <Section style={ctaSection}>
        <Button href={billingUrl} style={button}>
          {t.cta}
        </Button>
      </Section>

      <Text style={paragraphMuted}>{t.footerNote}</Text>
    </Layout>
  )
}

RenewalReminderEmail.PreviewProps = {
  data: {
    name: 'Tom',
    planName: 'Pro',
    billingPeriod: 'yearly',
    amount: 10190,
    currency: 'EUR',
    renewalDate: '2027-04-13',
  },
  locale: 'fr',
} satisfies RenewalReminderEmailProps
