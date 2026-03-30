'use server'

import { createClient } from '@/lib/supabase/server'
import { projectSchema } from '@/lib/validations'
import type { ProjectFormData } from '@/lib/validations'
import type { Project } from '@/types'

interface ProjectResult {
  data: Project | null
  error: string | null
}

interface ProjectsResult {
  data: Project[]
  error: string | null
}

interface DeleteResult {
  error: string | null
}

async function verifyPortfolioOwnership(
  portfolioId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('portfolios')
    .select('id')
    .eq('id', portfolioId)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  return data !== null
}

async function verifyProjectOwnership(
  projectId: string,
  userId: string
): Promise<string | null> {
  const supabase = await createClient()
  const { data: project } = await supabase
    .from('projects')
    .select('portfolio_id')
    .eq('id', projectId)
    .limit(1)
    .maybeSingle()

  if (!project) return null

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('id')
    .eq('id', project.portfolio_id)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  return portfolio ? project.portfolio_id : null
}

export async function getProjects(
  portfolioId: string
): Promise<ProjectsResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: [], error: 'Non authentifié' }
    }

    const isOwner = await verifyPortfolioOwnership(portfolioId, user.id)
    if (!isOwner) {
      return { data: [], error: 'Accès non autorisé' }
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('display_order', { ascending: true })

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: data ?? [], error: null }
  } catch {
    return { data: [], error: 'Erreur lors de la récupération des projets' }
  }
}

export async function createProject(
  portfolioId: string,
  formData: ProjectFormData
): Promise<ProjectResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Non authentifié' }
    }

    const isOwner = await verifyPortfolioOwnership(portfolioId, user.id)
    if (!isOwner) {
      return { data: null, error: 'Accès non autorisé' }
    }

    const parsed = projectSchema.safeParse(formData)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      return {
        data: null,
        error: firstIssue ? firstIssue.message : 'Données invalides',
      }
    }

    const validData = parsed.data

    const { data, error } = await supabase
      .from('projects')
      .insert({
        portfolio_id: portfolioId,
        title: validData.title,
        description: validData.description || null,
        images: validData.images,
        external_link: validData.external_link || null,
        tags: validData.tags,
        display_order: validData.display_order,
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch {
    return { data: null, error: 'Erreur lors de la création du projet' }
  }
}

export async function updateProject(
  projectId: string,
  formData: Partial<ProjectFormData>
): Promise<ProjectResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Non authentifié' }
    }

    const portfolioId = await verifyProjectOwnership(projectId, user.id)
    if (!portfolioId) {
      return { data: null, error: 'Accès non autorisé' }
    }

    // Validate only the provided fields using partial schema
    const partialSchema = projectSchema.partial()
    const parsed = partialSchema.safeParse(formData)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      return {
        data: null,
        error: firstIssue ? firstIssue.message : 'Données invalides',
      }
    }

    const validData = parsed.data

    // Build update object only with provided fields
    const updatePayload: Record<string, unknown> = {}

    if (validData.title !== undefined) {
      updatePayload.title = validData.title
    }
    if (validData.description !== undefined) {
      updatePayload.description = validData.description || null
    }
    if (validData.images !== undefined) {
      updatePayload.images = validData.images
    }
    if (validData.external_link !== undefined) {
      updatePayload.external_link = validData.external_link || null
    }
    if (validData.tags !== undefined) {
      updatePayload.tags = validData.tags
    }
    if (validData.display_order !== undefined) {
      updatePayload.display_order = validData.display_order
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch {
    return { data: null, error: 'Erreur lors de la mise à jour du projet' }
  }
}

export async function deleteProject(
  projectId: string
): Promise<DeleteResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Non authentifié' }
    }

    const portfolioId = await verifyProjectOwnership(projectId, user.id)
    if (!portfolioId) {
      return { error: 'Accès non autorisé' }
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch {
    return { error: 'Erreur lors de la suppression du projet' }
  }
}

export async function reorderProjects(
  portfolioId: string,
  projectIds: string[]
): Promise<DeleteResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Non authentifié' }
    }

    const isOwner = await verifyPortfolioOwnership(portfolioId, user.id)
    if (!isOwner) {
      return { error: 'Accès non autorisé' }
    }

    // Update each project's display_order based on its position in the array
    const updates = projectIds.map((id, index) =>
      supabase
        .from('projects')
        .update({ display_order: index })
        .eq('id', id)
        .eq('portfolio_id', portfolioId)
    )

    const results = await Promise.all(updates)

    const failedUpdate = results.find((r) => r.error)
    if (failedUpdate?.error) {
      return { error: failedUpdate.error.message }
    }

    return { error: null }
  } catch {
    return { error: 'Erreur lors de la réorganisation des projets' }
  }
}
