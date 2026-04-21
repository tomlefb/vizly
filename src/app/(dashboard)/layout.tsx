import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider } from './sidebar-context'
import { SIDEBAR_COOKIE } from './sidebar-constants'
import { Sidebar } from './sidebar'
import { MobileTopBar } from './mobile-topbar'
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

  // Préférence utilisateur persistée dans un cookie (écrit côté client
  // à chaque toggle, lu ici côté serveur pour éviter tout flash à F5).
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get(SIDEBAR_COOKIE)?.value
  const userPreference = sidebarCookie !== '0'

  // Force la sidebar rétractée en mode editor, sans toucher au cookie
  // préférence. Le pathname est exposé par le middleware via un header.
  const headerStore = await headers()
  const pathname = headerStore.get('x-pathname') ?? ''
  const isInEditor = pathname.startsWith('/editor')
  const defaultExpanded = isInEditor ? false : userPreference

  return (
    <SidebarProvider defaultExpanded={defaultExpanded}>
      <Sidebar userName={userName} userEmail={userEmail} isPro={isPro} />
      <DashboardContent>
        <MobileTopBar />
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 mx-auto max-w-6xl w-full">
          {children}
        </div>
      </DashboardContent>
    </SidebarProvider>
  )
}
