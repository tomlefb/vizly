import { cn } from '@/lib/utils'

const sizeMap = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
} as const

export function Logo({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <span
      className={cn(
        'font-[family-name:var(--font-satoshi)] font-bold tracking-tight select-none',
        sizeMap[size],
        className
      )}
    >
      Vizly
      <span className="inline-block w-[0.28em] h-[0.28em] rounded-full bg-accent ml-[0.05em] -translate-y-[0.1em]" />
    </span>
  )
}
