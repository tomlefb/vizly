import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fireMetaRegistration } from '@/lib/analytics/meta-events'
import { extractClientContext } from '@/lib/analytics/meta-capi'

/**
 * OAuth Google return handler. Exchanges the provider code for a
 * Supabase session, then redirects to the `next` query param
 * (defaulting to /dashboard). Google users don't receive the Vizly
 * Welcome email.
 *
 * First-time users land on /dashboard with an empty state + the
 * onboarding tour — same experience as a fresh email signup. We used
 * to bounce them straight to /editor, but that skipped the onboarding.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'

  // Derrière le reverse proxy Railway, request.url contient l'URL
  // interne du container (http://localhost:3000) — inutilisable pour
  // le redirect final. On reconstruit l'origin public à partir des
  // en-têtes forwarded, avec fallback sur NEXT_PUBLIC_APP_URL si pour
  // une raison quelconque aucun en-tête n'est présent.
  const forwardedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin)

  // Open-redirect protection: only accept same-origin relative paths.
  // Rejects absolute URLs (http://evil.com) and protocol-relative ones
  // (//evil.com), falling back to /dashboard.
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//')
    ? rawNext
    : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Meta Ads tracking: fire CompleteRegistration for first-time
      // OAuth signups. The atomic claim inside fireMetaRegistration
      // guarantees it only fires once per user (idempotent on login
      // after the initial signup). The returned event_id is relayed
      // via a query param so the dashboard can fire the Pixel with
      // the same id for dedup.
      let metaRelay = ''
      if (data.user) {
        try {
          const cookieJar: { get: (name: string) => { value: string } | undefined } = {
            get: (name) => {
              const match = request.headers.get('cookie')?.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
              return match ? { value: decodeURIComponent(match[1] ?? '') } : undefined
            },
          }
          const { ipAddress, userAgent, fbp, fbc } = extractClientContext(
            request.headers,
            cookieJar,
          )
          const result = await fireMetaRegistration({
            userId: data.user.id,
            email: data.user.email,
            eventSourceUrl: `${origin}/auth/callback`,
            ipAddress,
            userAgent,
            fbp,
            fbc,
          })
          if (result.fired) {
            metaRelay = `?meta=CompleteRegistration:${result.eventId}`
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'unknown'
          console.error('[META_CAPI] OAuth fire threw', { error: message })
        }
      }
      const separator = metaRelay ? (next.includes('?') ? '&' : '?') : ''
      const relayQs = metaRelay
        ? `${separator}${metaRelay.slice(1)}`
        : ''
      return NextResponse.redirect(`${origin}${next}${relayQs}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
