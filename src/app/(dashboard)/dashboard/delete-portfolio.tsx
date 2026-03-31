'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { deletePortfolio } from '@/actions/portfolio'

interface DeletePortfolioProps {
  portfolioId: string
  portfolioTitle: string
}

export function DeletePortfolio({ portfolioId, portfolioTitle }: DeletePortfolioProps) {
  const router = useRouter()
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
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Confirmer
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
          className="text-xs text-muted hover:text-foreground"
        >
          Annuler
        </button>
        {error && <span className="text-[10px] text-red-600">{error}</span>}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-border w-8 h-8 text-muted transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
      title={`Supprimer ${portfolioTitle}`}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}
