import { cn } from '@/lib/utils'

export type VzBtnVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type VzBtnSize = 'sm' | 'md' | 'lg'

const SIZE_CLASSES: Record<VzBtnSize, string> = {
  sm: 'px-3.5 py-2 text-[13px]',
  md: 'px-[18px] py-[11px] text-sm',
  lg: 'px-[22px] py-3.5 text-[15px]',
}

/**
 * Shadow offset classes per variant/size.
 * Primary uses the signature lime offset shadow; hover reduces it by 1px
 * while the button shifts translate-x-px translate-y-px (effet "appui").
 */
function primaryShadowClasses(size: VzBtnSize): string {
  if (size === 'lg') {
    return 'shadow-[3px_3px_0_var(--color-accent)] hover:shadow-[2px_2px_0_var(--color-accent)]'
  }
  // sm and md share the 2px -> 1px pattern
  return 'shadow-[2px_2px_0_var(--color-accent)] hover:shadow-[1px_1px_0_var(--color-accent)]'
}

const VARIANT_CLASSES: Record<VzBtnVariant, string> = {
  primary:
    'bg-foreground text-white rounded-[var(--radius-md)] hover:translate-x-px hover:translate-y-px',
  secondary:
    'bg-surface text-foreground border-[1.5px] border-foreground rounded-[var(--radius-md)] hover:bg-surface-warm',
  ghost:
    'bg-transparent text-muted hover:text-foreground',
  destructive:
    'bg-transparent text-destructive border border-destructive/30 rounded-[var(--radius-md)] hover:bg-destructive/5',
}

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-[family-name:var(--font-satoshi)] font-semibold transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50 disabled:pointer-events-none'

/**
 * Returns the full set of Vizly button classes for a given variant/size.
 * Safe to call from Server Components (this file has no "use client").
 * Use this when you want to style a `<Link>` or `<a>` like a VzBtn —
 * since `<a><button>` nesting is invalid HTML, direct `<Link className={...}>`
 * is the right pattern for marketing CTAs.
 */
export function vzBtnClasses({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: VzBtnVariant
  size?: VzBtnSize
  className?: string
} = {}): string {
  const shadowClass = variant === 'primary' ? primaryShadowClasses(size) : ''
  return cn(
    BASE_CLASSES,
    SIZE_CLASSES[size],
    VARIANT_CLASSES[variant],
    shadowClass,
    className,
  )
}
