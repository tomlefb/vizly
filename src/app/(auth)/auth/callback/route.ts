import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth callback — OAuth Google return handler.
 *
 * After the Resend sprint this route also fired the Vizly Welcome
 * email for email/password signups via the confirmation link flow.
 * The OTP refactor moved the email signup flow to `verifyUserOtp`
 * (src/actions/auth.ts) and removed the confirmation link entirely,
 * so this route now only handles OAuth Google redirects.
 *
 * Google users do not receive a Welcome email — product decision
 * carried over from the Resend sprint.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user && next === '/dashboard') {
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
