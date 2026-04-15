// Bloc 8 — sous-tâche 1+2 : envoi end-to-end des 10 templates Resend
// vers vizlyfr@gmail.com pour validation visuelle dans Gmail.
//
// IMPORTANT — override NEXT_PUBLIC_APP_URL avant le dynamic import :
// chaque template React Email lit `process.env.NEXT_PUBLIC_APP_URL` au
// chargement du module (`const APP_URL = process.env... ?? '...'`). Si
// on laisse la valeur de .env.local (`http://localhost:3000`), tous les
// liens CTA et de partage des emails de test pointent vers localhost,
// ce qui les rend incliquables depuis Gmail mobile lors de la validation.
// On force donc `https://www.vizly.fr` AVANT le dynamic import de sendEmail
// pour que la valeur soit déjà en place quand send.tsx + les templates
// se chargent. Le `=` (et pas `??=`) est délibéré : on veut écraser
// même si .env.local a été chargé par un autre mécanisme.
process.env.NEXT_PUBLIC_APP_URL = 'https://www.vizly.fr'

async function main() {
  // Dynamic import APRÈS la mutation env ci-dessus pour que les reads
  // top-level dans send.tsx + emails/*.tsx voient la bonne valeur.
  const { sendEmail } = await import('../src/lib/emails/send')
  type SendParams = Parameters<typeof sendEmail>[0]

  const TO = 'vizlyfr@gmail.com'
  const now = new Date()
  const today = now.toISOString()

  const addDays = (days: number): string =>
    new Date(now.getTime() + days * 86_400_000).toISOString()
  const addYears = (years: number): string => {
    const d = new Date(now)
    d.setUTCFullYear(d.getUTCFullYear() + years)
    return d.toISOString()
  }

  const tests: ReadonlyArray<{ label: string; params: SendParams }> = [
    {
      label: '01 welcome',
      params: {
        template: 'welcome',
        to: TO,
        locale: 'fr',
        data: { name: 'Tom' },
      },
    },
    {
      label: '02 portfolio-published',
      params: {
        template: 'portfolio-published',
        to: TO,
        locale: 'fr',
        data: {
          name: 'Tom',
          portfolioTitle: 'Mon portfolio de test',
          portfolioSlug: 'tom-test',
          portfolioUrl: 'https://tom-test.vizly.fr',
        },
      },
    },
    {
      label: '03 payment-succeeded (Pro mensuel)',
      params: {
        template: 'payment-succeeded',
        to: TO,
        locale: 'fr',
        data: {
          name: 'Tom',
          planName: 'Pro',
          billingPeriod: 'monthly',
          amount: 999,
          currency: 'eur',
          paidAt: today,
          nextBillingDate: addDays(30),
          invoiceNumber: 'INV-0001',
          invoiceUrl: 'https://pay.stripe.com/invoice/test',
        },
      },
    },
    {
      label: '04 plan-changed (upgrade Starter → Pro mensuel, immediate)',
      params: {
        template: 'plan-changed',
        to: TO,
        locale: 'fr',
        data: {
          name: 'Tom',
          previousPlanName: 'Starter',
          newPlanName: 'Pro',
          changeType: 'upgrade',
          newAmount: 999,
          currency: 'eur',
          newBillingPeriod: 'monthly',
          effectiveDate: today,
          isImmediate: true,
          nextBillingDate: addDays(30),
        },
      },
    },
    {
      label: '05 plan-changed (downgrade Pro → Starter, scheduled)',
      params: {
        template: 'plan-changed',
        to: TO,
        locale: 'fr',
        data: {
          name: 'Tom',
          previousPlanName: 'Pro',
          newPlanName: 'Starter',
          changeType: 'downgrade',
          newAmount: 499,
          currency: 'eur',
          newBillingPeriod: 'monthly',
          effectiveDate: addDays(15),
          isImmediate: false,
          nextBillingDate: addDays(45),
        },
      },
    },
    {
      label: '06 billing-period-changed (mensuel → annuel, immediate)',
      params: {
        template: 'billing-period-changed',
        to: TO,
        locale: 'fr',
        data: {
          name: 'Tom',
          planName: 'Pro',
          previousBillingPeriod: 'monthly',
          newBillingPeriod: 'yearly',
          newAmount: 10190,
          currency: 'eur',
          effectiveDate: today,
          isImmediate: true,
          nextBillingDate: addYears(1),
        },
      },
    },
    {
      label: '07 billing-period-changed (annuel → mensuel, scheduled)',
      params: {
        template: 'billing-period-changed',
        to: TO,
        locale: 'fr',
        data: {
          name: 'Tom',
          planName: 'Pro',
          previousBillingPeriod: 'yearly',
          newBillingPeriod: 'monthly',
          newAmount: 999,
          currency: 'eur',
          effectiveDate: addDays(30),
          isImmediate: false,
          nextBillingDate: addDays(60),
        },
      },
    },
    {
      label: '08 payment-failed (Pro mensuel, grace +7j)',
      params: {
        template: 'payment-failed',
        to: TO,
        locale: 'fr',
        data: {
          name: 'Tom',
          planName: 'Pro',
          amount: 999,
          currency: 'eur',
          attemptedAt: today,
          nextAttemptDate: addDays(3),
          gracePeriodEndDate: addDays(7),
        },
      },
    },
    {
      label: '09 subscription-cancelled (Pro, scheduled)',
      params: {
        template: 'subscription-cancelled',
        to: TO,
        locale: 'fr',
        data: {
          name: 'Tom',
          previousPlanName: 'Pro',
          effectiveDate: addDays(15),
        },
      },
    },
    {
      label: '10 renewal-reminder (Pro annuel, J+7)',
      params: {
        template: 'renewal-reminder',
        to: TO,
        locale: 'fr',
        data: {
          name: 'Tom',
          planName: 'Pro',
          billingPeriod: 'yearly',
          amount: 10190,
          currency: 'eur',
          renewalDate: addDays(7),
        },
      },
    },
  ]

  console.log(
    `[Test] Sending ${tests.length} emails to ${TO} via ${process.env.NEXT_PUBLIC_APP_URL}\n`,
  )

  let okCount = 0
  let failCount = 0

  for (const { label, params } of tests) {
    const result = await sendEmail(params)
    if (result.ok) {
      okCount++
      console.log(`[Test] OK   ${label} → id=${result.id}`)
    } else {
      failCount++
      console.error(`[Test] FAIL ${label} → ${result.error}`)
    }
    // Petit délai entre les envois pour rester poli avec l'API Resend.
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  console.log(`\n[Test] Done. ok=${okCount} fail=${failCount}`)
  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('[Test] Fatal:', err)
  process.exit(1)
})
