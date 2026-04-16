'use client'

import { createContext, useContext, useState, useCallback, useEffect, useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

const EXPANDED_WIDTH = 220
const COLLAPSED_WIDTH = 56
export const SIDEBAR_COOKIE = 'vizly-sidebar-expanded'
const COLLAPSED_ATTR = 'data-sidebar-collapsed'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 an

// useLayoutEffect throws a warning during SSR ; on bascule sur
// useEffect côté serveur via ce shim isomorphique standard.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

function readSidebarCookie(): boolean {
  if (typeof document === 'undefined') return true
  const match = document.cookie.match(new RegExp(`(?:^|; )${SIDEBAR_COOKIE}=([^;]*)`))
  return match ? match[1] !== '0' : true
}

function setCollapsedAttr(collapsed: boolean) {
  if (typeof document === 'undefined') return
  if (collapsed) {
    document.documentElement.setAttribute(COLLAPSED_ATTR, '')
  } else {
    document.documentElement.removeAttribute(COLLAPSED_ATTR)
  }
}

interface SidebarContextValue {
  expanded: boolean
  toggle: () => void
  sidebarWidth: number
  mounted: boolean
}

const SidebarContext = createContext<SidebarContextValue>({
  expanded: true,
  toggle: () => {},
  sidebarWidth: EXPANDED_WIDTH,
  mounted: false,
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
  const [mounted, setMounted] = useState(false)

  // Sync React state + data attribute lors du mount et des navigations
  // client-side. Au mount, corrige l'état si le SSR a passé la mauvaise
  // valeur (cookie non lu côté serveur). Le data attribute est mis à
  // jour directement (pas via un effect séparé) pour éviter qu'un
  // effect intermédiaire le retire avant que le state soit commité.
  useIsomorphicLayoutEffect(() => {
    const newExpanded = isInEditor ? false : readSidebarCookie()
    setExpanded(newExpanded)
    setCollapsedAttr(!newExpanded)
  }, [isInEditor])

  // Active les transitions CSS uniquement après le premier paint pour
  // que l'ajustement d'hydratation ci-dessus ne soit pas animé.
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev
      // N'écrit le cookie que hors editor pour ne pas écraser la
      // préférence utilisateur par un toggle temporaire en éditeur.
      if (!isInEditor) {
        document.cookie = `${SIDEBAR_COOKIE}=${next ? '1' : '0'};path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`
      }
      setCollapsedAttr(!next)
      return next
    })
  }, [isInEditor])

  const sidebarWidth = expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH

  return (
    <SidebarContext.Provider value={{ expanded, toggle, sidebarWidth, mounted }}>
      {children}
    </SidebarContext.Provider>
  )
}
