'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { VzBtn } from '@/components/ui/vizly'

interface ConfirmRedirectAfterDelayProps {
  targetPath: string
  delayMs: number
  continueLabel: string
}

/**
 * Schedules an automatic redirect to `targetPath` after `delayMs`, and
 * exposes a manual "Continuer" button that bypasses the timer. Used by
 * /billing/confirm to bounce the user back to /billing once the optimistic
 * confirmation message has been read (the webhook pipeline runs in parallel
 * and is the actual source of truth for the DB sync).
 */
export function ConfirmRedirectAfterDelay({
  targetPath,
  delayMs,
  continueLabel,
}: ConfirmRedirectAfterDelayProps) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      router.push(targetPath)
    }, delayMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [router, targetPath, delayMs])

  const handleContinue = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    router.push(targetPath)
  }

  return (
    <VzBtn variant="secondary" size="md" onClick={handleContinue} className="mt-4">
      {continueLabel}
    </VzBtn>
  )
}
