import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type VzBadgeVariant = 'online' | 'draft' | 'pro' | 'popular'

export interface VzBadgeProps {
  variant?: VzBadgeVariant
  children: ReactNode
  className?: string
}

const VARIANT_CLASSES: Record<VzBadgeVariant, string> = {
  // Success tokens aren't mapped as Tailwind color utilities by @theme
  // (they live alongside in @theme but the bg/fg pairing reads cleaner
  // inline); var() arbitrary values are tokens, not hex.
  online:
    'bg-[var(--color-success-bg)] text-[var(--color-success-fg)]',
  draft: 'bg-surface-warm text-muted border border-border-light',
  pro: 'bg-accent text-accent-fg',
  popular: 'bg-foreground text-accent',
}

/**
 * Vizly status badge (pill).
 * Small uppercase label with tight tracking, Satoshi weight.
 * Variants map to the handcrafted status set:
 * - online   → EN LIGNE   (green success pair)
 * - draft    → BROUILLON  (cream warm, muted text, hairline border)
 * - pro      → PRO        (lime accent, black text)
 * - popular  → POPULAIRE  (black, lime text — inverse of pro)
 */
export function VzBadge({
  variant = 'online',
  children,
  className,
}: VzBadgeProps): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] font-[family-name:var(--font-satoshi)]',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
