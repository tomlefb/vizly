'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { registerUser, verifyUserOtp, resendSignupOtp } from '@/actions/auth'
import { getDashboardUrl } from '@/lib/auth/dashboardUrl'
import { VzBtn } from '@/components/ui/vizly'
import { cn } from '@/lib/utils'
import { z } from 'zod'

type Step = 'form' | 'otp' | 'redirecting'

const INPUT_CLASSES =
  'block w-full h-10 rounded-[var(--radius-md)] border border-border-light bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:border-accent-deep focus:ring-2 focus:ring-accent/30'

const OTP_INPUT_CLASSES =
  'block w-full h-12 rounded-[var(--radius-md)] border border-border-light bg-surface px-3 text-center text-2xl font-semibold tracking-[0.3em] text-foreground placeholder:text-muted-foreground placeholder:tracking-normal placeholder:text-base placeholder:font-normal transition-colors duration-150 focus:outline-none focus:border-accent-deep focus:ring-2 focus:ring-accent/30'

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendInfo, setResendInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const parsed = registerSchema.safeParse({ name, email, password })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === 'string' && !next[key]) next[key] = issue.message
      }
      setFieldErrors(next)
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
    setOtpError(null)
    setResendInfo(null)

    const parsed = otpSchema.safeParse(otp)
    if (!parsed.success) {
      setOtpError(parsed.error.issues[0]?.message ?? t('verify.errors.invalidFormat'))
      return
    }

    setLoading(true)

    try {
      const result = await verifyUserOtp({ email, token: parsed.data })

      if (!result.ok) {
        if (result.code === 'invalid_token') {
          setOtpError(t('verify.errors.invalidToken'))
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
    setOtpError(null)
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
      <div className="flex flex-col items-center py-6 text-center">
        <Spinner className="h-8 w-8 text-muted" />
        <p className="mt-4 text-sm text-muted">{t('verify.redirecting')}</p>
      </div>
    )
  }

  if (step === 'otp') {
    return (
      <>
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t('verify.title')}
        </h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          {t('verify.subtitle', { email })}
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

        <form onSubmit={handleVerify} noValidate className="mt-7 space-y-4">
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
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                if (otpError) setOtpError(null)
              }}
              placeholder={t('verify.codePlaceholder')}
              className={cn(OTP_INPUT_CLASSES, otpError && 'border-destructive focus:border-destructive focus:ring-destructive/20')}
              aria-invalid={!!otpError}
              aria-describedby={otpError ? 'otp-error' : undefined}
            />
            {otpError && (
              <p id="otp-error" role="alert" className="mt-1 text-xs text-destructive">
                {otpError}
              </p>
            )}
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
                {t('verify.loading')}
              </span>
            ) : (
              t('verify.submit')
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
      <h1 className="font-[family-name:var(--font-satoshi)] text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
        {t('register.title')}
      </h1>
      <p className="mt-2 text-sm text-muted">{t('register.subtitle')}</p>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-[var(--radius-md)] border border-destructive/30 bg-[var(--color-destructive-bg)] px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} noValidate className="mt-7 space-y-4">
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
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              clearFieldError('name')
            }}
            placeholder={t('register.namePlaceholder')}
            className={cn(INPUT_CLASSES, fieldErrors.name && 'border-destructive focus:border-destructive focus:ring-destructive/20')}
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
          />
          {fieldErrors.name && (
            <p id="name-error" role="alert" className="mt-1 text-xs text-destructive">
              {fieldErrors.name}
            </p>
          )}
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
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearFieldError('email')
            }}
            placeholder={t('register.emailPlaceholder')}
            className={cn(INPUT_CLASSES, fieldErrors.email && 'border-destructive focus:border-destructive focus:ring-destructive/20')}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          />
          {fieldErrors.email && (
            <p id="email-error" role="alert" className="mt-1 text-xs text-destructive">
              {fieldErrors.email}
            </p>
          )}
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
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              clearFieldError('password')
            }}
            placeholder={t('register.passwordPlaceholder')}
            className={cn(INPUT_CLASSES, fieldErrors.password && 'border-destructive focus:border-destructive focus:ring-destructive/20')}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
          />
          {fieldErrors.password && (
            <p id="password-error" role="alert" className="mt-1 text-xs text-destructive">
              {fieldErrors.password}
            </p>
          )}
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
              {t('register.loading')}
            </span>
          ) : (
            t('register.submit')
          )}
        </VzBtn>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-border-light" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-surface px-3 text-xs text-muted">
            {t('register.or')}
          </span>
        </div>
      </div>

      <VzBtn
        type="button"
        variant="secondary"
        size="lg"
        onClick={handleGoogleLogin}
        className="w-full"
      >
        <GoogleIcon />
        {t('register.google')}
      </VzBtn>

      <p className="mt-5 text-center text-xs text-muted leading-relaxed">
        {t('register.legalNotice')}{' '}
        <Link
          href="/legal/cgu"
          target="_blank"
          className="text-accent-deep underline underline-offset-2 hover:text-foreground"
        >
          {t('register.cgu')}
        </Link>{' '}
        {t('register.and')}{' '}
        <Link
          href="/legal/confidentialite"
          target="_blank"
          className="text-accent-deep underline underline-offset-2 hover:text-foreground"
        >
          {t('register.privacy')}
        </Link>
        .
      </p>

      <p className="mt-6 text-center text-sm text-muted">
        {t('register.hasAccount')}{' '}
        <Link
          href={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
          className="font-medium text-accent-deep underline-offset-4 transition-colors duration-150 hover:underline"
        >
          {t('register.login')}
        </Link>
      </p>
    </>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
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
