import Link from 'next/link'
import type { ReactElement } from 'react'
import { cn } from '@/lib/utils'

export interface VzLogoProps {
  size?: number
  dark?: boolean
  className?: string
  href?: string
}

/**
 * Vizly wordmark with signature saffron dot.
 * - On light surfaces: text is `foreground`, dot is `accent-deep` (#C2831A).
 * - On dark surfaces (dark=true): text is `surface-warm`, dot is `accent` (#F1B434).
 * - Optional `href` wraps the mark in a Next.js Link.
 */
export function VzLogo({
  size = 20,
  dark = false,
  className,
  href,
}: VzLogoProps): ReactElement {
  const content = (
    <span
      className={cn(
        'font-[family-name:var(--font-satoshi)] font-extrabold tracking-[-0.02em] select-none inline-flex items-baseline',
        dark ? 'text-surface-warm' : 'text-foreground',
        className,
      )}
      style={{ fontSize: size, lineHeight: 1 }}
    >
      Vizly
      <span className={dark ? 'text-accent' : 'text-accent-deep'}>.</span>
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-baseline">
        {content}
      </Link>
    )
  }

  return content
}
