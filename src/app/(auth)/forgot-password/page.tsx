'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')

  const emailSchema = z.string().email(t('errors.invalidEmail'))
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.invalidEmail'))
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
      setError(t('errors.unexpected'))
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
          {t('forgotPassword.successTitle')}
        </h1>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          {t('forgotPassword.successMessage', { email })}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
        >
          {t('forgotPassword.backToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-center font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
        {t('forgotPassword.title')}
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        {t('forgotPassword.subtitle')}
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
            {t('forgotPassword.email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('forgotPassword.emailPlaceholder')}
            className="block w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center h-10 rounded-lg bg-[#E8553D] px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#D4442E] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? t('forgotPassword.loading') : t('forgotPassword.submit')}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        <Link
          href="/login"
          className="font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
        >
          {t('forgotPassword.backToLogin')}
        </Link>
      </p>
    </>
  )
}
