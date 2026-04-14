'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import {
  requestEmailChange,
  verifyEmailChangeOtp,
} from '@/actions/auth'

type Step = 'idle' | 'request' | 'verify_current' | 'verify_new' | 'done'

interface ChangeEmailFormProps {
  currentEmail: string
}

export function ChangeEmailForm({ currentEmail }: ChangeEmailFormProps) {
  const router = useRouter()
  const t = useTranslations('auth')
  const tSettings = useTranslations('settings')

  const emailSchema = z.string().email(t('errors.invalidEmail'))
  const otpSchema = z
    .string()
    .regex(/^\d{6}$/, t('verify.errors.invalidFormat'))

  const [step, setStep] = useState<Step>('idle')
  const [newEmail, setNewEmail] = useState('')
  const [otpCurrent, setOtpCurrent] = useState('')
  const [otpNew, setOtpNew] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resendInfo, setResendInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  function handleStart() {
    setStep('request')
    setError(null)
    setResendInfo(null)
  }

  function handleCancel() {
    setStep('idle')
    setNewEmail('')
    setOtpCurrent('')
    setOtpNew('')
    setError(null)
    setResendInfo(null)
  }

  async function handleRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const parsed = emailSchema.safeParse(newEmail)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.invalidEmail'))
      return
    }

    setLoading(true)

    try {
      const result = await requestEmailChange(parsed.data)

      if (!result.ok) {
        if (result.code === 'same_email') {
          setError(t('changeEmail.errors.sameEmail'))
        } else if (result.code === 'email_taken') {
          setError(t('changeEmail.errors.emailTaken'))
        } else if (result.code === 'not_authenticated') {
          setError(t('changeEmail.errors.notAuthenticated'))
        } else if (result.code === 'rate_limited') {
          setError(t('verify.errors.rateLimited'))
        } else {
          setError(result.error)
        }
        return
      }

      setStep('verify_current')
    } catch {
      setError(t('errors.unexpected'))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCurrent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setResendInfo(null)

    const parsed = otpSchema.safeParse(otpCurrent)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('verify.errors.invalidFormat'))
      return
    }

    setLoading(true)

    try {
      const result = await verifyEmailChangeOtp({
        email: currentEmail,
        token: parsed.data,
        stage: 'current',
      })

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

      setStep('verify_new')
    } catch {
      setError(t('errors.unexpected'))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyNew(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setResendInfo(null)

    const parsed = otpSchema.safeParse(otpNew)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('verify.errors.invalidFormat'))
      return
    }

    setLoading(true)

    try {
      const result = await verifyEmailChangeOtp({
        email: newEmail,
        token: parsed.data,
        stage: 'new',
      })

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
      const result = await requestEmailChange(newEmail)
      if (!result.ok) {
        if (result.code === 'rate_limited') {
          setError(t('verify.errors.rateLimited'))
        } else {
          setError(result.error)
        }
        return
      }
      setResendInfo(t('changeEmail.resendSuccess'))
    } catch {
      setError(t('errors.unexpected'))
    } finally {
      setResending(false)
    }
  }

  function handleDoneAcknowledge() {
    setStep('idle')
    setNewEmail('')
    setOtpCurrent('')
    setOtpNew('')
    setError(null)
    setResendInfo(null)
    router.refresh()
  }

  // --- done ----------------------------------------------------------------

  if (step === 'done') {
    return (
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {tSettings('email')}
        </label>
        <div className="rounded-[var(--radius-md)] border border-success/30 bg-success/5 px-4 py-3">
          <p className="text-sm font-medium text-success">
            {t('changeEmail.doneTitle')}
          </p>
          <p className="mt-1 text-sm text-foreground">
            {t('changeEmail.doneSubtitle', { email: newEmail })}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDoneAcknowledge}
          className="mt-3 inline-flex items-center justify-center h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition-colors duration-150 hover:bg-[#F3F4F6]"
        >
          {t('changeEmail.doneAcknowledge')}
        </button>
      </div>
    )
  }

  // --- verify_current / verify_new -----------------------------------------

  if (step === 'verify_current' || step === 'verify_new') {
    const isCurrent = step === 'verify_current'
    const targetEmail = isCurrent ? currentEmail : newEmail
    const otp = isCurrent ? otpCurrent : otpNew
    const setOtp = isCurrent ? setOtpCurrent : setOtpNew
    const handleSubmit = isCurrent ? handleVerifyCurrent : handleVerifyNew
    const title = isCurrent
      ? t('changeEmail.verifyCurrentTitle')
      : t('changeEmail.verifyNewTitle')
    const subtitle = isCurrent
      ? t('changeEmail.verifyCurrentSubtitle', { email: targetEmail })
      : t('changeEmail.verifyNewSubtitle', { email: targetEmail })

    return (
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {tSettings('email')}
        </label>
        <div className="rounded-[var(--radius-md)] border border-border bg-white p-4">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted leading-relaxed">{subtitle}</p>

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </div>
          )}

          {resendInfo && (
            <div
              role="status"
              className="mt-3 rounded-[var(--radius-md)] border border-success/30 bg-success/5 px-3 py-2 text-xs text-success"
            >
              {resendInfo}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder={t('changeEmail.codePlaceholder')}
              aria-label={t('changeEmail.codeLabel')}
              className="block w-full h-11 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-center text-xl font-semibold tracking-[0.3em] text-[#111827] placeholder:text-[#9CA3AF] placeholder:tracking-normal placeholder:text-base placeholder:font-normal transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="inline-flex items-center justify-center h-9 rounded-lg bg-[#D4634E] px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#C05640] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? t('changeEmail.verifyLoading')
                  : t('changeEmail.verifyButton')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition-colors duration-150 hover:bg-[#F3F4F6]"
              >
                {t('changeEmail.cancelButton')}
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="mt-3 text-xs text-muted transition-colors duration-150 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resending
              ? t('changeEmail.resending')
              : t('changeEmail.resendButton')}
          </button>
        </div>
      </div>
    )
  }

  // --- request -------------------------------------------------------------

  if (step === 'request') {
    return (
      <div>
        <label
          htmlFor="new-email"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          {t('changeEmail.newEmailLabel')}
        </label>

        {error && (
          <div
            role="alert"
            className="mb-3 rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleRequest} className="space-y-3">
          <input
            id="new-email"
            type="email"
            autoComplete="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={t('changeEmail.newEmailPlaceholder')}
            className="block w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
          />
          <p className="text-xs text-muted leading-relaxed">
            {t('changeEmail.requestHint', { email: currentEmail })}
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center h-9 rounded-lg bg-[#D4634E] px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#C05640] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? t('changeEmail.requestLoading')
                : t('changeEmail.requestButton')}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition-colors duration-150 hover:bg-[#F3F4F6]"
            >
              {t('changeEmail.cancelButton')}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // --- idle (default) ------------------------------------------------------

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {tSettings('email')}
      </label>
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-[var(--radius-md)] border border-border bg-surface-warm px-4 py-2.5 text-sm text-muted">
          {currentEmail}
        </div>
        <button
          type="button"
          onClick={handleStart}
          className="inline-flex items-center justify-center h-10 rounded-lg border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] transition-colors duration-150 hover:bg-[#F3F4F6]"
        >
          {t('changeEmail.startButton')}
        </button>
      </div>
    </div>
  )
}
