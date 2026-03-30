'use client'

import { useEffect } from 'react'

interface TrackViewProps {
  portfolioId: string
}

export function TrackView({ portfolioId }: TrackViewProps) {
  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portfolio_id: portfolioId }),
      signal: controller.signal,
    }).catch(() => {
      // Silently ignore tracking errors — analytics should never block UX
    })

    return () => {
      controller.abort()
    }
  }, [portfolioId])

  return null
}
