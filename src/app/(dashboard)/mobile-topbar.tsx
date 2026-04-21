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

  // Sur l'editor, la topbar est fixed (pas sticky) pour chevaucher le panneau
  // éditeur qui est lui-même fixed, et elle est au-dessus en z-index.
  const isEditor = pathname.startsWith('/editor')

  return (
    <div
      className={
        isEditor
          ? 'lg:hidden fixed top-0 inset-x-0 z-[60] flex h-14 items-center justify-between border-b border-border-light bg-background/90 backdrop-blur-md px-4'
          : 'lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border-light bg-background/90 backdrop-blur-md px-4'
      }
    >
      <VzLogo size={20} href="/dashboard" />
      <button
        type="button"
        onClick={toggleMobile}
        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-foreground transition-colors hover:bg-surface-warm"
        aria-label={t('openMenu')}
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </div>
  )
}
