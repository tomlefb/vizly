/**
 * Preview-only wrapper for the Starter → Gratuit case of subscription-cancelled.
 *
 * Same pattern as plan-changed-downgrade: this file renders the main
 * component with Starter data baked in. React Email lists both the main
 * file (Pro → Gratuit) and this one (Starter → Gratuit) in the sidebar.
 *
 * Preview-only — NOT imported by send.tsx. The send helper renders the
 * main component with whatever payload the call site provides.
 */

import SubscriptionCancelledEmail from './subscription-cancelled'
import type { EmailDataMap, EmailLocale } from '../src/lib/emails/types'

const starterData: EmailDataMap['subscription-cancelled'] = {
  name: 'Tom',
  previousPlanName: 'Starter',
  effectiveDate: '2026-05-13',
}

interface SubscriptionCancelledStarterEmailProps {
  locale?: EmailLocale
}

export default function SubscriptionCancelledStarterEmail({
  locale = 'fr',
}: SubscriptionCancelledStarterEmailProps = {}) {
  return <SubscriptionCancelledEmail data={starterData} locale={locale} />
}

SubscriptionCancelledStarterEmail.PreviewProps = {
  locale: 'fr',
} satisfies SubscriptionCancelledStarterEmailProps
