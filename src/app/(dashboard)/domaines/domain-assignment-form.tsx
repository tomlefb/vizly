'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateCustomDomain } from '@/actions/portfolio'

interface DomainAssignmentFormProps {
  portfolioId: string
  currentDomain: string
}

export function DomainAssignmentForm({ portfolioId, currentDomain }: DomainAssignmentFormProps) {
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
        className="flex-1 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      <button
        type="submit"
        disabled={isPending || domain.trim() === currentDomain}
        className="shrink-0 inline-flex items-center rounded-[var(--radius-md)] bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Enregistrement...' : 'Enregistrer'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-green-600">Sauvegarde</p>}
    </form>
  )
}
