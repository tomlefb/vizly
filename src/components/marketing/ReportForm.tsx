'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Send, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { VzHighlight, vzBtnClasses } from '@/components/ui/vizly'

const CATEGORIES = [
  'copyright',
  'privacy',
  'hate',
  'illegal',
  'impersonation',
  'other',
] as const

type Category = (typeof CATEGORIES)[number]

export function ReportForm() {
  const t = useTranslations('reportForm')
  const [category, setCategory] = useState<Category | ''>('')
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [declaration, setDeclaration] = useState(false)
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!category || !url.trim() || !name.trim() || !email.trim() || !message.trim()) return
      if (!declaration) {
        setStatus('error')
        setErrorMsg(t('declarationRequired'))
        return
      }
      if (!consent) {
        setStatus('error')
        setErrorMsg(t('consentRequired'))
        return
      }

      setStatus('sending')
      setErrorMsg('')

      try {
        const res = await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, url, name, email, message }),
        })
        const data = (await res.json()) as { error?: string }

        if (!res.ok || data.error) {
          setStatus('error')
          setErrorMsg(data.error ?? t('errorSending'))
          return
        }

        setStatus('sent')
        setCategory('')
        setUrl('')
        setName('')
        setEmail('')
        setMessage('')
        setDeclaration(false)
        setConsent(false)
      } catch {
        setStatus('error')
        setErrorMsg(t('errorNetwork'))
      }
    },
    [category, url, name, email, message, declaration, consent, t]
  )

  if (status === 'sent') {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border-light bg-surface p-10 text-center">
        <h2 className="font-[family-name:var(--font-satoshi)] text-xl font-semibold tracking-tight leading-[1.1]">
          {t('successTitleStart')} <VzHighlight>{t('successTitleAccent')}</VzHighlight>.
        </h2>
        <p className="mt-4 text-sm text-muted leading-relaxed">
          {t('successBody')}
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus('idle')
            setErrorMsg('')
          }}
          className="mt-6 text-sm font-medium text-foreground underline underline-offset-4 transition-colors duration-150 hover:text-accent-deep"
        >
          {t('successAgain')}
        </button>
      </div>
    )
  }

  const inputClasses =
    'w-full h-10 rounded-[var(--radius-md)] border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20'

  const textareaClasses =
    'w-full rounded-[var(--radius-md)] border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 resize-y min-h-[140px] focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="report-category" className="block text-sm font-medium text-foreground">
          {t('categoryLabel')}
        </label>
        <select
          id="report-category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className={inputClasses}
        >
          <option value="" disabled>
            {t('categoryPlaceholder')}
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`categoryOptions.${c}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="report-url" className="block text-sm font-medium text-foreground">
          {t('urlLabel')}
        </label>
        <input
          id="report-url"
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t('urlPlaceholder')}
          className={inputClasses}
        />
        <p className="mt-1 text-xs text-muted">{t('urlHelper')}</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="report-name" className="block text-sm font-medium text-foreground">
          {t('nameLabel')}
        </label>
        <input
          id="report-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          className={inputClasses}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="report-email" className="block text-sm font-medium text-foreground">
          {t('emailLabel')}
        </label>
        <input
          id="report-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          className={inputClasses}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="report-message" className="block text-sm font-medium text-foreground">
          {t('messageLabel')}
        </label>
        <textarea
          id="report-message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('messagePlaceholder')}
          className={textareaClasses}
        />
      </div>

      <label htmlFor="report-declaration" className="flex items-start gap-2.5 cursor-pointer">
        <input
          id="report-declaration"
          type="checkbox"
          checked={declaration}
          onChange={(e) => setDeclaration(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-light accent-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <span className="text-xs text-muted leading-relaxed">
          {t('declarationLabel')}
        </span>
      </label>

      <label htmlFor="report-consent" className="flex items-start gap-2.5 cursor-pointer">
        <input
          id="report-consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-light accent-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <span className="text-xs text-muted leading-relaxed">
          {t('consentPrefix')}{' '}
          <Link
            href="/legal/confidentialite"
            className="font-medium text-accent-deep underline underline-offset-4 transition-colors hover:text-accent"
          >
            {t('consentLink')}
          </Link>
          .
        </span>
      </label>

      {status === 'error' && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className={cn(
          vzBtnClasses({ variant: 'primary', size: 'md', className: 'w-full' }),
          status === 'sending' && 'opacity-70 cursor-not-allowed'
        )}
      >
        {status === 'sending' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('sending')}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {t('send')}
          </>
        )}
      </button>
    </form>
  )
}
