import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { VzLogo, VzHighlight, vzBtnClasses } from '@/components/ui/vizly'

export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Chiffre 404 géant en fond, très discret */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center font-[family-name:var(--font-satoshi)] text-[clamp(220px,42vw,480px)] font-extrabold leading-none text-border-light/60 select-none"
      >
        404
      </span>

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
          <Link href="/" className={vzBtnClasses({ variant: 'primary', size: 'lg' })}>
            {t('home')}
          </Link>
          <Link href="/templates" className={vzBtnClasses({ variant: 'secondary', size: 'lg' })}>
            {t('templates')}
          </Link>
        </div>
      </div>
    </div>
  )
}
