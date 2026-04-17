'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { VzLogo, VzHighlight, VzBtn, vzBtnClasses } from '@/components/ui/vizly'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations('errorPage')

  useEffect(() => {
    // Log to console for dev observability. In production the runtime
    // will capture and forward to the configured error reporter.
    // eslint-disable-next-line no-console
    console.error('App error boundary captured:', error)
  }, [error])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="relative z-10 flex flex-col items-center">
        <Link href="/" className="mb-10 inline-block">
          <VzLogo size={32} />
        </Link>

        <h1 className="font-[family-name:var(--font-satoshi)] text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {t('titleLead')} <VzHighlight>{t('titleAccent')}</VzHighlight>
        </h1>
        <p className="mt-5 max-w-md text-base text-muted leading-relaxed">
          {t('description')}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <VzBtn variant="primary" size="lg" onClick={reset}>
            {t('retry')}
          </VzBtn>
          <Link href="/" className={vzBtnClasses({ variant: 'secondary', size: 'lg' })}>
            {t('home')}
          </Link>
        </div>
      </div>
    </div>
  )
}
