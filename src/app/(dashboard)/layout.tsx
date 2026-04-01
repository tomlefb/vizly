import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider } from './sidebar-context'
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

  return (
    <SidebarProvider>
      <Sidebar userName={userName} userEmail={userEmail} isPro={isPro} />
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  )
}
