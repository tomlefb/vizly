import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/shared/Logo'
import { UserMenu } from './user-menu'
import { NavLink } from './nav-link'
import type { PlanType } from '@/lib/constants'

function NavIcon({ icon }: { icon: string }) {
  const props = { className: 'h-5 w-5', fill: 'none' as const, viewBox: '0 0 24 24', strokeWidth: 1.75, stroke: 'currentColor', 'aria-hidden': true as const }
  switch (icon) {
    case 'home':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      )
    case 'chart-bar':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      )
    case 'credit-card':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      )
    case 'layout-grid':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      )
    default:
      return null
  }
}

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
    <div className="flex min-h-dvh">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-white">
        <div className="flex h-16 items-center px-6">
          <Link href="/dashboard" aria-label="Retour au dashboard">
            <Logo size="md" />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-6" aria-label="Navigation principale">
          {/* Main nav */}
          <div className="space-y-1">
            <NavLink href="/dashboard">
              <NavIcon icon="home" />
              Dashboard
            </NavLink>
            <NavLink href="/mes-templates">
              <NavIcon icon="layout-grid" />
              Templates
            </NavLink>
            <NavLink href="/billing">
              <NavIcon icon="credit-card" />
              Facturation
            </NavLink>
          </div>

          {/* Pro features */}
          <div className="space-y-1 border-t border-border/50 pt-4">
            <NavLink href="/statistiques">
              <NavIcon icon="chart-bar" />
              Statistiques
              {!isPro && (
                <span className="ml-auto rounded-full bg-accent-light px-2 py-0.5 text-[10px] font-semibold text-accent">
                  Pro
                </span>
              )}
            </NavLink>
            <NavLink href="/domaines">
              <NavIcon icon="globe" />
              Domaines
              {!isPro && (
                <span className="ml-auto rounded-full bg-accent-light px-2 py-0.5 text-[10px] font-semibold text-accent">
                  Pro
                </span>
              )}
            </NavLink>
          </div>
        </nav>

        {/* User block */}
        <div className="border-t border-border p-3">
          <UserMenu name={userName} email={userEmail} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 pl-64">
        <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
      </main>
    </div>
  )
}
