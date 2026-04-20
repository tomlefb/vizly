/**
 * plan-changed — transactional email for paid plan transitions.
 *
 * Vizly has 3 plans: Gratuit (free, no Stripe sub), Starter (4.99€/month),
 * Pro (9.99€/month). The 6 possible transitions and their template mapping:
 *
 *   Transition          Stripe event                    Template
 *   ─────────────────────────────────────────────────────────────────────
 *   Gratuit  → Starter  checkout.session.completed      payment-succeeded
 *   Gratuit  → Pro      checkout.session.completed      payment-succeeded
 *   Starter  → Pro      customer.subscription.updated   plan-changed (this)
 *   Pro      → Starter  customer.subscription.updated   plan-changed (this)
 *   Starter  → Gratuit  customer.subscription.deleted   subscription-cancelled
 *   Pro      → Gratuit  customer.subscription.deleted   subscription-cancelled
 *
 * SCOPE: this template handles ONLY Starter ↔ Pro. The literal union types
 * for previousPlanName and newPlanName ('Starter' | 'Pro') make the typecheck
 * refuse 'Gratuit' — it's a programming error to pass it. The Phase 4 webhook
 * is responsible for routing each transition to the right template.
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

export interface PlanChangedEmailProps {
  data: EmailDataMap['plan-changed']
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

const noticeBox = {
  backgroundColor: colors.accentLight,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  padding: spacing.lg,
  margin: `0 0 ${spacing.lg} 0`,
}

const noticeHeading = {
  fontFamily: fonts.sans,
  fontSize: '14px',
  fontWeight: 600,
  color: colors.foreground,
  margin: `0 0 ${spacing.xs} 0`,
}

const noticeBody = {
  fontFamily: fonts.sans,
  fontSize: '14px',
  lineHeight: 1.5,
  color: colors.foreground,
  margin: 0,
}

export default function PlanChangedEmail({
  data,
  locale = 'fr',
}: PlanChangedEmailProps) {
  const t = getEmailStrings(locale).planChanged
  const isUpgrade = data.changeType === 'upgrade'

  const greeting = data.name
    ? t.greeting.replace('{name}', data.name)
    : t.greetingNoName

  const bodyTemplate = isUpgrade ? t.bodyUpgrade : t.bodyDowngrade
  const body = bodyTemplate.replace('{newPlan}', data.newPlanName)

  const preheader = isUpgrade ? t.preheaderUpgrade : t.preheaderDowngrade

  const formattedAmount = formatCurrency(data.newAmount, data.currency, locale)
  const formattedNextBilling = formatDate(data.nextBillingDate, locale)
  const formattedEffectiveDate = formatDate(data.effectiveDate, locale)
  const effectiveDateValue = data.isImmediate
    ? t.valueImmediate
    : formattedEffectiveDate

  // Downgrade uniquement : si on a dépublié 1+ portfolios pour respecter
  // la limite Starter (1 publié max), on l'annonce ici pour éviter la
  // surprise "pourquoi mon site est down" côté user.
  const showUnpublishedNotice =
    !isUpgrade && typeof data.unpublishedCount === 'number' && data.unpublishedCount > 0
  const unpublishedBodyTemplate =
    data.unpublishedCount === 1 ? t.unpublishedBodyOne : t.unpublishedBodyMany
  const unpublishedBody = unpublishedBodyTemplate.replace(
    '{count}',
    String(data.unpublishedCount ?? 0),
  )

  // Locale-aware "Nouveau montant mensuel/annuel" label so the periodicity
  // is integrated into the row that shows the price — removes the need for
  // a separate "Facturation" row and disambiguates "9,99 €" (the user might
  // otherwise wonder if they're being charged that today).
  const amountLabel =
    data.newBillingPeriod === 'yearly'
      ? t.labelNewAmountYearly
      : t.labelNewAmountMonthly

  // Compact transition display: "Starter → Pro" tells the story at a glance.
  // Tested vs separate "Ancien plan / Nouveau plan" rows; the arrow is more
  // visual and the whole point of this template IS the transition, so a
  // dedicated 1-row notation reads cleaner than splitting it across 2 rows.
  const planTransition = `${data.previousPlanName} → ${data.newPlanName}`

  const outroText = isUpgrade
    ? t.outroUpgrade
    : t.outroDowngrade.replace('{date}', formattedEffectiveDate)

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
          <Column style={receiptValueCol}>{planTransition}</Column>
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

      {showUnpublishedNotice && (
        <Section style={noticeBox}>
          <Text style={noticeHeading}>{t.unpublishedHeading}</Text>
          <Text style={noticeBody}>{unpublishedBody}</Text>
        </Section>
      )}

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

PlanChangedEmail.PreviewProps = {
  data: {
    name: 'Tom',
    previousPlanName: 'Starter',
    newPlanName: 'Pro',
    changeType: 'upgrade',
    newAmount: 999,
    currency: 'EUR',
    newBillingPeriod: 'monthly',
    effectiveDate: '2026-04-13',
    isImmediate: true,
    nextBillingDate: '2026-05-13',
  },
  locale: 'fr',
} satisfies PlanChangedEmailProps
