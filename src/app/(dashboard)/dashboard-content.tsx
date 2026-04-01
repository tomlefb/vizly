'use client'

import { useSidebar } from './sidebar-context'

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { sidebarWidth } = useSidebar()

  return (
    <main
      className="min-h-dvh bg-surface-warm"
      style={{ '--sidebar-w': `${sidebarWidth}px` } as React.CSSProperties}
    >
      <div className="pl-0 lg:pl-[var(--sidebar-w)] transition-[padding-left] duration-200 ease-out">
        <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
      </div>
    </main>
  )
}
