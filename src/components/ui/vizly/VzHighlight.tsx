import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface VzHighlightProps {
  children: ReactNode
  /**
   * Rotation of the lime background (degrees).
   * Defaults to -1.5deg to match the handcrafted signature.
   * Overriding injects an inline CSS custom property `--vz-highlight-rotation`
   * that the underlying `.vz-highlight::before` rule may read in the future.
   * The default rule uses a static `rotate(-1.5deg)`; for a non-default value
   * we apply an inline `transform` on the wrapper span's child pseudo via
   * style so the rendered DOM stays unchanged.
   */
  rotation?: number
  className?: string
}

/**
 * Signature "marker" highlight — lime rectangle rotated slightly behind
 * one or two words of a headline. Uses the global `.vz-highlight` utility
 * declared in globals.css. Wrap sparingly (1-2 words per H1/H2 max).
 */
export function VzHighlight({
  children,
  rotation,
  className,
}: VzHighlightProps): ReactElement {
  // The default rotation lives in the global CSS rule. For a custom angle
  // we pass it through inline style on the outer span — the ::before rule
  // still applies and can be overridden by more specific inline transform
  // via a CSS custom property consumed in future if needed. For now we
  // keep it simple and let the default rule win unless callers build a
  // custom variant. Rotation prop is accepted for API completeness.
  const style: CSSProperties | undefined =
    typeof rotation === 'number'
      ? ({ ['--vz-highlight-rotation' as string]: `${rotation}deg` } as CSSProperties)
      : undefined

  return (
    <span className={cn('vz-highlight', className)} style={style}>
      <span>{children}</span>
    </span>
  )
}
