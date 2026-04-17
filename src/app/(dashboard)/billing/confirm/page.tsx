// =============================================================================
// /billing/confirm — landing page after a Stripe 3DS redirect
// =============================================================================
//
// Reached only when stripe.confirmPayment({ redirect: 'if_required' }) was
// forced into a hard redirect because the card required Strong Customer
// Authentication. For non-3DS payments, the modals stay in-app and this page
// is never visited.
//
// IMPORTANT — this page does NOT touch the DB. The webhook pipeline is the
// source of truth and runs in parallel. We just show an optimistic
// confirmation message and bounce the user back to /billing after 3 s.

import Link from 'next/link'
import { Check, X, AlertCircle } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { VzHighlight, vzBtnClasses } from '@/components/ui/vizly'
import { ConfirmRedirectAfterDelay } from './ConfirmRedirectAfterDelay'

interface ConfirmPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type Status = 'succeeded' | 'failed' | 'unknown'

function pickStatus(value: string | string[] | undefined): Status {
  if (value === 'succeeded') return 'succeeded'
  if (value === 'failed') return 'failed'
  return 'unknown'
}

function pickContext(
  params: Record<string, string | string[] | undefined>,
): 'subscription' | 'template' | 'unknown' {
  if (typeof params.subscription_id === 'string') return 'subscription'
  if (typeof params.payment_intent_id === 'string') return 'template'
  return 'unknown'
}

export default async function BillingConfirmPage({
  searchParams,
}: ConfirmPageProps) {
  const [params, t] = await Promise.all([
    searchParams,
    getTranslations('billing'),
  ])

  const status = pickStatus(params.redirect_status)
  const context = pickContext(params)

  if (status === 'succeeded') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center pt-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border border-border-light bg-surface-sunken">
          <Check
            className="h-5 w-5 text-foreground"
            strokeWidth={2}
            aria-hidden="true"
          />
        </div>
        <h1 className="mt-5 font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground">
          <VzHighlight>{t('confirmTitle')}</VzHighlight>
        </h1>
        <p className="mt-3 text-sm text-muted">
          {context === 'template'
            ? t('confirmTemplateBody')
            : t('confirmSubBody')}
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          {t('confirmRedirecting')}
        </p>
        <ConfirmRedirectAfterDelay
          targetPath="/billing"
          delayMs={3000}
          continueLabel={t('confirmContinue')}
        />
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center pt-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5">
          <X
            className="h-5 w-5 text-destructive"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
        <h1 className="mt-5 font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground">
          {t('confirmFailedTitle')}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {t('confirmFailedBody')}
        </p>
        <Link
          href="/billing"
          className={vzBtnClasses({ variant: 'primary', size: 'md', className: 'mt-7' })}
        >
          {t('confirmFailedBack')}
        </Link>
      </div>
    )
  }

  // unknown — defensive branch
  return (
    <div className="mx-auto flex max-w-md flex-col items-center pt-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border border-border-light bg-surface-sunken">
        <AlertCircle
          className="h-5 w-5 text-muted-foreground"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>
      <h1 className="mt-5 font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground">
        {t('confirmUnknownTitle')}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {t('confirmUnknownBody')}
      </p>
      <Link
        href="/billing"
        className={vzBtnClasses({ variant: 'secondary', size: 'md', className: 'mt-7' })}
      >
        {t('confirmFailedBack')}
      </Link>
    </div>
  )
}
