'use client'

import { createContext, useContext, useState, useCallback } from 'react'

const EXPANDED_WIDTH = 220
const COLLAPSED_WIDTH = 56
export const SIDEBAR_COOKIE = 'vizly-sidebar-expanded'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 an

interface SidebarContextValue {
  expanded: boolean
  toggle: () => void
  sidebarWidth: number
}

const SidebarContext = createContext<SidebarContextValue>({
  expanded: true,
  toggle: () => {},
  sidebarWidth: EXPANDED_WIDTH,
})

export function useSidebar() {
  return useContext(SidebarContext)
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultExpanded?: boolean
}

export function SidebarProvider({ children, defaultExpanded = true }: SidebarProviderProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev
      document.cookie = `${SIDEBAR_COOKIE}=${next ? '1' : '0'};path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`
      return next
    })
  }, [])

  const sidebarWidth = expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH

  return (
    <SidebarContext.Provider value={{ expanded, toggle, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  )
}
