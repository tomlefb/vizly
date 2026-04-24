/**
 * Meta Pixel client-side helper. All functions are no-op if
 * window.fbq is not loaded (ad blocker, missing NEXT_PUBLIC_META_PIXEL_ID,
 * or SSR). Designed to be safe to call from any client component.
 *
 * TODO: RGPD — implement cookie consent before scaling Meta Ads spend
 * above ~500€/month. Current behavior loads the Pixel on every page,
 * which is not strictly compliant with CNIL guidelines. See also
 * src/lib/analytics/meta-capi.ts.
 */

export type MetaPixelEventName =
  | 'PageView'
  | 'CompleteRegistration'
  | 'StartTrial'
  | 'Subscribe'
  | 'Lead'

export interface MetaPixelEventParams {
  value?: number
  currency?: string
  content_name?: string
  content_category?: string
  status?: string
  predicted_ltv?: number
}

type FbqFn = (
  command: 'track' | 'trackCustom' | 'init' | 'consent',
  eventName: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
) => void

declare global {
  interface Window {
    fbq?: FbqFn
    _fbq?: FbqFn
    vizlyTrack?: (
      eventName: MetaPixelEventName,
      params?: MetaPixelEventParams,
      eventId?: string,
    ) => void
  }
}

/**
 * Relay helper: if a server action returned a `metaEvent`, fire the
 * Pixel with the matching event_id so Meta dedupes the client +
 * server sides. No-op if the result carries no event or fbq is
 * unavailable. Safe to call from any client component.
 */
export function maybeFirePixelFromResult(result: {
  metaEvent?: {
    name: MetaPixelEventName
    id: string
    params: MetaPixelEventParams
  }
}): void {
  if (!result.metaEvent) return
  trackPixelEvent(result.metaEvent.name, result.metaEvent.params, result.metaEvent.id)
}

export function trackPixelEvent(
  eventName: MetaPixelEventName,
  params?: MetaPixelEventParams,
  eventId?: string,
): void {
  if (typeof window === 'undefined') return
  if (typeof window.fbq !== 'function') {
    console.info('[META_PIXEL] fbq unavailable, skipping', { eventName })
    return
  }
  try {
    const payload: Record<string, unknown> | undefined = params
      ? { ...params }
      : undefined
    if (eventId) {
      window.fbq('track', eventName, payload, { eventID: eventId })
    } else {
      window.fbq('track', eventName, payload)
    }
    console.info('[META_PIXEL] tracked', { eventName, eventId: eventId ?? null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('[META_PIXEL] track failed', { eventName, error: message })
  }
}
