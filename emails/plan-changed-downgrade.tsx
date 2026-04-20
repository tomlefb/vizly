/**
 * Preview-only wrapper for the downgrade case of plan-changed.
 *
 * React Email's PreviewProps holds a single set of props per file. To preview
 * the same template with both the upgrade and downgrade variants without
 * duplicating any template logic, this file points at the same component
 * with downgrade data baked in. The sidebar in `npm run email` lists both
 * `plan-changed` (upgrade) and `plan-changed-downgrade` (this file) so we
 * can switch between them with a click.
 *
 * This file is preview-only — it is NOT imported by send.tsx. The send
 * helper renders <PlanChangedEmail> directly with the upgrade or downgrade
 * payload that the call site provides.
 */

import PlanChangedEmail from './plan-changed'
import type { EmailDataMap, EmailLocale } from '../src/lib/emails/types'

const downgradeData: EmailDataMap['plan-changed'] = {
  name: 'Tom',
  previousPlanName: 'Pro',
  newPlanName: 'Starter',
  changeType: 'downgrade',
  newAmount: 499,
  currency: 'EUR',
  newBillingPeriod: 'monthly',
  // Downgrade: Stripe applies the change at the end of the current period
  // (proration disabled by Vizly convention). effectiveDate = period end.
  effectiveDate: '2026-05-13',
  isImmediate: false,
  // The new Starter cycle starts on effectiveDate, so the FIRST Starter
  // payment will be charged ONE month later (= effectiveDate + 1 month for
  // a monthly sub). NOT the same as effectiveDate.
  nextBillingDate: '2026-06-13',
  // Preview du bloc "portfolios dépubliés" — reflète un user Pro qui avait
  // 4 portfolios en ligne : 1 reste actif, 3 sont dépubliés.
  unpublishedCount: 3,
}

interface PlanChangedDowngradeEmailProps {
  locale?: EmailLocale
}

export default function PlanChangedDowngradeEmail({
  locale = 'fr',
}: PlanChangedDowngradeEmailProps = {}) {
  return <PlanChangedEmail data={downgradeData} locale={locale} />
}

PlanChangedDowngradeEmail.PreviewProps = {
  locale: 'fr',
} satisfies PlanChangedDowngradeEmailProps
