'use client'

import { useSidebar } from './sidebar-context'
import { cn } from '@/lib/utils'

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { sidebarWidth, mounted } = useSidebar()

  return (
    <main
      className={cn(
        'min-h-dvh bg-[#F9FAFB] max-lg:!pl-0',
        mounted && 'transition-[padding-left] duration-200 ease-out',
      )}
      style={{ paddingLeft: sidebarWidth }}
    >
      <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
    </main>
  )
}
