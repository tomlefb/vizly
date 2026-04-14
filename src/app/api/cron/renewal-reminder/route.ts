/**
 * Daily cron endpoint — fires renewal-reminder emails for yearly subs
 * whose current_period_end falls in the J-7 window.
 *
 * Triggered by the Railway service `vizly-cron` (a tiny Alpine + curl
 * service that POSTs to this endpoint daily at 8h UTC). See
 * infra/cron-renewal-reminder/Dockerfile for the trigger setup and the
 * Bloc 7 instructions for Railway dashboard config.
 *
 * Auth: requires header `X-Cron-Secret` matching env var CRON_SECRET.
 * Both the Vizly Next.js service and the vizly-cron service share the
 * same secret (256-bit hex generated via openssl rand -hex 32).
 *
 * Filters applied to candidate users:
 *   1. plan in ('starter', 'pro') AND stripe_subscription_id IS NOT NULL
 *   2. Stripe subscription.status === 'active'
 *   3. Stripe subscription.cancel_at_period_end !== true (no reminder
 *      for users already scheduled to cancel — they don't need a nudge)
 *   4. Subscription interval === 'yearly' (monthly subs don't get J-7
 *      reminders — that would be spam)
 *   5. current_period_end falls in [now + 6.5 days, now + 7.5 days]
 *      (window absorbs Railway cron drift of "a few minutes")
 *
 * Idempotence: atomic UPDATE last_renewal_reminder_sent_at WHERE NULL
 * OR < now() - 6 days. The 6-day cooldown allows the column to naturally
 * reset for next year's renewal cycle.
 *
 * TODO Phase 2 (after ~500 paid yearly users): optimise to avoid 1 Stripe
 * API call per scanned user. Add a column users.subscription_period_end
 * timestamptz that the webhook handler updates on every customer.subscription.*
 * event, then query directly:
 *   .from('users')
 *   .select(...)
 *   .gte('subscription_period_end', '2026-04-21')  // now + 6.5d
 *   .lte('subscription_period_end', '2026-04-22')  // now + 7.5d
 *   .eq('billing_period', 'yearly')
 * At ~1000 paid yearly users this avoids ~1000 Stripe API calls per
 * cron run (rate limit is 100/sec by default, so ~10s saved).
 */

import { type NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { getPlanAndIntervalFromPriceId } from '@/lib/stripe/prices'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/emails/send'

/** Convert a Stripe Unix timestamp (seconds) to YYYY-MM-DD UTC. */
function toIsoDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 10)
}

const SIX_AND_HALF_DAYS_SEC = 6.5 * 24 * 60 * 60
const SEVEN_AND_HALF_DAYS_SEC = 7.5 * 24 * 60 * 60
const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000

export async function POST(request: NextRequest) {
  // 1. Auth: verify the cron secret header
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret) {
    console.error('[Cron Renewal] CRON_SECRET env var not set')
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 })
  }
  const providedSecret = request.headers.get('x-cron-secret')
  if (providedSecret !== expectedSecret) {
    console.warn('[Cron Renewal] Invalid or missing cron secret')
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // 2. Query candidate users: paid plans with an active sub
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, name, plan, stripe_subscription_id')
    .in('plan', ['starter', 'pro'])
    .not('stripe_subscription_id', 'is', null)

  if (usersError) {
    console.error('[Cron Renewal] User query failed:', usersError.message)
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  let scanned = 0
  let fired = 0
  let errors = 0

  const nowSec = Math.floor(Date.now() / 1000)
  const sixDaysAgoIso = new Date(Date.now() - SIX_DAYS_MS).toISOString()

  for (const user of users ?? []) {
    scanned++

    if (!user.stripe_subscription_id || !user.email) continue

    try {
      // 3. Fetch subscription from Stripe
      const subscription = await stripe.subscriptions.retrieve(
        user.stripe_subscription_id,
      )

      // 4. Filter: must be active and not scheduled to cancel
      if (subscription.status !== 'active') continue
      if (subscription.cancel_at_period_end === true) continue

      const item = subscription.items.data[0]
      if (!item) continue

      const priceId = item.price.id
      const mapping = getPlanAndIntervalFromPriceId(priceId)
      if (!mapping) continue

      // 5. Filter: yearly only
      if (mapping.interval !== 'yearly') continue

      // 6. Filter: current_period_end falls in the J-7 window
      const periodEnd = item.current_period_end
      if (!periodEnd) continue

      const renewsInSec = periodEnd - nowSec
      if (
        renewsInSec < SIX_AND_HALF_DAYS_SEC ||
        renewsInSec > SEVEN_AND_HALF_DAYS_SEC
      ) {
        continue
      }

      // 7. Atomic claim: UPDATE last_renewal_reminder_sent_at WHERE
      //    column IS NULL OR < 6 days ago. The 6-day cooldown prevents
      //    double-send within the same calendar day if cron drift causes
      //    a re-run, while still allowing next year's renewal to fire.
      //
      //    PostgREST .or() syntax: comma-separated conditions, the whole
      //    thing combined as an OR.
      const { data: claimed, error: claimError } = await supabase
        .from('users')
        .update({ last_renewal_reminder_sent_at: new Date().toISOString() })
        .eq('id', user.id)
        .or(
          `last_renewal_reminder_sent_at.is.null,last_renewal_reminder_sent_at.lt.${sixDaysAgoIso}`,
        )
        .select('id')
        .maybeSingle()

      if (claimError) {
        console.error(
          `[Cron Renewal] Claim failed for user=${user.id}:`,
          claimError.message,
        )
        errors++
        continue
      }

      if (!claimed) {
        // Already sent within 6 days — skip silently
        continue
      }

      // 8. Fire the email
      const result = await sendEmail({
        template: 'renewal-reminder',
        to: user.email,
        data: {
          name: user.name ?? '',
          planName: mapping.plan === 'pro' ? 'Pro' : 'Starter',
          billingPeriod: 'yearly',
          amount: item.price.unit_amount ?? 0,
          currency: item.price.currency,
          renewalDate: toIsoDate(periodEnd),
        },
      })

      if (!result.ok) {
        console.error(
          `[Cron Renewal] Email failed for user=${user.id}:`,
          result.error,
        )
        errors++
        continue
      }

      fired++
      console.log(
        `[Cron Renewal] Sent to ${user.email} (renewal ${toIsoDate(periodEnd)})`,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error'
      console.error(`[Cron Renewal] Error for user=${user.id}:`, message)
      errors++
    }
  }

  console.log(
    `[Cron Renewal] scanned=${scanned} fired=${fired} errors=${errors}`,
  )

  return NextResponse.json({ scanned, fired, errors }, { status: 200 })
}
