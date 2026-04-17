'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function NavLink({ href, children, className }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[13px] font-medium transition-colors duration-150',
        isActive
          ? 'border border-border-light bg-surface text-foreground'
          : 'text-muted hover:bg-surface-warm hover:text-foreground',
        className,
      )}
    >
      {children}
    </Link>
  )
}
