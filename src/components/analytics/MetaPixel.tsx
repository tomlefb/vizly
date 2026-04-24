'use client'

import Script from 'next/script'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { trackPixelEvent, type MetaPixelEventName, type MetaPixelEventParams } from '@/lib/analytics/meta-pixel'

const RELAY_EVENT_NAMES: readonly MetaPixelEventName[] = [
  'PageView',
  'CompleteRegistration',
  'StartTrial',
  'Subscribe',
  'Lead',
]

function parseMetaRelay(raw: string): { name: MetaPixelEventName; id: string } | null {
  const [name, id] = raw.split(':')
  if (!name || !id) return null
  if (!RELAY_EVENT_NAMES.includes(name as MetaPixelEventName)) return null
  return { name: name as MetaPixelEventName, id }
}

/**
 * Meta Pixel bootstrap component. Injects the official fbevents.js
 * snippet, fires PageView on every route change, and exposes
 * window.vizlyTrack for ad-hoc events fired from downstream client
 * components (e.g. after a successful signup).
 *
 * Lives in the root layout just before {children} so the Pixel is
 * mounted on every page (marketing + dashboard) but reads its ID at
 * render time. If NEXT_PUBLIC_META_PIXEL_ID is missing (local dev
 * without the env var), the component renders nothing and logs once.
 *
 * TODO: RGPD — implement cookie consent before scaling Meta Ads spend
 * above ~500€/month. Current behavior loads the Pixel unconditionally.
 */
export function MetaPixel() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const hasInit = useRef(false)
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

  useEffect(() => {
    if (!pixelId) return
    if (typeof window === 'undefined') return
    if (typeof window.fbq !== 'function') return
    // Skip the very first PageView: fbq auto-fires one on init via the
    // inline snippet below. Subsequent route changes trigger a manual PV.
    if (!hasInit.current) {
      hasInit.current = true
      return
    }
    trackPixelEvent('PageView')
  }, [pathname, pixelId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.vizlyTrack = (
      eventName: MetaPixelEventName,
      params?: MetaPixelEventParams,
      eventId?: string,
    ) => {
      trackPixelEvent(eventName, params, eventId)
    }
  }, [])

  // Consume the `?meta=EventName:eventId` query param set by the OAuth
  // callback route. Fires the Pixel with the server-generated event_id
  // for dedup, then strips the param from the URL so a reload doesn't
  // re-fire it.
  useEffect(() => {
    if (!pixelId) return
    const raw = searchParams.get('meta')
    if (!raw) return
    const parsed = parseMetaRelay(raw)
    if (parsed) {
      trackPixelEvent(parsed.name, undefined, parsed.id)
    }
    const params = new URLSearchParams(searchParams.toString())
    params.delete('meta')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }, [pathname, searchParams, router, pixelId])

  if (!pixelId) {
    if (typeof window !== 'undefined') {
      console.warn('[META_PIXEL] NEXT_PUBLIC_META_PIXEL_ID missing, Pixel disabled')
    }
    return null
  }

  const snippet = `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
`

  return (
    <>
      <Script
        id="meta-pixel-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: snippet }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
