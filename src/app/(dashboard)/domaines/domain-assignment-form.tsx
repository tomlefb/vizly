'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateCustomDomain } from '@/actions/portfolio'

interface DomainAssignmentFormProps {
  portfolioId: string
  currentDomain: string
}

export function DomainAssignmentForm({
  portfolioId,
  currentDomain,
}: DomainAssignmentFormProps) {
  const router = useRouter()
  const [domain, setDomain] = useState(currentDomain)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await updateCustomDomain(portfolioId, domain.trim())
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={domain}
          onChange={(e) => {
            setDomain(e.target.value)
            setError(null)
            setSuccess(false)
          }}
          placeholder="monsite.com"
          className="h-10 min-w-0 flex-1 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
        />
        <button
          type="submit"
          disabled={isPending || domain.trim() === currentDomain}
          className="inline-flex h-10 shrink-0 items-center rounded-[var(--radius-md)] bg-accent px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-success" role="status">
          Domaine enregistré.
        </p>
      )}
    </div>
  )
}
