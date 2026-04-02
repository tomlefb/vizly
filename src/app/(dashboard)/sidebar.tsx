'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  LayoutGrid,
  CreditCard,
  BarChart3,
  Globe,
  ArrowLeft,
  Settings,
  LogOut,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  userName: string
  userEmail: string
  isPro: boolean
}

const ICON_W = 'w-[52px]'

export function Sidebar({ userName, userEmail, isPro }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)

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
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col border-r border-border bg-white transition-[width] duration-200 ease-out overflow-hidden"
      style={{ width: expanded ? 220 : 60 }}
    >
      {/* User block — TOP (Substack style) */}
      <div className="shrink-0 flex items-center mx-1 h-14">
        <span className={cn(ICON_W, 'shrink-0 flex items-center justify-center')}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white text-[12px] font-semibold">
            {initials}
          </span>
        </span>
        {expanded && (
          <div className="min-w-0 pr-2">
            <p className="text-[13px] font-semibold text-foreground truncate">{userName || 'Utilisateur'}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden" aria-label="Navigation principale">
        {/* Main */}
        <div className="space-y-0.5">
          <NavItem href="/dashboard" icon={Home} label="Dashboard" active={pathname === '/dashboard' || pathname.startsWith('/dashboard/')} expanded={expanded} />
          <NavItem href="/editor" icon={LayoutGrid} label="Editeur" active={pathname.startsWith('/editor')} expanded={expanded} />
        </div>

        {/* Group: Portfolio */}
        {expanded && (
          <p className="px-5 pt-5 pb-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Portfolio</p>
        )}
        {!expanded && <div className="my-2 mx-3 border-t border-border/30" />}
        <div className="space-y-0.5">
          <NavItem href="/mes-templates" icon={LayoutGrid} label="Templates" active={pathname === '/mes-templates' || pathname.startsWith('/mes-templates/')} expanded={expanded} />
          <NavItem href="/statistiques" icon={BarChart3} label="Statistiques" active={pathname.startsWith('/statistiques')} expanded={expanded} proBadge={!isPro} />
          <NavItem href="/domaines" icon={Globe} label="Domaines" active={pathname.startsWith('/domaines')} expanded={expanded} proBadge={!isPro} />
        </div>

        {/* Group: Compte */}
        {expanded && (
          <p className="px-5 pt-5 pb-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Compte</p>
        )}
        {!expanded && <div className="my-2 mx-3 border-t border-border/30" />}
        <div className="space-y-0.5">
          <NavItem href="/billing" icon={CreditCard} label="Facturation" active={pathname === '/billing' || pathname.startsWith('/billing/')} expanded={expanded} />
          <NavItem href="/settings" icon={Settings} label="Parametres" active={pathname === '/settings'} expanded={expanded} />
        </div>
      </nav>

      {/* Bottom: Help, Logout, Accueil */}
      <div className="shrink-0 border-t border-border/30 py-1.5 space-y-0.5">
        <NavItem href="/" icon={ArrowLeft} label="Accueil" active={false} expanded={expanded} />
        <button
          type="button"
          onClick={() => void handleLogout()}
          title={expanded ? undefined : 'Deconnexion'}
          className="group relative flex items-center mx-1 w-[calc(100%-8px)] rounded-[var(--radius-md)] text-muted hover:text-destructive hover:bg-destructive/5 transition-colors duration-150"
        >
          <span className={cn(ICON_W, 'h-9 shrink-0 flex items-center justify-center')}>
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </span>
          {expanded && <span className="text-[13px] whitespace-nowrap">Deconnexion</span>}
          {!expanded && (
            <span className="absolute left-full ml-2 z-50 rounded-md bg-foreground/90 px-2.5 py-1 text-[11px] font-medium text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
              Deconnexion
            </span>
          )}
        </button>
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
