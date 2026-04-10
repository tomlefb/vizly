'use client'

import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { locales, type Locale } from '@/i18n/config'

export function LanguageSwitcher() {
  const currentLocale = useLocale()
  const t = useTranslations('language')

  function switchLocale(locale: Locale) {
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
    window.location.reload()
  }

  return (
    <div className="inline-flex items-center rounded-full bg-[#F3F4F6] p-0.5 text-xs font-medium">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => switchLocale(locale)}
          className={cn(
            'rounded-full px-2.5 py-1 transition-colors duration-150',
            currentLocale === locale
              ? 'bg-white text-[#111827] border border-[#E5E7EB]'
              : 'text-[#6B7280] hover:text-[#111827]'
          )}
          aria-label={locale === 'fr' ? 'Français' : 'English'}
          aria-current={currentLocale === locale ? 'true' : undefined}
        >
          {t(locale)}
        </button>
      ))}
    </div>
  )
}
