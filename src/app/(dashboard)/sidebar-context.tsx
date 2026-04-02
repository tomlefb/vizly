'use client'

import { createContext, useContext, useState, useCallback } from 'react'

const EXPANDED_WIDTH = 220
const COLLAPSED_WIDTH = 56

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

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true)
  const toggle = useCallback(() => setExpanded((prev) => !prev), [])
  const sidebarWidth = expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH

  return (
    <SidebarContext.Provider value={{ expanded, toggle, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  )
}
