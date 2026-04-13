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
        className="flex-1 h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
      />
      <button
        type="submit"
        disabled={isPending || domain.trim() === currentDomain}
        className="shrink-0 inline-flex items-center h-10 rounded-lg bg-[#D4634E] px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#C05640] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Enregistrement...' : 'Enregistrer'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-green-600">Sauvegarde</p>}
    </form>
  )
}
