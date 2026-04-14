import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/emails/send'

/**
 * Auth callback — handles BOTH email confirmation (post-signup) and OAuth
 * Google return. Both flows hit this route with `?code=...` to exchange
 * for a session.
 *
 * In addition to the exchange + onboarding redirect, this route fires the
 * Vizly Welcome custom email exactly ONCE per user, on the first email
 * confirmation. The fire is gated by:
 *   1. provider === 'email' (excludes OAuth Google)
 *   2. atomic UPDATE … WHERE welcome_sent_at IS NULL (excludes re-callback)
 *
 * The atomic update sets the flag BEFORE sending the email — defensive
 * choice. If Resend fails, the user gets no Welcome (logged) but never
 * gets a duplicate. Spam protection > guarantee of delivery.
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

      if (user) {
        // Fire the Welcome custom email if this is the first email
        // confirmation for an email/password signup. Sequentially awaited
        // — adds ~200-500ms only on the first callback hit per user, which
        // is acceptable (the user perceives it as part of the redirect).
        await maybeSendWelcome(user, supabase)

        // Existing onboarding logic — redirect to /editor if no portfolio
        if (next === '/dashboard') {
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
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}

/**
 * Fire the Welcome email if this is the first email confirmation for an
 * email/password signup. Silent on all skip paths (OAuth, missing email,
 * already sent, send error) — never blocks the redirect.
 */
async function maybeSendWelcome(
  user: { id: string; email?: string; app_metadata?: { provider?: string } },
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  // Guard 1: only fire for email/password signups, never OAuth.
  // OAuth users (Google, etc.) have provider='google' and skip Welcome
  // entirely as a product decision.
  if (user.app_metadata?.provider !== 'email') {
    console.log(
      `[Auth Callback] Welcome skipped — provider=${user.app_metadata?.provider ?? 'unknown'} (userId=${user.id})`,
    )
    return
  }

  // Guard 2: defensive — should never happen after a successful
  // exchangeCodeForSession, but TS narrows email to optional.
  if (!user.email) {
    console.error(
      `[Auth Callback] User has no email, cannot send Welcome (userId=${user.id})`,
    )
    return
  }

  // Atomic claim: UPDATE … WHERE welcome_sent_at IS NULL. If 0 rows are
  // returned, someone (or another concurrent callback request) has already
  // claimed the lock — skip without firing. If 1 row is returned, we have
  // the lock and the flag is now set.
  //
  // The flag is set BEFORE sending the email (vs after success) on
  // purpose: spam protection trumps delivery guarantee. A rare Resend
  // failure leaves a user without a Welcome (acceptable, logged), but
  // never produces duplicates.
  const { data: claimed, error: claimError } = await supabase
    .from('users')
    .update({ welcome_sent_at: new Date().toISOString() })
    .eq('id', user.id)
    .is('welcome_sent_at', null)
    .select('name')
    .maybeSingle()

  if (claimError) {
    console.error(
      `[Auth Callback] Welcome claim failed (userId=${user.id}):`,
      claimError.message,
    )
    return
  }

  if (!claimed) {
    console.log(
      `[Auth Callback] Welcome already sent, skipping (userId=${user.id})`,
    )
    return
  }

  // We hold the lock — fire the email. Failure is logged but doesn't
  // throw (sendEmail returns { ok: false } on errors, never throws).
  const result = await sendEmail({
    template: 'welcome',
    to: user.email,
    data: { name: claimed.name ?? '' },
  })

  if (!result.ok) {
    console.error(
      `[Auth Callback] Welcome email failed for ${user.email} (userId=${user.id}):`,
      result.error,
    )
    return
  }

  console.log(
    `[Auth Callback] Welcome fired for ${user.email} (userId=${user.id})`,
  )
}
