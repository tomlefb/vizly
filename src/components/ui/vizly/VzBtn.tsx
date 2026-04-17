'use client'

import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ForwardedRef } from 'react'
import { vzBtnClasses } from './vzBtnClasses'

type VzBtnVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type VzBtnSize = 'sm' | 'md' | 'lg'

export interface VzBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: VzBtnVariant
  size?: VzBtnSize
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
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={vzBtnClasses({ variant, size, className })}
      {...rest}
    >
      {children}
    </button>
  )
})
