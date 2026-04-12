import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider, SIDEBAR_COOKIE } from './sidebar-context'
import { Sidebar } from './sidebar'
import { DashboardContent } from './dashboard-content'
import type { PlanType } from '@/lib/constants'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('plan, name')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'free') as PlanType
  const isPro = plan === 'pro'
  const userName = (profile?.name as string) ?? ''
  const userEmail = user.email ?? ''

  // Persiste l'état de la sidebar entre les refreshs via un cookie
  // lu côté serveur pour éviter tout flash à l'hydratation.
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get(SIDEBAR_COOKIE)?.value
  const defaultExpanded = sidebarCookie !== '0'

  return (
    <SidebarProvider defaultExpanded={defaultExpanded}>
      <Sidebar userName={userName} userEmail={userEmail} isPro={isPro} />
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  )
}
