/**
 * billing-period-changed — transactional email when a paid user switches
 * billing cycle WITHOUT changing plan.
 *
 * Scope: Pro monthly ↔ Pro yearly, Starter monthly ↔ Starter yearly.
 * If the plan ALSO changes simultaneously, that's plan-changed, not this.
 *
 * Architecture mirrors plan-changed: the upgrade direction (monthly→yearly,
 * the more common case) lives here as the default PreviewProps. The reverse
 * direction (yearly→monthly) is exposed via a thin preview-only wrapper file
 * billing-period-changed-to-monthly.tsx that imports this same component.
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

export interface BillingPeriodChangedEmailProps {
  data: EmailDataMap['billing-period-changed']
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
  margin: `0 0 ${spacing.base} 0`,
  textAlign: 'left' as const,
}

const outroParagraph = {
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

export default function BillingPeriodChangedEmail({
  data,
  locale = 'fr',
}: BillingPeriodChangedEmailProps) {
  const t = getEmailStrings(locale).billingPeriodChanged
  const isToYearly = data.newBillingPeriod === 'yearly'

  const greeting = data.name
    ? t.greeting.replace('{name}', data.name)
    : t.greetingNoName

  const body = isToYearly ? t.bodyToYearly : t.bodyToMonthly
  const preheader = isToYearly ? t.preheaderToYearly : t.preheaderToMonthly

  const formattedAmount = formatCurrency(data.newAmount, data.currency, locale)
  const formattedNextBilling = formatDate(data.nextBillingDate, locale)
  const formattedEffectiveDate = formatDate(data.effectiveDate, locale)
  const effectiveDateValue = data.isImmediate
    ? t.valueImmediate
    : formattedEffectiveDate

  // "Mensuelle → Annuelle" or inverse — mirrors the plan-changed transition
  // notation but applied to billing cycle instead of plan name.
  const previousBillingLabel =
    data.previousBillingPeriod === 'yearly'
      ? t.valueBillingYearly
      : t.valueBillingMonthly
  const newBillingLabel =
    data.newBillingPeriod === 'yearly'
      ? t.valueBillingYearly
      : t.valueBillingMonthly
  const billingTransition = `${previousBillingLabel} → ${newBillingLabel}`

  // Conditional "Nouveau montant mensuel/annuel" label — the periodicity
  // is integrated into the row that shows the price so there's no
  // ambiguity about what the user will be charged.
  const amountLabel = isToYearly
    ? t.labelNewAmountYearly
    : t.labelNewAmountMonthly

  // Outro: toYearly is a simple reassurance. toMonthly carries the
  // factual deadline + the future monthly amount so the user has the
  // full picture without clicking the CTA.
  const outroText = isToYearly
    ? t.outroToYearly
    : t.outroToMonthly
        .replace('{date}', formattedEffectiveDate)
        .replace('{amount}', formattedAmount)

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
          <Column style={receiptValueCol}>{billingTransition}</Column>
        </Row>
        <Row>
          <Column style={receiptLabelCol}>{amountLabel}</Column>
          <Column style={receiptValueCol}>{formattedAmount}</Column>
        </Row>
        <Row>
          <Column style={receiptLabelCol}>{t.labelEffectiveDate}</Column>
          <Column style={receiptValueCol}>{effectiveDateValue}</Column>
        </Row>
        <Row>
          <Column style={receiptLabelCol}>{t.labelNextBilling}</Column>
          <Column style={receiptValueCol}>{formattedNextBilling}</Column>
        </Row>
      </Section>

      <Section style={ctaSection}>
        <Button href={billingUrl} style={button}>
          {t.cta}
        </Button>
      </Section>

      <Text style={outroParagraph}>{outroText}</Text>
      <Text style={paragraphMuted}>{t.footerNote}</Text>
    </Layout>
  )
}

BillingPeriodChangedEmail.PreviewProps = {
  data: {
    name: 'Tom',
    planName: 'Pro',
    previousBillingPeriod: 'monthly',
    newBillingPeriod: 'yearly',
    newAmount: 10190,
    currency: 'EUR',
    effectiveDate: '2026-04-13',
    isImmediate: true,
    nextBillingDate: '2027-04-13',
  },
  locale: 'fr',
} satisfies BillingPeriodChangedEmailProps
