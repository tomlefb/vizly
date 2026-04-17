'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Globe, GlobeLock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { publishPortfolio, unpublishPortfolio } from '@/actions/portfolio'

interface PublishToggleProps {
  portfolioId: string
  slug: string | null
  published: boolean
  canPublish: boolean
  planMessage?: string
}

export function PublishToggle({
  portfolioId,
  slug,
  published,
  canPublish,
  planMessage,
}: PublishToggleProps) {
  const router = useRouter()
  const t = useTranslations('dashboard')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleToggle() {
    setError(null)

    if (published) {
      startTransition(async () => {
        const result = await unpublishPortfolio(portfolioId)
        if (result.error) {
          setError(result.error)
        } else {
          router.refresh()
        }
      })
    } else {
      if (!slug) {
        setError(t('publish.noSlug'))
        return
      }
      startTransition(async () => {
        const result = await publishPortfolio(portfolioId, slug)
        if (result.error) {
          setError(result.error)
        } else {
          router.refresh()
        }
      })
    }
  }

  const disabled = isPending || (!published && !canPublish)

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3.5 py-2 text-[13px] font-semibold transition-all duration-150',
          published
            ? 'border border-border-light text-foreground hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive'
            : canPublish
              ? 'border border-border-light bg-[var(--color-success-bg)] text-[var(--color-success-fg)] hover:bg-[var(--color-success-bg)]/80'
              : 'cursor-not-allowed border border-border-light bg-surface-warm text-muted-foreground',
        )}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : published ? (
          <GlobeLock className="h-3.5 w-3.5" strokeWidth={1.5} />
        ) : (
          <Globe className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
        {published ? t('publish.unpublish') : t('publish.publish')}
      </button>
      {error && <span className="text-[11px] text-destructive">{error}</span>}
      {!published && !canPublish && planMessage && (
        <span className="text-[11px] text-muted-foreground">{planMessage}</span>
      )}
    </div>
  )
}
