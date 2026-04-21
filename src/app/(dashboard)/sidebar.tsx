'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { VzLogo, VzAvatar } from '@/components/ui/vizly'
import { useSidebar } from './sidebar-context'

interface SidebarProps {
  userName: string
  userEmail: string
  isPro: boolean
}

export function Sidebar({ userName, userEmail, isPro }: SidebarProps) {
  const t = useTranslations('sidebar')

  const NAV_PORTFOLIO = [
    { href: '/dashboard', icon: Home, label: t('dashboard') },
    { href: '/mes-templates', icon: LayoutGrid, label: t('templates') },
    ...(isPro
      ? [
          { href: '/domaines', icon: Globe, label: t('domains') },
          { href: '/statistiques', icon: BarChart3, label: t('stats') },
        ]
      : []),
  ]

  const NAV_ACCOUNT = [
    { href: '/settings', icon: User, label: t('account') },
    { href: '/billing', icon: CreditCard, label: t('billing') },
  ]

  const pathname = usePathname()
  const router = useRouter()
  const { expanded, toggle, sidebarWidth, mounted, mobileOpen, setMobileOpen } = useSidebar()
  const uiExpanded = mobileOpen ? true : expanded

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
    <>
      {/* Mobile overlay — z-[65] pour passer au-dessus de la topbar editor (z-60) */}
      <div
        role="button"
        tabIndex={-1}
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'fixed inset-0 z-[65] bg-foreground/30 backdrop-blur-sm transition-opacity duration-200 lg:hidden',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

    <aside
      data-dashboard-sidebar
      data-onboarding="sidebar"
      className={cn(
        // Desktop z-50, mobile z-[70] pour couvrir la topbar editor (z-60).
        'fixed inset-y-0 z-50 max-lg:!z-[70] flex flex-col bg-surface overflow-hidden',
        // Desktop : ancrée à gauche avec border-r.
        'lg:left-0 lg:border-r lg:border-border-light',
        // Mobile : drawer 260px slide-in depuis la droite (même côté que le burger),
        // border-l + !important sur width pour battre l'inline style desktop.
        'max-lg:right-0 max-lg:border-l max-lg:border-border-light max-lg:!w-[260px] max-lg:transition-transform max-lg:duration-200 max-lg:ease-out',
        mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:translate-x-full',
        mounted && 'lg:transition-[width] lg:duration-200 lg:ease-out',
      )}
      style={{ width: sidebarWidth }}
    >
      {/* Logo + toggle chevron (desktop) / close (mobile) */}
      <div className="flex h-14 items-center shrink-0 px-4">
        {/* Mobile close button */}
        <div className="lg:hidden flex w-full items-center">
          <VzLogo size={20} href="/dashboard" />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted transition-colors duration-150 hover:bg-surface-warm hover:text-foreground"
            aria-label={t('closeMenu')}
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        {/* Desktop expand/collapse */}
        <div className="hidden lg:flex w-full items-center">
        {expanded ? (
          <>
            <VzLogo size={20} href="/dashboard" />
            <button
              type="button"
              onClick={toggle}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted transition-colors duration-150 hover:bg-surface-warm hover:text-foreground"
              aria-label={t('collapse')}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={toggle}
            className="flex h-8 w-full items-center justify-center rounded-[var(--radius-sm)] text-muted transition-colors duration-150 hover:bg-surface-warm hover:text-foreground"
            aria-label={t('expand')}
          >
            <ChevronLeft className="h-4 w-4 rotate-180" strokeWidth={1.5} />
          </button>
        )}
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2"
        aria-label="Navigation principale"
      >
        <div className="space-y-0.5">
          {NAV_PORTFOLIO.map(({ href, icon: Icon, label }) => (
            <NavItem
              key={href}
              href={href}
              icon={Icon}
              label={label}
              active={pathname === href || pathname.startsWith(`${href}/`)}
              expanded={uiExpanded}
            />
          ))}
        </div>
        <div
          className={cn(
            'mx-2 my-3 h-px bg-border-light',
            !uiExpanded && 'mx-1',
          )}
        />
        <div className="space-y-0.5">
          {NAV_ACCOUNT.map(({ href, icon: Icon, label }) => (
            <NavItem
              key={href}
              href={href}
              icon={Icon}
              label={label}
              active={pathname === href || pathname.startsWith(`${href}/`)}
              expanded={uiExpanded}
            />
          ))}
        </div>
      </nav>

      {/* Utility links */}
      <div className="shrink-0 space-y-0.5 border-t border-border-light px-2 py-2">
        <NavItem
          href="/"
          icon={ArrowLeft}
          label={t('home')}
          active={false}
          expanded={uiExpanded}
        />
        <button
          type="button"
          onClick={() => void handleLogout()}
          title={uiExpanded ? undefined : t('logout')}
          className={cn(
            'group relative flex h-9 w-full items-center rounded-[var(--radius-sm)] text-muted transition-colors duration-150 hover:bg-surface-warm hover:text-destructive',
            uiExpanded ? 'pl-3' : 'justify-center',
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
          {uiExpanded && (
            <span className="ml-3 whitespace-nowrap text-[13px]">
              {t('logout')}
            </span>
          )}
          {!uiExpanded && (
            <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-[var(--radius-sm)] bg-foreground/90 px-2.5 py-1 text-[11px] font-medium text-surface-warm opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              {t('logout')}
            </span>
          )}
        </button>
      </div>

      {/* User identity */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-t border-border-light px-3',
          !uiExpanded && 'justify-center px-2',
        )}
      >
        <VzAvatar initials={initials} size={32} />
        {uiExpanded && (
          <div className="ml-3 min-w-0 pr-2">
            <p className="truncate text-[12.5px] font-semibold text-foreground">
              {userName || t('user')}
            </p>
            <p className="truncate text-[10.5px] text-muted-foreground">
              {userEmail}
            </p>
          </div>
        )}
      </div>
    </aside>
    </>
  )
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  expanded,
}: {
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  active: boolean
  expanded: boolean
}) {
  return (
    <Link
      href={href}
      title={expanded ? undefined : label}
      className={cn(
        'group relative flex h-9 items-center rounded-[var(--radius-sm)] transition-colors duration-150',
        expanded ? 'pl-3' : 'justify-center',
        active
          ? 'border border-border-light bg-surface-warm text-foreground'
          : 'text-muted hover:bg-surface-warm hover:text-foreground',
      )}
    >
      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0',
          active ? 'text-foreground' : 'text-muted',
        )}
        strokeWidth={1.5}
      />
      {expanded && (
        <span
          className={cn(
            'ml-3 whitespace-nowrap text-[13px]',
            active && 'font-medium',
          )}
        >
          {label}
        </span>
      )}
      {!expanded && (
        <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-[var(--radius-sm)] bg-foreground/90 px-2.5 py-1 text-[11px] font-medium text-surface-warm opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {label}
        </span>
      )}
    </Link>
  )
}
