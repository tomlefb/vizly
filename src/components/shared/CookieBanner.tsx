'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'vizly-cookie-ack'

export function CookieBanner() {
  const t = useTranslations('cookieBanner')
  const [visible, setVisible] = useState(false)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    let shouldShow = true
    try {
      shouldShow = localStorage.getItem(STORAGE_KEY) !== '1'
    } catch {
      // storage disabled — affiche le bandeau
    }
    if (shouldShow) {
      setVisible(true)
      const raf = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(raf)
    }
  }, [])

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // storage disabled — banner restera affiché jusqu'au prochain accept
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Information cookies"
      className={cn(
        'fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl',
        'rounded-[var(--radius-lg)] border border-border bg-surface',
        'shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-4 sm:p-5',
        'transition-all duration-300 ease-out',
        entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
        <p className="text-sm text-foreground leading-relaxed">
          {t('body')}{' '}
          <Link
            href="/legal/confidentialite"
            className="font-medium text-accent-deep underline underline-offset-4 transition-colors hover:text-accent"
          >
            {t('learnMore')}
          </Link>
        </p>
        <button
          type="button"
          onClick={accept}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
        >
          {t('accept')}
        </button>
      </div>
    </div>
  )
}
