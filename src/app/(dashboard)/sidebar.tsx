'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  LayoutGrid,
  CreditCard,
  BarChart3,
  Globe,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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

// Icon container width = sidebar collapsed (60px) - margins (2*4px) = 52px
// This ensures icons stay at the exact same position in both states
const ICON_W = 'w-[52px]'

export function Sidebar({ userName, userEmail, isPro }: SidebarProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col border-r border-border bg-white transition-[width] duration-200 ease-out overflow-hidden"
      style={{ width: expanded ? 220 : 60 }}
    >
      {/* Logo */}
      <div className="flex h-14 items-center shrink-0">
        <Link href="/dashboard" aria-label="Dashboard" className="flex items-center mx-1">
          <span className={cn(ICON_W, 'shrink-0 flex items-center justify-center')}>
            <span className="font-[family-name:var(--font-satoshi)] font-bold text-xl select-none">
              V
              <span className="inline-block w-[0.22em] h-[0.22em] rounded-full bg-accent ml-[0.02em] -translate-y-[0.08em]" />
            </span>
          </span>
          {expanded && (
            <span className="font-[family-name:var(--font-satoshi)] font-bold text-[17px] select-none whitespace-nowrap -ml-2.5">
              izly
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden" aria-label="Navigation principale">
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
        <div className="space-y-0.5 mt-3 pt-3 border-t border-border/40 mx-2">
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

      {/* Accueil — retour au site */}
      <div className="shrink-0 border-t border-border/40 py-1.5">
        <Link
          href="/"
          title={expanded ? undefined : 'Accueil'}
          className="group relative flex items-center mx-1 rounded-[var(--radius-md)] text-muted hover:bg-surface-warm hover:text-foreground transition-colors duration-150"
        >
          <span className={cn(ICON_W, 'h-9 shrink-0 flex items-center justify-center')}>
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </span>
          {expanded && <span className="text-[13px] whitespace-nowrap">Accueil</span>}
          {!expanded && (
            <span className="absolute left-full ml-2 z-50 rounded-md bg-foreground/90 px-2.5 py-1 text-[11px] font-medium text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
              Accueil
            </span>
          )}
        </Link>
      </div>

      {/* User block */}
      <div className="shrink-0 border-t border-border py-1.5">
        <UserMenu name={userName} email={userEmail} collapsed={!expanded} />
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
        'group relative flex items-center mx-1 rounded-[var(--radius-md)] transition-colors duration-150',
        active
          ? 'bg-accent-light text-accent'
          : 'text-muted hover:bg-surface-warm hover:text-foreground'
      )}
    >
      <span className={cn(ICON_W, 'h-9 shrink-0 flex items-center justify-center')}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
      </span>
      {expanded && (
        <>
          <span className={cn('text-[13px] whitespace-nowrap', active && 'font-medium')}>{label}</span>
          {proBadge && (
            <span className="ml-auto mr-3 rounded-full bg-accent-light px-1.5 py-px text-[9px] font-semibold text-accent leading-tight">
              Pro
            </span>
          )}
        </>
      )}
      {!expanded && (
        <span className="absolute left-full ml-2 z-50 rounded-md bg-foreground/90 px-2.5 py-1 text-[11px] font-medium text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
          {label}
        </span>
      )}
    </Link>
  )
}
