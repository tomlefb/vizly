'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateCustomDomain } from '@/actions/portfolio'

interface CustomDomainFormProps {
  initialDomain: string
}

export function CustomDomainForm({ initialDomain }: CustomDomainFormProps) {
  const router = useRouter()
  const [domain, setDomain] = useState(initialDomain)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await updateCustomDomain(domain.trim())
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="custom-domain" className="block text-sm font-medium text-foreground mb-1.5">
        Domaine personnalise
      </label>
      <p className="text-xs text-muted mb-3">
        Connecte ton propre nom de domaine a ton portfolio. Laisse vide pour utiliser pseudo.vizly.fr uniquement.
      </p>
      <div className="flex gap-3">
        <input
          id="custom-domain"
          type="text"
          value={domain}
          onChange={(e) => {
            setDomain(e.target.value)
            setError(null)
            setSuccess(false)
          }}
          placeholder="monsite.com"
          className="flex-1 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="submit"
          disabled={isPending || domain.trim() === initialDomain}
          className="inline-flex items-center rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {success && (
        <div className="mt-3 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50/80 p-3">
          <p className="text-sm font-medium text-amber-800">
            Domaine sauvegarde
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Configure un enregistrement CNAME pointant vers <span className="font-mono font-medium">cname.vizly.fr</span> chez ton registrar DNS.
          </p>
        </div>
      )}
    </form>
  )
}
