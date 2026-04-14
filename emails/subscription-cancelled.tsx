/**
 * subscription-cancelled — transactional email when a paid user cancels
 * their subscription (Pro → Gratuit or Starter → Gratuit).
 *
 * Tone: NEUTRAL, not sad. The user chose to cancel — respect that. No
 * "sorry to see you go", no "come back soon", no guilt trip. Factual
 * statement of what ends, when, and critically what STAYS.
 *
 * Audit-backed facts (see handleSubscriptionDeleted in the Stripe webhook
 * and PLANS.free.publishLimit = 0 in constants.ts):
 *  - Free plan allows ZERO published portfolios, not one.
 *  - ALL the user's portfolios get `published = false` on downgrade.
 *  - Nothing is deleted: rows, projects, images in Storage, purchased
 *    templates all stay intact. The user gets everything back if they
 *    re-subscribe.
 *  - Custom domain stays in a grey area (DB column preserved, Vercel
 *    domain attachment not released). We silently omit mentioning it —
 *    promising anything either way would be misleading.
 *
 * Reassurance pattern (from payment-failed): the "what stays" block comes
 * BEFORE the "what changes" block, because the user's biggest anxiety is
 * "did I just lose my work?" — we answer that first, then explain the
 * practical consequences.
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

export interface SubscriptionCancelledEmailProps {
  data: EmailDataMap['subscription-cancelled']
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

function formatDate(iso: string, locale: EmailLocale): string {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(iso))
}

export default function SubscriptionCancelledEmail({
  data,
  locale = 'fr',
}: SubscriptionCancelledEmailProps) {
  const t = getEmailStrings(locale).subscriptionCancelled

  const greeting = data.name
    ? t.greeting.replace('{name}', data.name)
    : t.greetingNoName

  const formattedDate = formatDate(data.effectiveDate, locale)

  const body = t.body
    .replace('{previousPlan}', data.previousPlanName)
    .replace('{date}', formattedDate)

  const whatChangesBody = t.whatChangesBody.replace('{date}', formattedDate)

  // "Vizly Pro → Gratuit" — arrow notation inherited from plan-changed.
  // The target plan is always "Gratuit" for this template (hardcoded
  // since Free is the only destination for a subscription cancellation).
  const freeLabel = locale === 'fr' ? 'Gratuit' : 'Free'
  const planTransition = `Vizly ${data.previousPlanName} → ${freeLabel}`

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
          <Column style={receiptValueCol}>{planTransition}</Column>
        </Row>
        <Row>
          <Column style={receiptLabelCol}>{t.labelEffectiveDate}</Column>
          <Column style={receiptValueCol}>{formattedDate}</Column>
        </Row>
      </Section>

      <Heading style={subheading} as="h2">
        {t.whatStaysHeading}
      </Heading>
      <Text style={blockParagraph}>{t.whatStaysBody}</Text>

      <Heading style={subheading} as="h2">
        {t.whatChangesHeading}
      </Heading>
      <Text style={blockParagraph}>{whatChangesBody}</Text>

      <Section style={ctaSection}>
        <Button href={billingUrl} style={button}>
          {t.cta}
        </Button>
      </Section>

      <Text style={paragraphMuted}>{t.footerNote}</Text>
    </Layout>
  )
}

SubscriptionCancelledEmail.PreviewProps = {
  data: {
    name: 'Tom',
    previousPlanName: 'Pro',
    effectiveDate: '2026-05-13',
  },
  locale: 'fr',
} satisfies SubscriptionCancelledEmailProps
