'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { registerUser, verifyUserOtp, resendSignupOtp } from '@/actions/auth'
import { getDashboardUrl } from '@/lib/auth/dashboardUrl'
import { z } from 'zod'

type Step = 'form' | 'otp' | 'redirecting'

export default function RegisterPage() {
  // Suspense boundary required by Next 15 because RegisterPageInner reads
  // useSearchParams() — without it, the static prerender of /register
  // bails out with a missing-suspense-with-csr-bailout error.
  return (
    <Suspense fallback={null}>
      <RegisterPageInner />
    </Suspense>
  )
}

function RegisterPageInner() {
  const t = useTranslations('auth')
  const searchParams = useSearchParams()

  // Preserve plan/interval query params from the pricing CTA through
  // the OTP flow (and through Google OAuth via the callback's ?next=)
  // so /dashboard can auto-open the checkout modal post-signup.
  const dashboardUrl = getDashboardUrl(searchParams)

  const registerSchema = z.object({
    name: z.string().min(1, t('errors.nameRequired')).max(100),
    email: z.string().email(t('errors.invalidEmail')),
    password: z.string().min(6, t('errors.passwordMin')),
  })
  const otpSchema = z
    .string()
    .regex(/^\d{6}$/, t('verify.errors.invalidFormat'))

  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resendInfo, setResendInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const parsed = registerSchema.safeParse({ name, email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.invalidData'))
      return
    }

    setLoading(true)

    try {
      const result = await registerUser({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      })

      if (!result.ok) {
        if (result.code === 'already_registered') {
          setError(t('errors.alreadyRegistered'))
        } else {
          setError(result.error)
        }
        return
      }

      setStep('otp')
    } catch {
      setError(t('errors.unexpected'))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setResendInfo(null)

    const parsed = otpSchema.safeParse(otp)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('verify.errors.invalidFormat'))
      return
    }

    setLoading(true)

    try {
      const result = await verifyUserOtp({ email, token: parsed.data })

      if (!result.ok) {
        if (result.code === 'invalid_token') {
          setError(t('verify.errors.invalidToken'))
        } else if (result.code === 'rate_limited') {
          setError(t('verify.errors.rateLimited'))
        } else {
          setError(result.error)
        }
        setLoading(false)
        return
      }

      // Swap to the redirecting screen first, then trigger the hard
      // reload on a microtask so React can paint the new screen before
      // the page unloads. Without this, the OTP step briefly flashes
      // back to the default 'form' screen during the transition.
      setStep('redirecting')
      setTimeout(() => {
        window.location.href = dashboardUrl
      }, 100)
    } catch {
      setError(t('errors.unexpected'))
      setLoading(false)
    }
  }

  async function handleResend() {
    setError(null)
    setResendInfo(null)
    setResending(true)

    try {
      const result = await resendSignupOtp(email)
      if (!result.ok) {
        if (result.code === 'rate_limited') {
          setError(t('verify.errors.rateLimited'))
        } else {
          setError(result.error)
        }
        return
      }
      setResendInfo(t('verify.resendSuccess'))
    } catch {
      setError(t('errors.unexpected'))
    } finally {
      setResending(false)
    }
  }

  function handleChangeEmail() {
    setStep('form')
    setOtp('')
    setError(null)
    setResendInfo(null)
  }

  async function handleGoogleLogin() {
    setError(null)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(dashboardUrl)}`,
        },
      })

      if (authError) {
        setError(authError.message)
      }
    } catch {
      setError(t('errors.unexpected'))
    }
  }

  if (step === 'redirecting') {
    return (
      <div className="flex flex-col items-center text-center">
        <svg
          className="h-8 w-8 animate-spin text-muted"
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
        <p className="mt-4 text-sm text-muted">{t('verify.redirecting')}</p>
      </div>
    )
  }

  if (step === 'otp') {
    return (
      <>
        <h1 className="text-center font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
          {t('verify.title')}
        </h1>
        <p className="mt-2 text-center text-sm text-muted leading-relaxed">
          {t('verify.subtitle', { email })}
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {resendInfo && (
          <div
            role="status"
            className="mt-6 rounded-[var(--radius-md)] border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
          >
            {resendInfo}
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="otp"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {t('verify.code')}
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('verify.codePlaceholder')}
              className="block w-full h-12 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-center text-2xl font-semibold tracking-[0.3em] text-[#111827] placeholder:text-[#9CA3AF] placeholder:tracking-normal placeholder:text-base placeholder:font-normal transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
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
                {t('verify.loading')}
              </span>
            ) : (
              t('verify.submit')
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3 text-sm">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-muted transition-colors duration-150 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resending ? t('verify.resending') : t('verify.resend')}
          </button>
          <button
            type="button"
            onClick={handleChangeEmail}
            className="text-muted transition-colors duration-150 hover:text-foreground"
          >
            {t('verify.changeEmail')}
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="text-center font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
        {t('register.title')}
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        {t('register.subtitle')}
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
            {t('register.name')}
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('register.namePlaceholder')}
            className="block w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t('register.email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('register.emailPlaceholder')}
            className="block w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t('register.password')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('register.passwordPlaceholder')}
            className="block w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
          />
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
              {t('register.loading')}
            </span>
          ) : (
            t('register.submit')
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted">{t('register.or')}</span>
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
        {t('register.google')}
      </button>

      <p className="mt-4 text-center text-xs text-muted leading-relaxed">
        {t('register.legalNotice')}{' '}
        <Link href="/legal/cgu" target="_blank" className="underline text-foreground hover:text-accent">
          {t('register.cgu')}
        </Link>{' '}
        {t('register.and')}{' '}
        <Link href="/legal/confidentialite" target="_blank" className="underline text-foreground hover:text-accent">
          {t('register.privacy')}
        </Link>.
      </p>

      <p className="mt-8 text-center text-sm text-muted">
        {t('register.hasAccount')}{' '}
        <Link
          href="/login"
          className="font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
        >
          {t('register.login')}
        </Link>
      </p>
    </>
  )
}
