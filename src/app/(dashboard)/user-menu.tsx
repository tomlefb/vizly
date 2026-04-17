'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { VzAvatar } from '@/components/ui/vizly'

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
        className="mx-1 flex w-full items-center rounded-[var(--radius-sm)] transition-colors duration-150 hover:bg-surface"
      >
        <span className="flex h-9 w-[52px] shrink-0 items-center justify-center">
          <VzAvatar initials={initials} size={30} />
        </span>
        {!collapsed && (
          <div className="min-w-0 flex-1 pr-2 text-left">
            <p className="truncate text-[12.5px] font-semibold text-foreground">
              {name || 'Utilisateur'}
            </p>
            <p className="truncate text-[10.5px] text-muted-foreground">
              {email}
            </p>
          </div>
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-50 rounded-[var(--radius-md)] border border-border-light bg-surface py-1 shadow-[0_4px_16px_rgba(0,0,0,0.06)]',
            collapsed
              ? 'bottom-0 left-full ml-2 min-w-[180px]'
              : 'bottom-full left-0 right-0 mb-1',
          )}
        >
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-muted transition-colors hover:bg-surface-warm hover:text-foreground"
          >
            <User className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            Mon compte
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-muted transition-colors hover:bg-destructive/5 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            Deconnexion
          </button>
        </div>
      )}
    </div>
  )
}
