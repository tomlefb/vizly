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

interface PaymentSucceededEmailProps {
  data: EmailDataMap['payment-succeeded']
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

const invoiceLinkSection = {
  margin: `0 0 ${spacing.lg} 0`,
}

const invoiceLink = {
  color: colors.muted,
  textDecoration: 'underline',
}

// Format a Stripe-style amount (smallest currency unit, e.g. cents)
// according to the user's locale. 999 EUR cents → "9,99 €" in fr-FR.
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

// Format an ISO calendar date (YYYY-MM-DD) into a long locale date.
// Forces UTC interpretation so the displayed date matches the calendar
// date regardless of the recipient's timezone.
function formatDate(iso: string, locale: EmailLocale): string {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(iso))
}

export default function PaymentSucceededEmail({
  data,
  locale = 'fr',
}: PaymentSucceededEmailProps) {
  const t = getEmailStrings(locale).paymentSucceeded
  const greeting = data.name
    ? t.greeting.replace('{name}', data.name)
    : t.greetingNoName
  const body = t.body.replace('{planName}', data.planName)

  const formattedAmount = formatCurrency(data.amount, data.currency, locale)
  const formattedPaidAt = formatDate(data.paidAt, locale)
  const formattedNextBilling = formatDate(data.nextBillingDate, locale)
  const billingLabel =
    data.billingPeriod === 'yearly'
      ? t.valueBillingYearly
      : t.valueBillingMonthly

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
          <Column style={receiptLabelCol}>{t.labelBilling}</Column>
          <Column style={receiptValueCol}>{billingLabel}</Column>
        </Row>
        <Row>
          <Column style={receiptLabelCol}>{t.labelAmount}</Column>
          <Column style={receiptValueCol}>{formattedAmount}</Column>
        </Row>
        <Row>
          <Column style={receiptLabelCol}>{t.labelDate}</Column>
          <Column style={receiptValueCol}>{formattedPaidAt}</Column>
        </Row>
        <Row>
          <Column style={receiptLabelCol}>{t.labelNextBilling}</Column>
          <Column style={receiptValueCol}>{formattedNextBilling}</Column>
        </Row>
        {data.invoiceNumber && (
          <Row>
            <Column style={receiptLabelCol}>{t.labelInvoiceNumber}</Column>
            <Column style={receiptValueCol}>{data.invoiceNumber}</Column>
          </Row>
        )}
      </Section>

      <Section style={ctaSection}>
        <Button href={billingUrl} style={button}>
          {t.cta}
        </Button>
      </Section>

      {data.invoiceUrl && (
        <Section style={invoiceLinkSection}>
          <Text style={paragraphMuted}>
            <a href={data.invoiceUrl} style={invoiceLink}>
              {t.viewInvoice} →
            </a>
          </Text>
        </Section>
      )}

      <Text style={paragraphMuted}>{t.outro}</Text>
    </Layout>
  )
}

PaymentSucceededEmail.PreviewProps = {
  data: {
    name: 'Tom',
    planName: 'Pro',
    billingPeriod: 'monthly',
    amount: 999,
    currency: 'EUR',
    paidAt: '2026-04-13',
    nextBillingDate: '2026-05-13',
    invoiceNumber: 'INV-2026-04-0042',
    invoiceUrl: 'https://invoice.stripe.com/i/acct_xxx/test_yyy',
  },
  locale: 'fr',
} satisfies PaymentSucceededEmailProps
