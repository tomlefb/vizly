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
      // Unpublish
      startTransition(async () => {
        const result = await unpublishPortfolio(portfolioId)
        if (result.error) {
          setError(result.error)
        } else {
          router.refresh()
        }
      })
    } else {
      // Publish — need a slug
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
    <div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-xs font-semibold transition-all duration-200',
          published
            ? 'border border-border text-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200'
            : canPublish
              ? 'bg-success/10 text-success hover:bg-success/20'
              : 'bg-surface-warm text-muted-foreground cursor-not-allowed'
        )}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : published ? (
          <GlobeLock className="h-3.5 w-3.5" />
        ) : (
          <Globe className="h-3.5 w-3.5" />
        )}
        {published ? t('publish.unpublish') : t('publish.publish')}
      </button>
      {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
      {!published && !canPublish && planMessage && (
        <p className="mt-1 text-[10px] text-muted-foreground">{planMessage}</p>
      )}
    </div>
  )
}
