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
import { Logo } from '@/components/shared/Logo'
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
  const [expanded, setExpanded] = useState(false)
  const currentWidth = expanded ? 220 : 60

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col border-r border-border bg-white transition-[width] duration-200 ease-out overflow-hidden"
      style={{ width: currentWidth }}
    >
      {/* Logo */}
      <div className={cn(
        'flex h-14 items-center shrink-0',
        expanded ? 'px-5' : 'justify-center'
      )}>
        <Link href="/dashboard" aria-label="Retour au dashboard">
          {expanded ? (
            <Logo size="sm" />
          ) : (
            <span className="font-[family-name:var(--font-satoshi)] font-bold text-xl select-none">
              V
              <span className="inline-block w-[0.22em] h-[0.22em] rounded-full bg-accent ml-[0.02em] -translate-y-[0.08em]" />
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav
        className={cn('flex-1 py-3 overflow-y-auto overflow-x-hidden', expanded ? 'px-2' : 'px-1.5')}
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
              expanded={expanded}
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
              expanded={expanded}
              proBadge={!isPro}
            />
          ))}
        </div>
      </nav>

      {/* Accueil — retour au site */}
      <div className={cn('shrink-0 border-t border-border/40', expanded ? 'px-2 py-2' : 'px-1.5 py-2')}>
        <Link
          href="/"
          title={expanded ? undefined : 'Accueil'}
          className={cn(
            'group relative flex items-center rounded-[var(--radius-md)] text-muted hover:bg-surface-warm hover:text-foreground transition-colors duration-150',
            expanded ? 'gap-2.5 px-3 py-2' : 'justify-center p-2.5'
          )}
        >
          <ArrowLeft className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
          {expanded && <span className="text-[13px] whitespace-nowrap">Accueil</span>}
          {!expanded && (
            <span className="absolute left-full ml-2 z-50 rounded-md bg-foreground/90 px-2.5 py-1 text-[11px] font-medium text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
              Accueil
            </span>
          )}
        </Link>
      </div>

      {/* User block */}
      <div className={cn('shrink-0 border-t border-border', expanded ? 'p-2' : 'p-1.5')}>
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
        'group relative flex items-center rounded-[var(--radius-md)] transition-colors duration-150',
        expanded ? 'gap-2.5 px-3 py-2' : 'justify-center p-2.5',
        active
          ? 'bg-accent-light text-accent'
          : 'text-muted hover:bg-surface-warm hover:text-foreground'
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
      {expanded && (
        <>
          <span className={cn('text-[13px] whitespace-nowrap', active && 'font-medium')}>{label}</span>
          {proBadge && (
            <span className="ml-auto rounded-full bg-accent-light px-1.5 py-px text-[9px] font-semibold text-accent leading-tight">
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
