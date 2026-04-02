'use client'

import { useSidebar } from './sidebar-context'

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { sidebarWidth } = useSidebar()

  return (
    <main
      className="min-h-dvh bg-[#F9FAFB] max-lg:!pl-0 transition-[padding-left] duration-200 ease-out"
      style={{ paddingLeft: sidebarWidth }}
    >
      <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
    </main>
  )
}
