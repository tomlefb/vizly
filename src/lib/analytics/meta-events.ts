import 'server-only'

import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendCapiEvent,
  type MetaCapiCustomData,
  type MetaCapiUserData,
} from './meta-capi'

/**
 * High-level Meta conversion fire helpers, one per event kind we track.
 *
 * Each helper:
 *   1. Atomically claims an idempotency flag on the user row
 *      (capi_*_fired_at IS NULL + UPDATE), so an event fires at most
 *      once per user even under retries or double-submits.
 *   2. Sends the server-side Conversions API event.
 *   3. Returns the generated event_id so the caller can forward it to
 *      the client-side Pixel for dedup (same event_id = one event in
 *      Meta's reporting).
 *
 * All failures are swallowed — tracking is best-effort and must never
 * break a user-facing flow.
 */

type FireResult =
  | { fired: true; eventId: string; eventName: string; params: MetaCapiCustomData }
  | { fired: false; reason: 'already_fired' | 'claim_failed' | 'config_missing' | 'missing_user' }

interface FireRegistrationInput {
  userId: string
  email?: string
  eventSourceUrl: string
  ipAddress?: string
  userAgent?: string
  fbp?: string
  fbc?: string
}

interface FireStartTrialInput {
  userId: string
  email?: string
  eventSourceUrl: string
  ipAddress?: string
  userAgent?: string
  fbp?: string
  fbc?: string
}

interface FireSubscribeInput {
  userId: string
  email?: string
  value: number
  currency: string
  stripeSessionOrSubId: string
  eventSourceUrl: string
}

/**
 * Atomic claim pattern: UPDATE ... SET flag = now() WHERE id = $1 AND
 * flag IS NULL. Returns the row if the claim succeeded, null if the
 * flag was already set (i.e. another request already fired this event).
 */
async function claimFlag(
  userId: string,
  column: 'capi_registration_fired_at' | 'capi_start_trial_fired_at' | 'capi_subscribe_fired_at',
): Promise<{ claimed: boolean; email: string | null }> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await admin
    .from('users')
    .update({ [column]: now })
    .eq('id', userId)
    .is(column, null)
    .select('email')
    .maybeSingle()

  if (error) {
    console.error('[META_CAPI] claim flag failed', { userId, column, error: error.message })
    return { claimed: false, email: null }
  }

  if (!data) return { claimed: false, email: null }
  return { claimed: true, email: data.email ?? null }
}

function buildUserData(
  userId: string,
  email: string | undefined,
  ctx: { ipAddress?: string; userAgent?: string; fbp?: string; fbc?: string },
): MetaCapiUserData {
  return {
    email,
    externalId: userId,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    fbp: ctx.fbp,
    fbc: ctx.fbc,
  }
}

export async function fireMetaRegistration(input: FireRegistrationInput): Promise<FireResult> {
  const claim = await claimFlag(input.userId, 'capi_registration_fired_at')
  if (!claim.claimed) {
    return { fired: false, reason: 'already_fired' }
  }

  const eventId = crypto.randomUUID()
  const params: MetaCapiCustomData = { content_name: 'vizly_signup' }
  const email = input.email ?? claim.email ?? undefined

  await sendCapiEvent({
    eventName: 'CompleteRegistration',
    eventId,
    userData: buildUserData(input.userId, email, input),
    customData: params,
    eventSourceUrl: input.eventSourceUrl,
    actionSource: 'website',
  })

  return { fired: true, eventId, eventName: 'CompleteRegistration', params }
}

export async function fireMetaStartTrial(input: FireStartTrialInput): Promise<FireResult> {
  const claim = await claimFlag(input.userId, 'capi_start_trial_fired_at')
  if (!claim.claimed) {
    return { fired: false, reason: 'already_fired' }
  }

  const eventId = crypto.randomUUID()
  const params: MetaCapiCustomData = { content_name: 'vizly_first_portfolio' }
  const email = input.email ?? claim.email ?? undefined

  await sendCapiEvent({
    eventName: 'StartTrial',
    eventId,
    userData: buildUserData(input.userId, email, input),
    customData: params,
    eventSourceUrl: input.eventSourceUrl,
    actionSource: 'website',
  })

  return { fired: true, eventId, eventName: 'StartTrial', params }
}

export async function fireMetaSubscribe(input: FireSubscribeInput): Promise<FireResult> {
  const claim = await claimFlag(input.userId, 'capi_subscribe_fired_at')
  if (!claim.claimed) {
    return { fired: false, reason: 'already_fired' }
  }

  // Stripe session/subscription id is idempotent and unique — use it as
  // event_id so Meta dedupes even if our webhook is re-invoked.
  const eventId = input.stripeSessionOrSubId
  const params: MetaCapiCustomData = {
    value: input.value,
    currency: input.currency,
    content_name: 'vizly_subscription',
  }
  const email = input.email ?? claim.email ?? undefined

  await sendCapiEvent({
    eventName: 'Subscribe',
    eventId,
    userData: buildUserData(input.userId, email, {}),
    customData: params,
    eventSourceUrl: input.eventSourceUrl,
    actionSource: 'system_generated',
  })

  return { fired: true, eventId, eventName: 'Subscribe', params }
}
