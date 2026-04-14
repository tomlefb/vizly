'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/emails/send'
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

    console.log(`[Auth OTP] Signup initiated, OTP sent: ${data.user.id}`)
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

export type VerifyUserOtpResult =
  | { ok: true; userId: string }
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

    console.log(`[Auth OTP] Verified: ${data.user.id}`)

    // Fire the Welcome email exactly once per user. Guards preserved
    // from the former callback-based implementation: (1) provider must
    // be 'email' to exclude OAuth, (2) atomic UPDATE on welcome_sent_at
    // to exclude duplicates. Failure is logged, never throws.
    await maybeSendWelcome(data.user, supabase)

    return { ok: true, userId: data.user.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue'
    console.error('[Auth OTP] Unexpected verifyOtp error:', message)
    return { ok: false, error: message, code: 'unknown' }
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
    console.log(
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
    console.log(
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

  console.log(
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

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: parsed.data,
    })

    if (error) {
      const message = error.message.toLowerCase()
      if (message.includes('rate limit') || message.includes('too many')) {
        console.log(`[Auth OTP] Resend rate limited for ${parsed.data}`)
        return {
          ok: false,
          error: 'Trop de demandes, reessaie plus tard',
          code: 'rate_limited',
        }
      }
      console.error('[Auth OTP] Resend error:', error.message)
      return { ok: false, error: error.message, code: 'unknown' }
    }

    console.log(`[Auth OTP] Resent OTP to ${parsed.data}`)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue'
    console.error('[Auth OTP] Unexpected resend error:', message)
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

export async function deleteAccount(): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Non authentifie' }
    }

    const admin = createAdminClient()

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
