'use client'

export const SIDEBAR_WIDTH = 60

export function useSidebar() {
  return { sidebarWidth: SIDEBAR_WIDTH }
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
