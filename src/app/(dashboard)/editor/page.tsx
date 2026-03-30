import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditorClient } from '@/components/editor/EditorClient'
import type { Project } from '@/types'

export default async function EditorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

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
