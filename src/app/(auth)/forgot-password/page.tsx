'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

const emailSchema = z.string().email('Adresse email invalide')

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Email invalide')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        parsed.data,
        { redirectTo: `${window.location.origin}/auth/callback?next=/settings` }
      )

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSent(true)
    } catch {
      setError('Une erreur inattendue est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <svg
            className="h-7 w-7 text-success"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
          Email envoye
        </h1>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          Si un compte existe pour <span className="font-medium text-foreground">{email}</span>,
          tu recevras un lien pour reinitialiser ton mot de passe.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
        >
          Retour a la connexion
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-center font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
        Mot de passe oublie
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        Entre ton email pour recevoir un lien de reinitialisation.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.com"
            className="block w-full rounded-[var(--radius-md)] border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 hover:border-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        <Link
          href="/login"
          className="font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
        >
          Retour a la connexion
        </Link>
      </p>
    </>
  )
}
