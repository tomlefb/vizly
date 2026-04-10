'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const parsed = registerSchema.safeParse({ name, email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Données invalides')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            full_name: parsed.data.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Un compte existe déjà avec cet email')
        } else {
          setError(authError.message)
        }
        return
      }

      setSuccess(true)
    } catch {
      setError('Une erreur inattendue est survenue')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError(null)

    if (!acceptTerms) {
      setError('Tu dois accepter les CGU et la Politique de Confidentialité')
      return
    }

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
      }
    } catch {
      setError('Une erreur inattendue est survenue')
    }
  }

  if (success) {
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
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
          Vérifie ta boîte mail
        </h1>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          Un email de confirmation a été envoyé à{' '}
          <span className="font-medium text-foreground">{email}</span>.
          <br />
          Clique sur le lien pour activer ton compte.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
        >
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-center font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
        Créer un compte
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        Crée ton portfolio en quelques minutes
      </p>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Nom complet
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jean Dupont"
            className="block w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
          />
        </div>

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
            className="block w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6 caractères minimum"
            className="block w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            required
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border border-border accent-accent"
          />
          <span className="text-xs text-muted leading-relaxed">
            J&apos;accepte les{' '}
            <Link href="/legal/cgu" target="_blank" className="underline text-foreground hover:text-accent">
              Conditions Générales d&apos;Utilisation
            </Link>{' '}
            et la{' '}
            <Link href="/legal/confidentialite" target="_blank" className="underline text-foreground hover:text-accent">
              Politique de Confidentialité
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !acceptTerms}
          className="flex w-full items-center justify-center h-10 rounded-lg bg-[#E8553D] px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#D4442E] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Création...
            </span>
          ) : (
            'Créer mon compte'
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted">ou</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="flex w-full items-center justify-center gap-3 h-10 rounded-lg border border-[#E5E7EB] bg-white px-5 text-sm font-medium text-[#111827] transition-colors duration-150 hover:bg-[#F3F4F6]"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continuer avec Google
      </button>

      <p className="mt-8 text-center text-sm text-muted">
        Déjà un compte ?{' '}
        <Link
          href="/login"
          className="font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
        >
          Se connecter
        </Link>
      </p>
    </>
  )
}
