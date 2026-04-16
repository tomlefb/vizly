import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditorClient } from '@/components/editor/EditorClient'
import type { Project } from '@/types'

interface EditorPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const resolved = await searchParams
  const idParam = resolved.id
  const portfolioId = typeof idParam === 'string' && idParam.length > 0 ? idParam : null

  // Avec id → édition d'un portfolio existant (ownership check via user_id).
  // Sans id → nouveau portfolio : on démarre sur un draft en mémoire, la
  // row DB est créée au premier auto-save (cf. useEditorAutoSave qui
  // router.replace vers /editor?id=X une fois l'INSERT réussi).
  const portfolio = portfolioId
    ? await supabase
        .from('portfolios')
        .select('*')
        .eq('id', portfolioId)
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => data)
    : null

  // Si un id a été fourni mais ne correspond à aucun portfolio de l'user,
  // on ramène sur le dashboard plutôt que d'ouvrir un nouvel editor
  // silencieusement (moins déroutant).
  if (portfolioId && !portfolio) {
    redirect('/dashboard')
  }

  let projects: Project[] = []
  if (portfolio) {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('display_order', { ascending: true })
    projects = data ?? []
  }

  return <EditorClient initialPortfolio={portfolio} initialProjects={projects} />
}
