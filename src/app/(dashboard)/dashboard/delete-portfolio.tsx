'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Trash2, Loader2 } from 'lucide-react'
import { deletePortfolio } from '@/actions/portfolio'

interface DeletePortfolioProps {
  portfolioId: string
  portfolioTitle: string
}

export function DeletePortfolio({ portfolioId, portfolioTitle }: DeletePortfolioProps) {
  const router = useRouter()
  const t = useTranslations('dashboard')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deletePortfolio(portfolioId)
      if (result.error) {
        setError(result.error)
        setShowConfirm(false)
      } else {
        router.refresh()
      }
    })
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-destructive px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          {t('delete.confirm')}
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
          className="text-[12px] text-muted transition-colors hover:text-foreground"
        >
          {t('delete.cancel')}
        </button>
        {error && <span className="text-[10px] text-destructive">{error}</span>}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border-light text-muted transition-colors hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
      title={t('delete.title', { title: portfolioTitle })}
      aria-label={t('delete.title', { title: portfolioTitle })}
    >
      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
    </button>
  )
}
