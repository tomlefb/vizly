'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

export default function LoginPage() {
  const t = useTranslations('auth')

  const loginSchema = z.object({
    email: z.string().email(t('errors.invalidEmail')),
    password: z.string().min(6, t('errors.passwordMin')),
  })

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.invalidData'))
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      })

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          setError(t('errors.invalidCredentials'))
        } else {
          setError(authError.message)
        }
        return
      }

      // Hard redirect to ensure cookies are propagated to the server
      window.location.href = '/dashboard'
    } catch {
      setError(t('errors.unexpected'))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError(null)

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
      setError(t('errors.unexpected'))
    }
  }

  return (
    <>
      <h1 className="text-center font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
        {t('login.title')}
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        {t('login.subtitle')}
      </p>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleEmailLogin} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t('login.email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('login.emailPlaceholder')}
            className="block w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t('login.password')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('login.passwordPlaceholder')}
            className="block w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
          />
        </div>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-muted hover:text-accent transition-colors duration-150"
          >
            {t('login.forgotPassword')}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center h-10 rounded-lg bg-[#D4634E] px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#C05640] disabled:cursor-not-allowed disabled:opacity-50"
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
              {t('login.loading')}
            </span>
          ) : (
            t('login.submit')
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted">{t('login.or')}</span>
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
        {t('login.google')}
      </button>

      <p className="mt-8 text-center text-sm text-muted">
        {t('login.noAccount')}{' '}
        <Link
          href="/register"
          className="font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
        >
          {t('login.createAccount')}
        </Link>
      </p>
    </>
  )
}
