'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-muted transition-colors duration-150 hover:bg-surface-warm hover:text-foreground"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      Déconnexion
    </button>
  )
}
