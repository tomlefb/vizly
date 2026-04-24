'use server'

import { headers, cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/emails/send'
import { getActionClientIdentifier, rateLimit } from '@/lib/rate-limit'
import { stripe } from '@/lib/stripe/client'
import { extractClientContext } from '@/lib/analytics/meta-capi'
import { fireMetaRegistration } from '@/lib/analytics/meta-events'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const nameSchema = z
  .string()
  .min(1, 'Le nom est requis')
  .max(100, 'Le nom ne peut pas depasser 100 caracteres')

const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas depasser 100 caracteres'),
  email: z.string().email('Adresse email invalide'),
  password: z
    .string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caracteres'),
})

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export type RegisterErrorCode =
  | 'validation'
  | 'already_registered'
  | 'unknown'

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; error: string; code: RegisterErrorCode }

/**
 * Register a new user via Supabase Auth.
 *
 * OTP flow: Supabase sends the "Confirm signup" email containing a
 * 6-digit OTP code ({{ .Token }} in the template). The user types that
 * code into the OTP step of the signup form, which calls verifyUserOtp
 * below to complete the signup. No confirmation link is sent — the
 * emailRedirectTo option is intentionally absent.
 */
export async function registerUser(
  input: RegisterInput,
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      ok: false,
      error: firstIssue?.message ?? 'Donnees invalides',
      code: 'validation',
    }
  }

  const rl = rateLimit(await getActionClientIdentifier(), {
    key: 'register',
    limit: 5,
    windowMs: 10 * 60_000,
  })
  if (!rl.success) {
    return {
      ok: false,
      error: 'Trop de tentatives, reessaie plus tard',
      code: 'unknown',
    }
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.name },
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        return {
          ok: false,
          error: 'Un compte existe deja avec cette adresse',
          code: 'already_registered',
        }
      }
      console.error('[Auth] Signup error:', error.message)
      return { ok: false, error: error.message, code: 'unknown' }
    }

    if (!data.user) {
      console.error('[Auth] Signup returned no user object')
      return {
        ok: false,
        error: 'Erreur inattendue lors de la creation du compte',
        code: 'unknown',
      }
    }

    console.info(`[Auth OTP] Signup initiated, OTP sent: ${data.user.id}`)
    return { ok: true, userId: data.user.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue'
    console.error('[Auth] Unexpected signup error:', message)
    return { ok: false, error: message, code: 'unknown' }
  }
}

// ---------------------------------------------------------------------------
// Verify signup OTP
// ---------------------------------------------------------------------------

const verifyOtpSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  token: z
    .string()
    .regex(/^\d{6}$/, 'Le code doit contenir 6 chiffres'),
})

export interface VerifyUserOtpInput {
  email: string
  token: string
}

export type VerifyOtpErrorCode =
  | 'validation'
  | 'invalid_token'
  | 'rate_limited'
  | 'unknown'

export interface MetaTrackingEvent {
  name: 'CompleteRegistration' | 'StartTrial' | 'Subscribe'
  id: string
  params: {
    value?: number
    currency?: string
    content_name?: string
    content_category?: string
  }
}

export type VerifyUserOtpResult =
  | { ok: true; userId: string; metaEvent?: MetaTrackingEvent }
  | { ok: false; error: string; code: VerifyOtpErrorCode }

/**
 * Verify the 6-digit OTP code sent during signup and activate the
 * account. On success, also fires the Vizly Welcome custom email
 * exactly once per user (atomic claim via welcome_sent_at flag).
 *
 * Note on OTP type: the Supabase SDK types list 'signup' as deprecated.
 * The canonical type for verifying an email OTP during sign-up or
 * sign-in is 'email'.
 */
export async function verifyUserOtp(
  input: VerifyUserOtpInput,
): Promise<VerifyUserOtpResult> {
  const parsed = verifyOtpSchema.safeParse(input)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      ok: false,
      error: firstIssue?.message ?? 'Donnees invalides',
      code: 'validation',
    }
  }

  const rl = rateLimit(await getActionClientIdentifier(), {
    key: 'verify-otp-signup',
    limit: 10,
    windowMs: 15 * 60_000,
  })
  if (!rl.success) {
    return {
      ok: false,
      error: 'Trop de tentatives, reessaie plus tard',
      code: 'rate_limited',
    }
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.token,
      type: 'email',
    })

    if (error) {
      // Log the raw Supabase error message regardless of mapping so
      // we can verify empirically how Supabase phrases each failure.
      console.error(
        `[Auth OTP] verifyOtp raw error for ${parsed.data.email}: "${error.message}"`,
      )
      const message = error.message.toLowerCase()
      // Rate limiting is reliably distinct — keep it separate.
      if (message.includes('rate limit') || message.includes('too many')) {
        return {
          ok: false,
          error: 'Trop de tentatives, reessaie plus tard',
          code: 'rate_limited',
        }
      }
      // Supabase conflates invalid and expired tokens into a single
      // message ("Token has expired or is invalid") to prevent token
      // enumeration. Fold both into invalid_token with a unified UX.
      return {
        ok: false,
        error: 'Code invalide ou expire',
        code: 'invalid_token',
      }
    }

    if (!data.user) {
      console.error('[Auth OTP] verifyOtp returned no user object')
      return {
        ok: false,
        error: 'Erreur inattendue lors de la verification',
        code: 'unknown',
      }
    }

    console.info(`[Auth OTP] Verified: ${data.user.id}`)

    // Fire the Welcome email exactly once per user. Guards preserved
    // from the former callback-based implementation: (1) provider must
    // be 'email' to exclude OAuth, (2) atomic UPDATE on welcome_sent_at
    // to exclude duplicates. Failure is logged, never throws.
    await maybeSendWelcome(data.user, supabase)

    // Meta Ads tracking: fire CompleteRegistration on first OTP verify.
    // fireMetaRegistration uses an atomic claim, so double-submits or
    // retries fire at most once per user. The returned event_id is
    // relayed to the client so the Pixel fires with the same id and
    // Meta dedupes server + client sides.
    const metaEvent = await tryFireRegistration({
      userId: data.user.id,
      email: data.user.email ?? parsed.data.email,
    })

    return { ok: true, userId: data.user.id, ...(metaEvent ? { metaEvent } : {}) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue'
    console.error('[Auth OTP] Unexpected verifyOtp error:', message)
    return { ok: false, error: message, code: 'unknown' }
  }
}

async function tryFireRegistration(args: {
  userId: string
  email?: string
}): Promise<MetaTrackingEvent | undefined> {
  try {
    const hdrs = await headers()
    const ck = await cookies()
    const { ipAddress, userAgent, fbp, fbc } = extractClientContext(hdrs, {
      get: (name) => {
        const c = ck.get(name)
        return c ? { value: c.value } : undefined
      },
    })
    const forwardedHost = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? 'vizly.fr'
    const forwardedProto = hdrs.get('x-forwarded-proto') ?? 'https'
    const eventSourceUrl = `${forwardedProto}://${forwardedHost}/register`

    const result = await fireMetaRegistration({
      userId: args.userId,
      email: args.email,
      eventSourceUrl,
      ipAddress,
      userAgent,
      fbp,
      fbc,
    })
    if (!result.fired) return undefined
    return {
      name: 'CompleteRegistration',
      id: result.eventId,
      params: result.params,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[META_CAPI] fireRegistration threw', { error: message })
    return undefined
  }
}

/**
 * Fire the Welcome email if this is the first email confirmation for
 * an email/password signup. Silent on all skip paths (OAuth, missing
 * email, already sent, send error). Never throws.
 *
 * The welcome_sent_at flag is set BEFORE sending the email: spam
 * protection trumps delivery guarantee. A rare Resend failure leaves
 * a user without a Welcome (acceptable, logged) but never produces
 * duplicates.
 */
async function maybeSendWelcome(
  user: { id: string; email?: string; app_metadata?: { provider?: string } },
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  if (user.app_metadata?.provider !== 'email') {
    console.info(
      `[Auth OTP] Welcome skipped — provider=${user.app_metadata?.provider ?? 'unknown'} (userId=${user.id})`,
    )
    return
  }

  if (!user.email) {
    console.error(
      `[Auth OTP] User has no email, cannot send Welcome (userId=${user.id})`,
    )
    return
  }

  const { data: claimed, error: claimError } = await supabase
    .from('users')
    .update({ welcome_sent_at: new Date().toISOString() })
    .eq('id', user.id)
    .is('welcome_sent_at', null)
    .select('name')
    .maybeSingle()

  if (claimError) {
    console.error(
      `[Auth OTP] Welcome claim failed (userId=${user.id}):`,
      claimError.message,
    )
    return
  }

  if (!claimed) {
    console.info(
      `[Auth OTP] Welcome already sent, skipping (userId=${user.id})`,
    )
    return
  }

  const result = await sendEmail({
    template: 'welcome',
    to: user.email,
    data: { name: claimed.name ?? '' },
  })

  if (!result.ok) {
    console.error(
      `[Auth OTP] Welcome email failed for ${user.email} (userId=${user.id}):`,
      result.error,
    )
    return
  }

  console.info(
    `[Auth OTP] Welcome fired for ${user.email} (userId=${user.id})`,
  )
}

// ---------------------------------------------------------------------------
// Resend signup OTP
// ---------------------------------------------------------------------------

const emailSchema = z.string().email('Adresse email invalide')

export type ResendOtpErrorCode = 'validation' | 'rate_limited' | 'unknown'

export type ResendSignupOtpResult =
  | { ok: true }
  | { ok: false; error: string; code: ResendOtpErrorCode }

/**
 * Resend the signup OTP to the given email. Wraps supabase.auth.resend
 * with type 'signup'. Subject to Supabase rate limiting (typically a
 * few attempts per hour per email).
 */
export async function resendSignupOtp(
  email: string,
): Promise<ResendSignupOtpResult> {
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      ok: false,
      error: firstIssue?.message ?? 'Adresse email invalide',
      code: 'validation',
    }
  }

  const rl = rateLimit(await getActionClientIdentifier(), {
    key: 'resend-otp',
    limit: 5,
    windowMs: 15 * 60_000,
  })
  if (!rl.success) {
    return {
      ok: false,
      error: 'Trop de demandes, reessaie plus tard',
      code: 'rate_limited',
    }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: parsed.data,
    })

    if (error) {
      const message = error.message.toLowerCase()
      if (message.includes('rate limit') || message.includes('too many')) {
        console.info(`[Auth OTP] Resend rate limited for ${parsed.data}`)
        return {
          ok: false,
          error: 'Trop de demandes, reessaie plus tard',
          code: 'rate_limited',
        }
      }
      console.error('[Auth OTP] Resend error:', error.message)
      return { ok: false, error: error.message, code: 'unknown' }
    }

    console.info(`[Auth OTP] Resent OTP to ${parsed.data}`)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue'
    console.error('[Auth OTP] Unexpected resend error:', message)
    return { ok: false, error: message, code: 'unknown' }
  }
}

// ---------------------------------------------------------------------------
// Reset password OTP flow
// ---------------------------------------------------------------------------

export type RequestPasswordResetErrorCode =
  | 'validation'
  | 'rate_limited'
  | 'unknown'

export type RequestPasswordResetResult =
  | { ok: true }
  | { ok: false; error: string; code: RequestPasswordResetErrorCode }

/**
 * Trigger the password recovery email for the given address. In OTP
 * mode the email carries a 6-digit code ({{ .Token }}) — no link.
 *
 * Anti-enumeration: Supabase's resetPasswordForEmail does not reveal
 * whether the address exists. We preserve that guarantee by returning
 * ok: true on any non-rate-limit failure (the user sees the generic
 * "if an account exists, you'll receive a code" screen regardless).
 */
export async function requestPasswordReset(
  email: string,
): Promise<RequestPasswordResetResult> {
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      ok: false,
      error: firstIssue?.message ?? 'Adresse email invalide',
      code: 'validation',
    }
  }

  const rl = rateLimit(await getActionClientIdentifier(), {
    key: 'password-reset-request',
    limit: 3,
    windowMs: 15 * 60_000,
  })
  if (!rl.success) {
    // Même enveloppe anti-enumeration : ne révèle pas le rate-limit par IP
    // comme un signal distinct de "email existe", mais cap explicitement
    // l'abus depuis une même source.
    return {
      ok: false,
      error: 'Trop de demandes, reessaie plus tard',
      code: 'rate_limited',
    }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data)

    if (error) {
      console.error(
        `[Auth OTP Reset] resetPasswordForEmail raw error for ${parsed.data}: "${error.message}"`,
      )
      const message = error.message.toLowerCase()
      if (message.includes('rate limit') || message.includes('too many')) {
        return {
          ok: false,
          error: 'Trop de demandes, reessaie plus tard',
          code: 'rate_limited',
        }
      }
      // Swallow every other error to avoid leaking whether the email
      // exists in the database. The user sees a generic success screen.
      console.info(
        `[Auth OTP Reset] Swallowing non-rate-limit error for anti-enumeration`,
      )
      return { ok: true }
    }

    console.info(`[Auth OTP Reset] Recovery OTP sent to ${parsed.data}`)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue'
    console.error('[Auth OTP Reset] Unexpected request error:', message)
    // Same anti-enumeration policy on unexpected failures.
    return { ok: true }
  }
}

export interface VerifyPasswordResetOtpInput {
  email: string
  token: string
}

export type VerifyPasswordResetOtpResult =
  | { ok: true }
  | { ok: false; error: string; code: VerifyOtpErrorCode }

/**
 * Verify the 6-digit recovery OTP. On success, Supabase establishes a
 * recovery session in the cookies of the current request — that
 * session is what allows updateUser({ password }) in the next step.
 *
 * Error mapping mirrors verifyUserOtp: only rate_limited is distinct,
 * all other failures fold into invalid_token with a unified message.
 */
export async function verifyPasswordResetOtp(
  input: VerifyPasswordResetOtpInput,
): Promise<VerifyPasswordResetOtpResult> {
  const parsed = verifyOtpSchema.safeParse(input)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      ok: false,
      error: firstIssue?.message ?? 'Donnees invalides',
      code: 'validation',
    }
  }

  const rl = rateLimit(await getActionClientIdentifier(), {
    key: 'verify-otp-reset',
    limit: 10,
    windowMs: 15 * 60_000,
  })
  if (!rl.success) {
    return {
      ok: false,
      error: 'Trop de tentatives, reessaie plus tard',
      code: 'rate_limited',
    }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.token,
      type: 'recovery',
    })

    if (error) {
      console.error(
        `[Auth OTP Reset] verifyOtp raw error for ${parsed.data.email}: "${error.message}"`,
      )
      const message = error.message.toLowerCase()
      if (message.includes('rate limit') || message.includes('too many')) {
        return {
          ok: false,
          error: 'Trop de tentatives, reessaie plus tard',
          code: 'rate_limited',
        }
      }
      return {
        ok: false,
        error: 'Code invalide ou expire',
        code: 'invalid_token',
      }
    }

    console.info(`[Auth OTP Reset] Recovery verified for ${parsed.data.email}`)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue'
    console.error('[Auth OTP Reset] Unexpected verify error:', message)
    return { ok: false, error: message, code: 'unknown' }
  }
}

const passwordSchema = z
  .string()
  .min(6, 'Le mot de passe doit contenir au moins 6 caracteres')

export type UpdatePasswordErrorCode =
  | 'validation'
  | 'not_authenticated'
  | 'unknown'

export type UpdateUserPasswordResult =
  | { ok: true; sessionFullAfterUpdate: boolean }
  | { ok: false; error: string; code: UpdatePasswordErrorCode }

/**
 * Update the current user's password. Must be called right after a
 * successful verifyPasswordResetOtp so that the recovery session is
 * present in the cookies.
 *
 * Logs getSession() shape before and after the update so we can
 * empirically determine whether the recovery session is promoted to
 * a full session automatically or stays restricted. The result flag
 * sessionFullAfterUpdate is set from that check and drives UX in the
 * client (auto-login vs. signOut + redirect to /login).
 */
export async function updateUserPassword(
  password: string,
): Promise<UpdateUserPasswordResult> {
  const parsed = passwordSchema.safeParse(password)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      ok: false,
      error: firstIssue?.message ?? 'Mot de passe invalide',
      code: 'validation',
    }
  }

  try {
    const supabase = await createClient()

    const { data: sessionBefore } = await supabase.auth.getSession()
    console.info(
      `[Auth OTP Reset] Session before update: present=${!!sessionBefore.session} userId=${sessionBefore.session?.user?.id ?? 'none'}`,
    )

    if (!sessionBefore.session) {
      return {
        ok: false,
        error: 'Session expiree, recommence la procedure',
        code: 'not_authenticated',
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data,
    })

    if (updateError) {
      console.error(
        `[Auth OTP Reset] updateUser raw error: "${updateError.message}"`,
      )
      return {
        ok: false,
        error: updateError.message,
        code: 'unknown',
      }
    }

    const { data: sessionAfter } = await supabase.auth.getSession()
    const sessionFullAfterUpdate = !!sessionAfter.session
    console.info(
      `[Auth OTP Reset] Session after update: present=${sessionFullAfterUpdate} userId=${sessionAfter.session?.user?.id ?? 'none'}`,
    )

    return { ok: true, sessionFullAfterUpdate }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue'
    console.error('[Auth OTP Reset] Unexpected update error:', message)
    return { ok: false, error: message, code: 'unknown' }
  }
}

// ---------------------------------------------------------------------------
// Change email OTP flow (2-step verification)
// ---------------------------------------------------------------------------

export type EmailChangeErrorCode =
  | 'validation'
  | 'same_email'
  | 'email_taken'
  | 'not_authenticated'
  | 'rate_limited'
  | 'unknown'

export type RequestEmailChangeResult =
  | { ok: true }
  | { ok: false; error: string; code: EmailChangeErrorCode }

/**
 * Trigger an email change. With Supabase's "Secure email change"
 * setting enabled (required in Vizly), calling updateUser({ email })
 * sends a 6-digit OTP to BOTH the current email and the new one.
 * The user must verify both via verifyEmailChangeOtp (current then
 * new) to commit the change.
 */
export async function requestEmailChange(
  newEmail: string,
): Promise<RequestEmailChangeResult> {
  const parsed = emailSchema.safeParse(newEmail)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      ok: false,
      error: firstIssue?.message ?? 'Adresse email invalide',
      code: 'validation',
    }
  }

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return {
        ok: false,
        error: 'Non authentifie',
        code: 'not_authenticated',
      }
    }

    if (user.email.toLowerCase() === parsed.data.toLowerCase()) {
      return {
        ok: false,
        error: 'La nouvelle adresse est identique a l\'ancienne',
        code: 'same_email',
      }
    }

    const { error } = await supabase.auth.updateUser({
      email: parsed.data,
    })

    if (error) {
      console.error(
        `[Auth OTP EmailChange] updateUser raw error for ${user.email} -> ${parsed.data}: "${error.message}"`,
      )
      const message = error.message.toLowerCase()
      if (message.includes('rate limit') || message.includes('too many')) {
        return {
          ok: false,
          error: 'Trop de demandes, reessaie plus tard',
          code: 'rate_limited',
        }
      }
      if (
        message.includes('already') ||
        message.includes('in use') ||
        message.includes('taken') ||
        message.includes('registered')
      ) {
        return {
          ok: false,
          error: 'Cette adresse est deja utilisee',
          code: 'email_taken',
        }
      }
      return { ok: false, error: error.message, code: 'unknown' }
    }

    console.info(
      `[Auth OTP EmailChange] Change requested ${user.email} -> ${parsed.data}`,
    )
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue'
    console.error('[Auth OTP EmailChange] Unexpected request error:', message)
    return { ok: false, error: message, code: 'unknown' }
  }
}

export type EmailChangeStage = 'current' | 'new'

export interface VerifyEmailChangeOtpInput {
  email: string
  token: string
  stage: EmailChangeStage
}

export type VerifyEmailChangeOtpResult =
  | { ok: true }
  | { ok: false; error: string; code: VerifyOtpErrorCode }

/**
 * Verify one of the two OTP codes produced by a secure email change.
 * The Supabase SDK exposes a single `email_change` type for both the
 * old-address code and the new-address code; the stage parameter is
 * used only for logging — the SDK determines which code is which by
 * matching the `email` field to the token that was sent there.
 */
export async function verifyEmailChangeOtp(
  input: VerifyEmailChangeOtpInput,
): Promise<VerifyEmailChangeOtpResult> {
  const parsed = verifyOtpSchema.safeParse({
    email: input.email,
    token: input.token,
  })
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      ok: false,
      error: firstIssue?.message ?? 'Donnees invalides',
      code: 'validation',
    }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.token,
      type: 'email_change',
    })

    if (error) {
      console.error(
        `[Auth OTP EmailChange] verifyOtp raw error for ${parsed.data.email} (stage=${input.stage}): "${error.message}"`,
      )
      const message = error.message.toLowerCase()
      if (message.includes('rate limit') || message.includes('too many')) {
        return {
          ok: false,
          error: 'Trop de tentatives, reessaie plus tard',
          code: 'rate_limited',
        }
      }
      return {
        ok: false,
        error: 'Code invalide ou expire',
        code: 'invalid_token',
      }
    }

    console.info(
      `[Auth OTP EmailChange] Stage ${input.stage} verified for ${parsed.data.email}`,
    )
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue'
    console.error('[Auth OTP EmailChange] Unexpected verify error:', message)
    return { ok: false, error: message, code: 'unknown' }
  }
}

// ---------------------------------------------------------------------------
// Update profile (name)
// ---------------------------------------------------------------------------

export async function updateProfile(
  name: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Non authentifie' }
    }

    const parsed = nameSchema.safeParse(name)
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      return { error: firstIssue ? firstIssue.message : 'Nom invalide' }
    }

    const { error } = await supabase
      .from('users')
      .update({ name: parsed.data })
      .eq('id', user.id)

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch {
    return { error: 'Erreur lors de la mise a jour du profil' }
  }
}

// ---------------------------------------------------------------------------
// Delete account (DANGER)
// ---------------------------------------------------------------------------

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function deleteAccount(): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Non authentifie' }
    }

    // Defense-in-depth : l'admin client court-circuite RLS. Avant tout DELETE
    // on refuse d'aller plus loin si l'id n'a pas la forme d'un UUID ou
    // l'email est vide — couvre un getUser() dégénéré.
    if (!UUID_REGEX.test(user.id) || !user.email) {
      console.error('[Auth] Refusing deleteAccount: invalid user context')
      return { error: 'Erreur interne' }
    }

    const admin = createAdminClient()

    // 0. Annulation immédiate de l'abonnement Stripe AVANT le cleanup DB.
    // Sans ça, on garde un stripe_subscription_id actif chez Stripe : le
    // prochain billing cycle déclenche un prélèvement sur une carte liée à
    // un user qui n'existe plus côté Vizly. On release aussi un schedule
    // pending éventuel (downgrade programmé) pour éviter un ghost schedule.
    // Best-effort : on ne bloque pas la suppression si Stripe renvoie une
    // erreur (abo déjà annulé, id invalide, etc) — on log et on continue
    // car l'utilisateur a le droit de partir.
    const { data: subRow } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_schedule_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subRow?.stripe_schedule_id) {
      try {
        await stripe.subscriptionSchedules.release(subRow.stripe_schedule_id)
      } catch (err) {
        console.error('[Auth] Failed to release schedule before account delete:', err)
      }
    }

    if (subRow?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(subRow.stripe_subscription_id)
      } catch (err) {
        console.error('[Auth] Failed to cancel Stripe subscription before account delete:', err)
      }
    }

    // 1. Get portfolio ID(s) to delete related projects
    const { data: portfolios } = await admin
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id)

    if (portfolios && portfolios.length > 0) {
      const portfolioIds = portfolios.map((p) => p.id)

      // 2. Delete projects linked to the user's portfolios
      const { error: projectsError } = await admin
        .from('projects')
        .delete()
        .in('portfolio_id', portfolioIds)

      if (projectsError) {
        console.error('[Auth] Failed to delete projects:', projectsError.message)
        return { error: 'Erreur lors de la suppression des projets' }
      }
    }

    // 3. Delete portfolios
    const { error: portfolioError } = await admin
      .from('portfolios')
      .delete()
      .eq('user_id', user.id)

    if (portfolioError) {
      console.error('[Auth] Failed to delete portfolio:', portfolioError.message)
      return { error: 'Erreur lors de la suppression du portfolio' }
    }

    // 4. Delete purchased templates
    const { error: templatesError } = await admin
      .from('purchased_templates')
      .delete()
      .eq('user_id', user.id)

    if (templatesError) {
      console.error('[Auth] Failed to delete purchased templates:', templatesError.message)
      return { error: 'Erreur lors de la suppression des templates achetes' }
    }

    // 5. Delete user row from the users table
    const { error: userError } = await admin
      .from('users')
      .delete()
      .eq('id', user.id)

    if (userError) {
      console.error('[Auth] Failed to delete user row:', userError.message)
      return { error: 'Erreur lors de la suppression du compte' }
    }

    // 6. Delete the Supabase Auth user (requires service role)
    const { error: authError } = await admin.auth.admin.deleteUser(user.id)

    if (authError) {
      console.error('[Auth] Failed to delete auth user:', authError.message)
      // Non-blocking -- the DB data is already cleaned up
    }

    // 7. Sign out the current session
    await supabase.auth.signOut()

    return { error: null }
  } catch {
    return { error: 'Erreur lors de la suppression du compte' }
  }
}
