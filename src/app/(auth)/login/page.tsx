'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { getDashboardUrl } from '@/lib/auth/dashboardUrl'
import { VzBtn } from '@/components/ui/vizly'
import { cn } from '@/lib/utils'
import { z } from 'zod'

export default function LoginPage() {
  // Suspense boundary required by Next 15 because LoginPageInner reads
  // useSearchParams() — without it, the static prerender of /login
  // bails out with a missing-suspense-with-csr-bailout error.
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}

const INPUT_CLASSES =
  'block w-full h-10 rounded-[var(--radius-md)] border border-border-light bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:border-accent-deep focus:ring-2 focus:ring-accent/30'

function LoginPageInner() {
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  const dashboardUrl = getDashboardUrl(searchParams)

  const loginSchema = z.object({
    email: z.string().email(t('errors.invalidEmail')),
    password: z.string().min(6, t('errors.passwordMin')),
  })

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const parsed = loginSchema.safeParse({ email, password })
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
      window.location.href = dashboardUrl
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

  return (
    <>
      <h1 className="font-[family-name:var(--font-satoshi)] text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
        {t('login.title')}
      </h1>
      <p className="mt-2 text-sm text-muted">{t('login.subtitle')}</p>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-[var(--radius-md)] border border-destructive/30 bg-[var(--color-destructive-bg)] px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleEmailLogin} noValidate className="mt-7 space-y-4">
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
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearFieldError('email')
            }}
            placeholder={t('login.emailPlaceholder')}
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
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              {t('login.password')}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted transition-colors duration-150 hover:text-foreground"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              clearFieldError('password')
            }}
            placeholder={t('login.passwordPlaceholder')}
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
              {t('login.loading')}
            </span>
          ) : (
            t('login.submit')
          )}
        </VzBtn>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-border-light" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-surface px-3 text-xs text-muted">
            {t('login.or')}
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
        {t('login.google')}
      </VzBtn>

      <p className="mt-8 text-center text-sm text-muted">
        {t('login.noAccount')}{' '}
        <Link
          href={`/register${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
          className="font-medium text-accent-deep underline-offset-4 transition-colors duration-150 hover:underline"
        >
          {t('login.createAccount')}
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
