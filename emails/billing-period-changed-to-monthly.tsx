/**
 * Preview-only wrapper for the to-monthly direction of billing-period-changed.
 *
 * Same pattern as plan-changed-downgrade: this file points at the same
 * component with the reverse-direction data baked in so the React Email
 * sidebar lists both variants and we can switch between them with a click.
 *
 * Preview-only — NOT imported by send.tsx. The send helper renders
 * <BillingPeriodChangedEmail> directly with whatever payload the call site
 * provides (toYearly or toMonthly, both routed through the same component).
 */

import BillingPeriodChangedEmail from './billing-period-changed'
import type { EmailDataMap, EmailLocale } from '../src/lib/emails/types'

const toMonthlyData: EmailDataMap['billing-period-changed'] = {
  name: 'Tom',
  planName: 'Pro',
  previousBillingPeriod: 'yearly',
  newBillingPeriod: 'monthly',
  newAmount: 999,
  currency: 'EUR',
  // Yearly → monthly: change applies at the end of the current annual
  // period (proration disabled by Vizly convention).
  effectiveDate: '2027-04-13',
  isImmediate: false,
  // First monthly charge happens one month after the period ends.
  nextBillingDate: '2027-05-13',
}

interface BillingPeriodChangedToMonthlyEmailProps {
  locale?: EmailLocale
}

export default function BillingPeriodChangedToMonthlyEmail({
  locale = 'fr',
}: BillingPeriodChangedToMonthlyEmailProps = {}) {
  return <BillingPeriodChangedEmail data={toMonthlyData} locale={locale} />
}

BillingPeriodChangedToMonthlyEmail.PreviewProps = {
  locale: 'fr',
} satisfies BillingPeriodChangedToMonthlyEmailProps
