import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-[var(--radius-xl)] bg-accent/10 mb-6">
        <span className="font-[family-name:var(--font-satoshi)] text-3xl font-extrabold text-accent">
          404
        </span>
      </div>
      <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight mb-2">
        {t('title')}
      </h1>
      <p className="text-sm text-muted max-w-xs leading-relaxed mb-8">
        {t('description')}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
        >
          {t('home')}
        </Link>
        <Link
          href="/templates"
          className="rounded-[var(--radius-md)] border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-warm"
        >
          {t('templates')}
        </Link>
        <Link
          href="/blog"
          className="rounded-[var(--radius-md)] border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-warm"
        >
          {t('blog')}
        </Link>
      </div>
    </div>
  )
}
