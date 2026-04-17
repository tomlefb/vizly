import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BrowserFrameProps {
  url?: string
  children: ReactNode
  className?: string
}

export function BrowserFrame({ url = 'pseudo.vizly.fr', children, className }: BrowserFrameProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-border-light overflow-hidden bg-surface',
        className,
      )}
    >
      <div className="flex items-center gap-2 bg-surface-warm px-3 py-1.5 border-b border-border-light">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="rounded-[2px] bg-background border border-border-light px-2 py-px text-[9px] text-muted font-mono">
            {url}
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
