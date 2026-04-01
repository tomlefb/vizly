'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

interface SidebarContextValue {
  collapsed: boolean
  toggle: () => void
  sidebarWidth: number
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
  sidebarWidth: 220,
})

export const useSidebar = () => useContext(SidebarContext)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem('vizly-sidebar') === 'collapsed') {
        setCollapsed(true)
      }
    } catch {
      // SSR or restricted storage
    }
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('vizly-sidebar', next ? 'collapsed' : 'expanded')
      } catch {
        // restricted storage
      }
      return next
    })
  }, [])

  return (
    <SidebarContext value={{ collapsed, toggle, sidebarWidth: collapsed ? 60 : 220 }}>
      {children}
    </SidebarContext>
  )
}
