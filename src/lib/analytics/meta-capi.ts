import 'server-only'

import crypto from 'node:crypto'

/**
 * Meta Conversions API (CAPI) server-side sender.
 *
 * Sends events to Meta's Graph API from the server so that conversions
 * are captured even when the client-side Pixel is blocked (ad blockers,
 * Safari ITP, CSP restrictions). Events are deduped by Meta using the
 * pair (event_name, event_id) — the same event_id must be passed to
 * both the client Pixel and this sender for the same logical event.
 *
 * TODO: RGPD — implement cookie consent before scaling Meta Ads spend
 * above ~500€/month. Current behavior sends server-side events for every
 * conversion regardless of client consent. See also meta-pixel.ts.
 */

const PIXEL_ID = '1888871141815691'
const GRAPH_API_VERSION = 'v21.0'

export type MetaCapiEventName =
  | 'PageView'
  | 'CompleteRegistration'
  | 'StartTrial'
  | 'Subscribe'
  | 'Lead'

export type MetaCapiActionSource = 'website' | 'system_generated'

export interface MetaCapiUserData {
  email?: string
  phone?: string
  externalId?: string
  ipAddress?: string
  userAgent?: string
  fbp?: string
  fbc?: string
}

export interface MetaCapiCustomData {
  value?: number
  currency?: string
  content_name?: string
  content_category?: string
  predicted_ltv?: number
}

export interface SendCapiEventInput {
  eventName: MetaCapiEventName
  eventId: string
  eventTime?: number
  userData: MetaCapiUserData
  customData?: MetaCapiCustomData
  eventSourceUrl: string
  actionSource: MetaCapiActionSource
}

export type SendCapiEventResult =
  | { ok: true; eventsReceived: number }
  | { ok: false; error: string; code: 'config' | 'network' | 'api' }

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

function buildUserDataPayload(user: MetaCapiUserData): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (user.email) payload.em = [sha256(normalizeEmail(user.email))]
  if (user.phone) payload.ph = [sha256(normalizePhone(user.phone))]
  if (user.externalId) payload.external_id = [sha256(user.externalId)]
  // IP and UA are NOT hashed (Meta spec).
  if (user.ipAddress) payload.client_ip_address = user.ipAddress
  if (user.userAgent) payload.client_user_agent = user.userAgent
  if (user.fbp) payload.fbp = user.fbp
  if (user.fbc) payload.fbc = user.fbc
  return payload
}

export async function sendCapiEvent(
  input: SendCapiEventInput,
): Promise<SendCapiEventResult> {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN
  if (!accessToken) {
    // Warn in dev, but never throw — missing config must not break user flows.
    console.warn('[META_CAPI] META_CAPI_ACCESS_TOKEN missing, skipping send', {
      eventName: input.eventName,
      eventId: input.eventId,
    })
    return { ok: false, error: 'missing access token', code: 'config' }
  }

  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE
  const eventTime = input.eventTime ?? Math.floor(Date.now() / 1000)

  const eventPayload: Record<string, unknown> = {
    event_name: input.eventName,
    event_time: eventTime,
    event_id: input.eventId,
    action_source: input.actionSource,
    event_source_url: input.eventSourceUrl,
    user_data: buildUserDataPayload(input.userData),
  }
  if (input.customData && Object.keys(input.customData).length > 0) {
    eventPayload.custom_data = input.customData
  }

  const body: Record<string, unknown> = { data: [eventPayload] }
  if (testEventCode) body.test_event_code = testEventCode

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(accessToken)}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const responseText = await response.text().catch(() => '')
      // Log HTTP status + first 200 chars of response body. Meta returns
      // structured error JSON with { error: { code, message } } — safe to
      // log. Never log the request body (contains hashed user data + token
      // in URL if concatenation ever drifts).
      console.error('[META_CAPI] API error', {
        eventName: input.eventName,
        eventId: input.eventId,
        status: response.status,
        bodyPreview: responseText.slice(0, 200),
      })
      return { ok: false, error: `HTTP ${response.status}`, code: 'api' }
    }

    const json = (await response.json().catch(() => ({}))) as {
      events_received?: number
    }
    const eventsReceived = typeof json.events_received === 'number' ? json.events_received : 0

    console.info('[META_CAPI] sent', {
      eventName: input.eventName,
      eventId: input.eventId,
      eventsReceived,
      test: Boolean(testEventCode),
    })

    return { ok: true, eventsReceived }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('[META_CAPI] network error', {
      eventName: input.eventName,
      eventId: input.eventId,
      error: message,
    })
    return { ok: false, error: message, code: 'network' }
  }
}

/**
 * Extract best-effort client context from request headers and cookies.
 * Supabase / Next.js passes the original client info via forwarded
 * headers when running behind Railway's reverse proxy.
 */
export function extractClientContext(headers: Headers, cookies?: {
  get: (name: string) => { value: string } | undefined
}): {
  ipAddress: string | undefined
  userAgent: string | undefined
  fbp: string | undefined
  fbc: string | undefined
} {
  const forwardedFor = headers.get('x-forwarded-for')
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || headers.get('x-real-ip') || undefined
  const userAgent = headers.get('user-agent') ?? undefined
  const fbp = cookies?.get('_fbp')?.value
  const fbc = cookies?.get('_fbc')?.value
  return { ipAddress, userAgent, fbp, fbc }
}
