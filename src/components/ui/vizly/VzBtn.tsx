'use client'

import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ForwardedRef } from 'react'
import { cn } from '@/lib/utils'

type VzBtnVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type VzBtnSize = 'sm' | 'md' | 'lg'

export interface VzBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: VzBtnVariant
  size?: VzBtnSize
}

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

/**
 * Vizly primary button (Handcrafted direction).
 * Black body + lime offset shadow + press shift on hover.
 * Variants: primary | secondary | ghost | destructive.
 * Sizes: sm | md (default) | lg.
 */
export const VzBtn = forwardRef<HTMLButtonElement, VzBtnProps>(function VzBtn(
  {
    variant = 'primary',
    size = 'md',
    className,
    type,
    children,
    ...rest
  }: VzBtnProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const base =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-[family-name:var(--font-satoshi)] font-semibold transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50 disabled:pointer-events-none'

  const variantClass = VARIANT_CLASSES[variant]
  const sizeClass = SIZE_CLASSES[size]
  const shadowClass = variant === 'primary' ? primaryShadowClasses(size) : ''

  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(base, sizeClass, variantClass, shadowClass, className)}
      {...rest}
    >
      {children}
    </button>
  )
})
