'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface UserMenuProps {
  name: string
  email: string
  collapsed?: boolean
}

export function UserMenu({ name, email, collapsed = false }: UserMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center w-full mx-1 rounded-[var(--radius-md)] transition-colors duration-150 hover:bg-surface-warm"
      >
        <span className="w-[52px] h-9 shrink-0 flex items-center justify-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-accent text-[12px] font-semibold">
            {initials}
          </span>
        </span>
        {!collapsed && (
          <div className="flex-1 min-w-0 text-left pr-2">
            <p className="text-[12px] font-medium text-foreground truncate">{name || 'Utilisateur'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{email}</p>
          </div>
        )}
      </button>

      {open && (
        <div className={cn(
          'absolute rounded-[var(--radius-md)] border border-border bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] py-1 z-50',
          collapsed ? 'bottom-0 left-full ml-2 min-w-[180px]' : 'bottom-full left-0 right-0 mb-1'
        )}>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-muted hover:text-foreground hover:bg-surface-warm transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Mon compte
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-muted hover:text-destructive hover:bg-destructive/5 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Deconnexion
          </button>
        </div>
      )}
    </div>
  )
}
