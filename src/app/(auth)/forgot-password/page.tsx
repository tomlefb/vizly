'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  requestPasswordReset,
  verifyPasswordResetOtp,
  updateUserPassword,
} from '@/actions/auth'
import { VzBtn } from '@/components/ui/vizly'
import { z } from 'zod'

type Step = 'email' | 'otp' | 'password' | 'done' | 'redirecting'

const INPUT_CLASSES =
  'block w-full h-10 rounded-[var(--radius-md)] border border-border-light bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:border-accent-deep focus:ring-2 focus:ring-accent/30'

const OTP_INPUT_CLASSES =
  'block w-full h-12 rounded-[var(--radius-md)] border border-border-light bg-surface px-3 text-center text-2xl font-semibold tracking-[0.3em] text-foreground placeholder:text-muted-foreground placeholder:tracking-normal placeholder:text-base placeholder:font-normal transition-colors duration-150 focus:outline-none focus:border-accent-deep focus:ring-2 focus:ring-accent/30'

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
      <div className="flex flex-col items-center py-6 text-center">
        <Spinner className="h-8 w-8 text-muted" />
        <p className="mt-4 text-sm text-muted">{t('resetPassword.redirecting')}</p>
      </div>
    )
  }

  // --- done ----------------------------------------------------------------

  if (step === 'done') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-success-bg)]">
          <svg
            className="h-6 w-6 text-[var(--color-success-fg)]"
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
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t('resetPassword.doneTitle')}
        </h1>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          {sessionFullAfterUpdate
            ? t('resetPassword.doneSubtitleLoggedIn')
            : t('resetPassword.doneSubtitleLoggedOut')}
        </p>
        <div className="mt-6 flex justify-center">
          {sessionFullAfterUpdate ? (
            <VzBtn
              type="button"
              variant="primary"
              size="lg"
              onClick={handleGoToDashboard}
            >
              {t('resetPassword.goToDashboard')}
            </VzBtn>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] bg-foreground px-[22px] py-3.5 text-[15px] font-semibold font-[family-name:var(--font-satoshi)] text-white shadow-[3px_3px_0_var(--color-accent)] transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--color-accent)]"
            >
              {t('resetPassword.goToLogin')}
            </Link>
          )}
        </div>
      </div>
    )
  }

  // --- password ------------------------------------------------------------

  if (step === 'password') {
    return (
      <>
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t('resetPassword.passwordTitle')}
        </h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          {t('resetPassword.passwordSubtitle')}
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-[var(--radius-md)] border border-destructive/30 bg-[var(--color-destructive-bg)] px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="mt-7 space-y-4">
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
              className={INPUT_CLASSES}
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
              className={INPUT_CLASSES}
            />
          </div>

          <VzBtn
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading || password.length < 6 || passwordConfirm.length < 6}
            className="w-full"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner />
                {t('resetPassword.updateLoading')}
              </span>
            ) : (
              t('resetPassword.updateSubmit')
            )}
          </VzBtn>
        </form>
      </>
    )
  }

  // --- otp -----------------------------------------------------------------

  if (step === 'otp') {
    return (
      <>
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t('resetPassword.otpTitle')}
        </h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          {t('resetPassword.otpSubtitle', { email })}
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-[var(--radius-md)] border border-destructive/30 bg-[var(--color-destructive-bg)] px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {resendInfo && (
          <div
            role="status"
            className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-success-fg)]/20 bg-[var(--color-success-bg)] px-4 py-3 text-sm text-[var(--color-success-fg)]"
          >
            {resendInfo}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="mt-7 space-y-4">
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
              className={OTP_INPUT_CLASSES}
            />
          </div>

          <VzBtn
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading || otp.length !== 6}
            className="w-full"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner />
                {t('resetPassword.verifyLoading')}
              </span>
            ) : (
              t('resetPassword.verifySubmit')
            )}
          </VzBtn>
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
      <h1 className="font-[family-name:var(--font-satoshi)] text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
        {t('forgotPassword.title')}
      </h1>
      <p className="mt-2 text-sm text-muted">{t('forgotPassword.subtitle')}</p>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-[var(--radius-md)] border border-destructive/30 bg-[var(--color-destructive-bg)] px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleRequestEmail} className="mt-7 space-y-4">
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
            className={INPUT_CLASSES}
          />
        </div>

        <VzBtn
          type="submit"
          variant="primary"
          size="lg"
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner />
              {t('forgotPassword.loading')}
            </span>
          ) : (
            t('forgotPassword.submit')
          )}
        </VzBtn>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <Link
          href="/login"
          className="font-medium text-accent-deep underline-offset-4 transition-colors duration-150 hover:underline"
        >
          {t('forgotPassword.backToLogin')}
        </Link>
      </p>
    </>
  )
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? 'h-4 w-4 animate-spin'}
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
