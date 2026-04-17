'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  requestPasswordReset,
  verifyPasswordResetOtp,
  updateUserPassword,
} from '@/actions/auth'
import { z } from 'zod'

type Step = 'email' | 'otp' | 'password' | 'done' | 'redirecting'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')

  const emailSchema = z.string().email(t('errors.invalidEmail'))
  const otpSchema = z
    .string()
    .regex(/^\d{6}$/, t('verify.errors.invalidFormat'))
  const passwordSchema = z
    .string()
    .min(6, t('resetPassword.errors.passwordMin'))

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [sessionFullAfterUpdate, setSessionFullAfterUpdate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendInfo, setResendInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleRequestEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.invalidEmail'))
      return
    }

    setLoading(true)

    try {
      const result = await requestPasswordReset(parsed.data)

      if (!result.ok) {
        if (result.code === 'rate_limited') {
          setError(t('verify.errors.rateLimited'))
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

  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
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
      const result = await verifyPasswordResetOtp({ email, token: parsed.data })

      if (!result.ok) {
        if (result.code === 'invalid_token') {
          setError(t('verify.errors.invalidToken'))
        } else if (result.code === 'rate_limited') {
          setError(t('verify.errors.rateLimited'))
        } else {
          setError(result.error)
        }
        return
      }

      setStep('password')
    } catch {
      setError(t('errors.unexpected'))
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const parsed = passwordSchema.safeParse(password)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('resetPassword.errors.passwordMin'))
      return
    }

    if (password !== passwordConfirm) {
      setError(t('resetPassword.errors.passwordMismatch'))
      return
    }

    setLoading(true)

    try {
      const result = await updateUserPassword(parsed.data)

      if (!result.ok) {
        if (result.code === 'not_authenticated') {
          setError(t('resetPassword.errors.notAuthenticated'))
        } else {
          setError(result.error)
        }
        setLoading(false)
        return
      }

      setSessionFullAfterUpdate(result.sessionFullAfterUpdate)
      setStep('done')
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
      const result = await requestPasswordReset(email)
      if (!result.ok) {
        if (result.code === 'rate_limited') {
          setError(t('verify.errors.rateLimited'))
        } else {
          setError(result.error)
        }
        return
      }
      setResendInfo(t('resetPassword.resendSuccess'))
    } catch {
      setError(t('errors.unexpected'))
    } finally {
      setResending(false)
    }
  }

  function handleChangeEmail() {
    setStep('email')
    setOtp('')
    setError(null)
    setResendInfo(null)
  }

  function handleGoToDashboard() {
    setStep('redirecting')
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 100)
  }

  // --- redirecting ---------------------------------------------------------

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
        <p className="mt-4 text-sm text-muted">{t('resetPassword.redirecting')}</p>
      </div>
    )
  }

  // --- done ----------------------------------------------------------------

  if (step === 'done') {
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
          {t('resetPassword.doneTitle')}
        </h1>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          {sessionFullAfterUpdate
            ? t('resetPassword.doneSubtitleLoggedIn')
            : t('resetPassword.doneSubtitleLoggedOut')}
        </p>
        {sessionFullAfterUpdate ? (
          <button
            type="button"
            onClick={handleGoToDashboard}
            className="mt-6 inline-flex items-center justify-center h-10 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
          >
            {t('resetPassword.goToDashboard')}
          </button>
        ) : (
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center h-10 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
          >
            {t('resetPassword.goToLogin')}
          </Link>
        )}
      </div>
    )
  }

  // --- password ------------------------------------------------------------

  if (step === 'password') {
    return (
      <>
        <h1 className="text-center font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
          {t('resetPassword.passwordTitle')}
        </h1>
        <p className="mt-2 text-center text-sm text-muted leading-relaxed">
          {t('resetPassword.passwordSubtitle')}
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {t('resetPassword.password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('resetPassword.passwordPlaceholder')}
              className="block w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
            />
          </div>

          <div>
            <label
              htmlFor="passwordConfirm"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {t('resetPassword.passwordConfirm')}
            </label>
            <input
              id="passwordConfirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder={t('resetPassword.passwordConfirmPlaceholder')}
              className="block w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || password.length < 6 || passwordConfirm.length < 6}
            className="flex w-full items-center justify-center h-10 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner />
                {t('resetPassword.updateLoading')}
              </span>
            ) : (
              t('resetPassword.updateSubmit')
            )}
          </button>
        </form>
      </>
    )
  }

  // --- otp -----------------------------------------------------------------

  if (step === 'otp') {
    return (
      <>
        <h1 className="text-center font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">
          {t('resetPassword.otpTitle')}
        </h1>
        <p className="mt-2 text-center text-sm text-muted leading-relaxed">
          {t('resetPassword.otpSubtitle', { email })}
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

        <form onSubmit={handleVerifyOtp} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="otp"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {t('resetPassword.code')}
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
              placeholder={t('resetPassword.codePlaceholder')}
              className="block w-full h-12 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-center text-2xl font-semibold tracking-[0.3em] text-[#111827] placeholder:text-[#9CA3AF] placeholder:tracking-normal placeholder:text-base placeholder:font-normal transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="flex w-full items-center justify-center h-10 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner />
                {t('resetPassword.verifyLoading')}
              </span>
            ) : (
              t('resetPassword.verifySubmit')
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
            {resending ? t('resetPassword.resending') : t('resetPassword.resend')}
          </button>
          <button
            type="button"
            onClick={handleChangeEmail}
            className="text-muted transition-colors duration-150 hover:text-foreground"
          >
            {t('resetPassword.changeEmail')}
          </button>
        </div>
      </>
    )
  }

  // --- email (default) -----------------------------------------------------

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

      <form onSubmit={handleRequestEmail} className="mt-8 space-y-4">
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
          className="flex w-full items-center justify-center h-10 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner />
              {t('forgotPassword.loading')}
            </span>
          ) : (
            t('forgotPassword.submit')
          )}
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

function Spinner() {
  return (
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
  )
}
