// =============================================================================
// webhook-helpers.ts — Stripe webhook DB sync helpers
// =============================================================================
// Pure helpers shared by handleSubscriptionCreated, handleSubscriptionUpdated,
// handleCheckoutCompleted (legacy mode=subscription branch) and
// handleInvoicePaid in src/app/api/webhooks/stripe/route.ts. Centralizes:
//
//   - mapStripeSubscriptionToRow: Stripe.Subscription → subscriptions row
//   - resolvePlanOrLogUnknown: priceId → plan/interval, with a structured
//     UNKNOWN PRICE_ID log on miss (TODO post-chantier: alert via Sentry)
//   - resolveUserIdForSubscription: 3-layer lookup (metadata → local table
//     → legacy users.stripe_subscription_id) for the migration window
//
// Convention dahlia note: `current_period_start` and `current_period_end`
// were moved from Subscription top-level to SubscriptionItem level in a
// recent API revision. This module reads them from items.data[0], which
// is safe because Vizly subscriptions always have exactly one item (one
// plan = one price). Verified against node_modules/stripe/esm/resources/
// SubscriptionItems.d.ts on stripe@22.0.1 / API 2026-03-25.dahlia.
//
// onConflict='user_id' note: the local subscriptions table enforces
// `user_id UNIQUE`, so there's at most one row per user — the row reflects
// the current state of their latest subscription (active OR canceled).
// When a user re-subscribes after cancellation, the upsert REPLACES the
// row entirely. We do NOT keep historical sub rows in this table — Stripe
// Dashboard is the source of truth for full history. See
// STRIPE_MIGRATION_NOTES.md "Phase 3 — onConflict resolution".

import type Stripe from 'stripe'
import type { TablesInsert } from '@/lib/supabase/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanAndIntervalFromPriceId } from './prices'

// ---------------------------------------------------------------------------
// resolvePlanOrLogUnknown
// ---------------------------------------------------------------------------

/**
 * Wrap getPlanAndIntervalFromPriceId with a structured `UNKNOWN PRICE_ID`
 * console.error on miss. The error level (not warn) is intentional: it
 * lets a future Sentry/Logtail integration alert on the prefix
 * `[stripe webhook] UNKNOWN PRICE_ID` so we catch legacy or manually-created
 * prices missing from prices.ts before they cause silent state drift.
 *
 * Returns null on miss — callers should bail out cleanly (return without
 * throw) so the webhook still consumes the event with status 200. The DB
 * is just not synced for that one event, which is acceptable for unknown
 * prices (almost certainly admin-created or legacy non-Vizly prices).
 *
 * TODO post-chantier: configure Sentry/Logtail alert on
 * `[stripe webhook] UNKNOWN PRICE_ID` to detect missing prices in prod.
 */
export function resolvePlanOrLogUnknown(
  priceId: string,
  context: { eventId: string; subscriptionId: string },
): { plan: 'starter' | 'pro'; interval: 'monthly' | 'yearly' } | null {
  const mapping = getPlanAndIntervalFromPriceId(priceId)
  if (!mapping) {
    console.error(
      `[stripe webhook] UNKNOWN PRICE_ID: ${priceId} — skipping local sync. ` +
        `Event: ${context.eventId}, Subscription: ${context.subscriptionId}. ` +
        `This indicates either a legacy price missing from prices.ts or a ` +
        `test price created manually in the Stripe Dashboard.`,
    )
    return null
  }
  return mapping
}

// ---------------------------------------------------------------------------
// mapStripeSubscriptionToRow
// ---------------------------------------------------------------------------

/**
 * Convert a Stripe.Subscription (as received from a webhook event or
 * stripe.subscriptions.retrieve) into a row shaped for the local
 * `subscriptions` table.
 *
 * Returns null if either:
 *   - The subscription has no items (defensive — should never happen)
 *   - The price ID is not in our prices.ts mapping (UNKNOWN PRICE_ID path)
 *
 * Caller must check for null and handle it (typically: log + return,
 * letting the webhook respond 200 because the failure is observability,
 * not a transient error to retry).
 */
export function mapStripeSubscriptionToRow(
  subscription: Stripe.Subscription,
  userId: string,
  context: { eventId: string },
): TablesInsert<'subscriptions'> | null {
  const item = subscription.items.data[0]
  if (!item) {
    console.error(
      `[stripe webhook] Subscription ${subscription.id} has no items ` +
        `(event ${context.eventId}) — skipping local sync`,
    )
    return null
  }

  const mapping = resolvePlanOrLogUnknown(item.price.id, {
    eventId: context.eventId,
    subscriptionId: subscription.id,
  })
  if (!mapping) return null

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

  // dahlia: current_period_start/end live on SubscriptionItem, not on
  // Subscription top-level. Vizly has exactly one item per sub, so
  // items.data[0] is canonical. See file header for the API version note.
  return {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    status: subscription.status,
    plan: mapping.plan,
    interval: mapping.interval,
    current_period_start: item.current_period_start
      ? new Date(item.current_period_start * 1000).toISOString()
      : null,
    current_period_end: item.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
  }
}

// ---------------------------------------------------------------------------
// resolveUserIdForSubscription
// ---------------------------------------------------------------------------

/**
 * Find the Vizly user ID associated with a Stripe Subscription via 3
 * cascading lookups:
 *
 *   1. subscription.metadata.userId — the canonical path. Set by both the
 *      legacy createSubscriptionCheckout and the new
 *      createSubscriptionWithPaymentIntent helpers.
 *
 *   2. Local subscriptions table by stripe_subscription_id — populated
 *      starting at Phase 3 by the webhook handlers themselves. Used when
 *      metadata is missing (e.g. subs created manually in Stripe Dashboard).
 *
 *   3. Legacy users.stripe_subscription_id — still set by the old flow
 *      until Phase 6 cuts it over. Removed in Phase 6 cleanup.
 *
 * Returns null if all three layers fail. The caller should throw to
 * trigger a 500 retry by Stripe — losing track of a user means we can't
 * credit their account and we must not silently 200.
 */
export async function resolveUserIdForSubscription(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createAdminClient>,
): Promise<string | null> {
  // Layer 1: subscription metadata (canonical)
  const fromMetadata = subscription.metadata?.userId
  if (fromMetadata) return fromMetadata

  // Layer 2: local subscriptions table (Phase 3+ source of truth)
  const { data: localSub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()
  if (localSub?.user_id) return localSub.user_id

  // Layer 3: legacy users.stripe_subscription_id (pre-Phase 6 fallback)
  const { data: legacyUser } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()
  return legacyUser?.id ?? null
}
