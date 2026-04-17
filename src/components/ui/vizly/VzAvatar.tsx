import type { CSSProperties, ReactElement } from 'react'
import { cn } from '@/lib/utils'

export interface VzAvatarProps {
  initials: string
  size?: number
  className?: string
}

/**
 * Vizly avatar — squared lime pastille with black extrabold initials.
 * Radius 8px below 48px, 10px at/above 48px (handcrafted pattern).
 * Font-size tracks ~0.32x of the size for readability.
 */
export function VzAvatar({
  initials,
  size = 40,
  className,
}: VzAvatarProps): ReactElement {
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: size >= 48 ? 10 : 8,
    fontSize: Math.round(size * 0.32),
    lineHeight: 1,
  }

  return (
    <div
      className={cn(
        'bg-accent text-foreground flex items-center justify-center font-[family-name:var(--font-satoshi)] font-extrabold flex-shrink-0 select-none',
        className,
      )}
      style={style}
      aria-hidden={false}
    >
      {initials}
    </div>
  )
}
