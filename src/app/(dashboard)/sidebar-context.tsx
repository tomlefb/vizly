'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const EXPANDED_WIDTH = 220
const COLLAPSED_WIDTH = 56
export const SIDEBAR_COOKIE = 'vizly-sidebar-expanded'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 an

function readSidebarCookie(): boolean {
  if (typeof document === 'undefined') return true
  const match = document.cookie.match(new RegExp(`(?:^|; )${SIDEBAR_COOKIE}=([^;]*)`))
  return match ? match[1] !== '0' : true
}

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
  const pathname = usePathname()
  const isInEditor = pathname.startsWith('/editor')

  const [expanded, setExpanded] = useState(defaultExpanded)

  // Réagit aux navigations client-side (pas de F5) : force la sidebar
  // rétractée à l'entrée en /editor, restaure la préférence cookie à
  // la sortie. Au F5, le layout a déjà passé la bonne valeur via
  // defaultExpanded et cet effet produit un résultat identique.
  useEffect(() => {
    if (isInEditor) {
      setExpanded(false)
    } else {
      setExpanded(readSidebarCookie())
    }
  }, [isInEditor])

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev
      // N'écrit le cookie que hors editor pour ne pas écraser la
      // préférence utilisateur par un toggle temporaire en éditeur.
      if (!isInEditor) {
        document.cookie = `${SIDEBAR_COOKIE}=${next ? '1' : '0'};path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`
      }
      return next
    })
  }, [isInEditor])

  const sidebarWidth = expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH

  return (
    <SidebarContext.Provider value={{ expanded, toggle, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  )
}
