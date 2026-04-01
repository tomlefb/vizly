'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  LayoutGrid,
  CreditCard,
  BarChart3,
  Globe,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/shared/Logo'
import { useSidebar } from './sidebar-context'
import { UserMenu } from './user-menu'

interface SidebarProps {
  userName: string
  userEmail: string
  isPro: boolean
}

const NAV_MAIN = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/mes-templates', icon: LayoutGrid, label: 'Templates' },
  { href: '/billing', icon: CreditCard, label: 'Facturation' },
] as const

const NAV_PRO = [
  { href: '/statistiques', icon: BarChart3, label: 'Statistiques' },
  { href: '/domaines', icon: Globe, label: 'Domaines' },
] as const

export function Sidebar({ userName, userEmail, isPro }: SidebarProps) {
  const pathname = usePathname()
  const { collapsed, toggle, sidebarWidth } = useSidebar()

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col border-r border-border bg-white transition-[width] duration-200 ease-out overflow-hidden"
      style={{ width: sidebarWidth }}
    >
      {/* Logo */}
      <div className={cn(
        'flex h-14 items-center shrink-0',
        collapsed ? 'justify-center' : 'px-5'
      )}>
        <Link href="/dashboard" aria-label="Retour au dashboard">
          {collapsed ? (
            <span className="font-[family-name:var(--font-satoshi)] font-bold text-xl select-none">
              V
              <span className="inline-block w-[0.22em] h-[0.22em] rounded-full bg-accent ml-[0.02em] -translate-y-[0.08em]" />
            </span>
          ) : (
            <Logo size="sm" />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav
        className={cn('flex-1 py-3 overflow-y-auto overflow-x-hidden', collapsed ? 'px-1.5' : 'px-2')}
        aria-label="Navigation principale"
      >
        <div className="space-y-0.5">
          {NAV_MAIN.map(({ href, icon: Icon, label }) => (
            <NavItem
              key={href}
              href={href}
              icon={Icon}
              label={label}
              active={pathname === href || pathname.startsWith(`${href}/`)}
              collapsed={collapsed}
            />
          ))}
        </div>
        <div className="space-y-0.5 mt-3 pt-3 border-t border-border/40">
          {NAV_PRO.map(({ href, icon: Icon, label }) => (
            <NavItem
              key={href}
              href={href}
              icon={Icon}
              label={label}
              active={pathname === href || pathname.startsWith(`${href}/`)}
              collapsed={collapsed}
              proBadge={!isPro}
            />
          ))}
        </div>
      </nav>

      {/* Toggle button */}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'shrink-0 flex items-center border-t border-border/40 text-muted-foreground hover:text-foreground hover:bg-surface-warm transition-colors duration-150',
          collapsed ? 'justify-center py-3' : 'gap-2 px-4 py-3'
        )}
        aria-label={collapsed ? 'Agrandir la sidebar' : 'Reduire la sidebar'}
      >
        {collapsed ? (
          <ChevronsRight className="h-4 w-4" strokeWidth={1.5} />
        ) : (
          <>
            <ChevronsLeft className="h-4 w-4" strokeWidth={1.5} />
            <span className="text-[11px] font-medium whitespace-nowrap">Reduire</span>
          </>
        )}
      </button>

      {/* User block */}
      <div className={cn('shrink-0 border-t border-border', collapsed ? 'p-1.5' : 'p-2')}>
        <UserMenu name={userName} email={userEmail} collapsed={collapsed} />
      </div>
    </aside>
  )
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
  proBadge,
}: {
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  active: boolean
  collapsed: boolean
  proBadge?: boolean
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'group relative flex items-center rounded-[var(--radius-md)] transition-colors duration-150',
        collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2',
        active
          ? 'bg-accent-light text-accent'
          : 'text-muted hover:bg-surface-warm hover:text-foreground'
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
      {!collapsed && (
        <>
          <span className={cn('text-[13px] whitespace-nowrap', active && 'font-medium')}>{label}</span>
          {proBadge && (
            <span className="ml-auto rounded-full bg-accent-light px-1.5 py-px text-[9px] font-semibold text-accent leading-tight">
              Pro
            </span>
          )}
        </>
      )}
      {collapsed && (
        <span className="absolute left-full ml-2 z-50 rounded-md bg-foreground/90 px-2.5 py-1 text-[11px] font-medium text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
          {label}
        </span>
      )}
    </Link>
  )
}
