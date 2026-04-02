'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  LayoutGrid,
  CreditCard,
  BarChart3,
  Globe,
  ArrowLeft,
  User,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useSidebar } from './sidebar-context'

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
  const router = useRouter()
  const { expanded, toggle, sidebarWidth } = useSidebar()

  const initials = userName
    ? userName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : userEmail.slice(0, 2).toUpperCase()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col border-r border-[#E5E7EB] bg-white transition-[width] duration-200 ease-out overflow-hidden"
      style={{ width: sidebarWidth }}
    >
      {/* Logo + toggle */}
      <div className="flex h-14 items-center shrink-0 px-2">
        <Link
          href="/dashboard"
          aria-label="Dashboard"
          className={cn(
            'flex items-center',
            expanded ? 'pl-2' : 'pl-0.5',
          )}
        >
          <span className="font-[family-name:var(--font-satoshi)] font-bold text-xl select-none shrink-0">
            V
            <span className="inline-block w-[0.22em] h-[0.22em] rounded-full bg-[#E8553D] ml-[0.02em] -translate-y-[0.08em]" />
          </span>
          {expanded && (
            <span className="font-[family-name:var(--font-satoshi)] font-bold text-[17px] select-none whitespace-nowrap ml-0.5">
              izly
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={toggle}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-[6px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors duration-150 shrink-0',
            expanded ? 'ml-auto' : 'ml-1',
          )}
          aria-label={expanded ? 'Réduire la sidebar' : 'Étendre la sidebar'}
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              !expanded && 'rotate-180',
            )}
            strokeWidth={1.5}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto overflow-x-hidden" aria-label="Navigation principale">
        <div className="space-y-0.5">
          {NAV_MAIN.map(({ href, icon: Icon, label }) => (
            <NavItem
              key={href}
              href={href}
              icon={Icon}
              label={label}
              active={pathname === href || pathname.startsWith(`${href}/`)}
              expanded={expanded}
            />
          ))}
        </div>
        <div className="space-y-0.5 mt-3 pt-3 border-t border-[#E5E7EB]/40">
          {NAV_PRO.map(({ href, icon: Icon, label }) => (
            <NavItem
              key={href}
              href={href}
              icon={Icon}
              label={label}
              active={pathname === href || pathname.startsWith(`${href}/`)}
              expanded={expanded}
              proBadge={!isPro}
            />
          ))}
        </div>
      </nav>

      {/* Bottom links */}
      <div className="shrink-0 border-t border-[#E5E7EB]/40 py-1.5 px-2 space-y-0.5">
        <NavItem href="/" icon={ArrowLeft} label="Accueil" active={false} expanded={expanded} />
        <NavItem href="/settings" icon={User} label="Mon compte" active={pathname === '/settings'} expanded={expanded} />
        <button
          type="button"
          onClick={() => void handleLogout()}
          title={expanded ? undefined : 'Deconnexion'}
          className={cn(
            'group relative flex items-center w-full h-9 rounded-[6px] text-[#6B7280] hover:text-[#DC2626] hover:bg-[#F3F4F6] transition-colors duration-150',
            expanded ? 'pl-3' : 'justify-center',
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
          {expanded && <span className="text-[13px] whitespace-nowrap ml-3">Deconnexion</span>}
          {!expanded && (
            <span className="absolute left-full ml-2 z-50 rounded-[6px] bg-[#111827]/90 px-2.5 py-1 text-[11px] font-medium text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
              Deconnexion
            </span>
          )}
        </button>
      </div>

      {/* User avatar */}
      <div className={cn(
        'shrink-0 border-t border-[#E5E7EB] h-14 flex items-center px-2',
        !expanded && 'justify-center',
      )}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[#111827] text-[12px] font-semibold">
          {initials}
        </span>
        {expanded && (
          <div className="min-w-0 ml-3 pr-2">
            <p className="text-[12px] font-medium text-[#111827] truncate">{userName || 'Utilisateur'}</p>
            <p className="text-[10px] text-[#6B7280] truncate">{userEmail}</p>
          </div>
        )}
      </div>
    </aside>
  )
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  expanded,
  proBadge,
}: {
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  active: boolean
  expanded: boolean
  proBadge?: boolean
}) {
  return (
    <Link
      href={href}
      title={expanded ? undefined : label}
      className={cn(
        'group relative flex items-center h-9 rounded-[6px] transition-colors duration-150',
        expanded ? 'pl-3' : 'justify-center',
        active
          ? 'bg-[#F3F4F6] text-[#111827]'
          : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]',
      )}
    >
      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0',
          active ? 'text-[#111827]' : 'text-[#6B7280]',
        )}
        strokeWidth={1.5}
      />
      {expanded && (
        <>
          <span className={cn('text-[13px] whitespace-nowrap ml-3', active && 'font-medium')}>
            {label}
          </span>
          {proBadge && (
            <span className="ml-auto mr-3 rounded-[4px] bg-[#F3F4F6] px-1.5 py-px text-[9px] font-semibold text-[#6B7280] leading-tight uppercase">
              Pro
            </span>
          )}
        </>
      )}
      {!expanded && (
        <span className="absolute left-full ml-2 z-50 rounded-[6px] bg-[#111827]/90 px-2.5 py-1 text-[11px] font-medium text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
          {label}
        </span>
      )}
    </Link>
  )
}
