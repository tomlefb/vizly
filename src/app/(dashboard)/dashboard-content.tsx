'use client'

import { useSidebar } from './sidebar-context'
import { cn } from '@/lib/utils'

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { sidebarWidth, mounted } = useSidebar()

  return (
    <main
      data-dashboard-main
      className={cn(
        'min-h-dvh bg-background max-lg:!pl-0',
        mounted && 'transition-[padding-left] duration-200 ease-out',
      )}
      style={{ paddingLeft: sidebarWidth }}
    >
      {children}
    </main>
  )
}
