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
