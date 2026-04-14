'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
 * Server-side entry point for signup. Validates input defensively,
 * calls supabase.auth.signUp, and returns a structured result. Used by
 * src/app/(auth)/register/page.tsx.
 *
 * Supabase sends the "Confirm signup" email automatically (template
 * configured in the Supabase dashboard). The user clicks the link in
 * that email, which lands on /auth/callback where we exchange the code
 * for a session (see src/app/(auth)/auth/callback/route.ts).
 *
 * NOTE (Bloc 4): this function creates the auth user but does NOT send
 * the Vizly custom Welcome email. The Welcome email is deferred until
 * the user has clicked the confirmation link and their email is
 * actually verified. The trigger point for Welcome is audited in Bloc 2
 * (route callback vs DB trigger vs auth webhook) and wired in Bloc 4.
 *
 * Client-side validation still runs in register/page.tsx for instant
 * UX feedback with localized messages. The Zod check here is a
 * defensive safety net in case of a direct server action call that
 * bypasses the form.
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vizly.fr'

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.name },
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    })

    if (error) {
      // Preserve the existing substring-match behaviour so the client
      // keeps its localised "already registered" handling.
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

    console.log(`[Auth] User registered: ${data.user.id}`)
    return { ok: true, userId: data.user.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue'
    console.error('[Auth] Unexpected signup error:', message)
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
