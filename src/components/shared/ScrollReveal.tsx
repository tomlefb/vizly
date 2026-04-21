'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return isMobile
}

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  margin?: string
}

export function ScrollReveal({ children, className, delay = 0, margin = '-15% 0px' }: ScrollRevealProps) {
  const prefersReduced = useReducedMotion()
  const isMobile = useIsMobile()

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  // Sur mobile : animations plus légères (y réduit, durée raccourcie, viewport plus tôt)
  // pour éviter les décalages et le sentiment de lourdeur sur petits écrans.
  const y = isMobile ? 12 : 24
  const duration = isMobile ? 0.35 : 0.5
  const viewportMargin = isMobile ? '-5% 0px' : margin
  const mobileDelay = isMobile ? delay * 0.6 : delay

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: viewportMargin }}
      transition={{ duration, ease: EASE_OUT_EXPO, delay: mobileDelay }}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
  index: number
  baseDelay?: number
  stagger?: number
}

export function StaggerItem({ children, className, index, baseDelay = 0.15, stagger = 0.08 }: StaggerItemProps) {
  const prefersReduced = useReducedMotion()
  const isMobile = useIsMobile()

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  const y = isMobile ? 8 : 16
  const duration = isMobile ? 0.3 : 0.4
  const effectiveStagger = isMobile ? stagger * 0.6 : stagger
  const effectiveBaseDelay = isMobile ? baseDelay * 0.5 : baseDelay
  const viewportMargin = isMobile ? '-5% 0px' : '-15% 0px'

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: viewportMargin }}
      transition={{ duration, ease: EASE_OUT_EXPO, delay: effectiveBaseDelay + index * effectiveStagger }}
    >
      {children}
    </motion.div>
  )
}
