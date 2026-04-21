'use client'

import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { VzLogo } from '@/components/ui/vizly'
import { useSidebar } from './sidebar-context'

export function MobileTopBar() {
  const t = useTranslations('sidebar')
  const { toggleMobile } = useSidebar()
  const pathname = usePathname()

  // L'editor a son propre header fullscreen — pas de topbar.
  if (pathname.startsWith('/editor')) return null

  return (
    <div className="lg:hidden sticky top-0 z-30 flex h-14 items-center border-b border-border-light bg-background/90 backdrop-blur-md px-4">
      <button
        type="button"
        onClick={toggleMobile}
        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-foreground transition-colors hover:bg-surface-warm"
        aria-label={t('openMenu')}
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </button>
      <div className="ml-3">
        <VzLogo size={20} href="/dashboard" />
      </div>
    </div>
  )
}
