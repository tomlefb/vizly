import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * OAuth Google return handler. Exchanges the provider code for a
 * Supabase session, then redirects to /editor (if the user has no
 * portfolio yet) or to the `next` query param (defaulting to
 * /dashboard). Google users don't receive the Vizly Welcome email.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'

  // Open-redirect protection: only accept same-origin relative paths.
  // Rejects absolute URLs (http://evil.com) and protocol-relative ones
  // (//evil.com), falling back to /dashboard.
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//')
    ? rawNext
    : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // First-time user detection: a dashboard-bound user (even with
      // ?plan=&interval= from the pricing CTA) with no portfolio yet
      // is bounced to the editor to create one before anything else.
      if (user && next.startsWith('/dashboard')) {
        const { data: portfolio } = await supabase
          .from('portfolios')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (!portfolio) {
          return NextResponse.redirect(`${origin}/editor`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
