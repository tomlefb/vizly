import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { locales, defaultLocale, type Locale } from './config'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value

  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    const locale = cookieLocale as Locale
    return {
      locale,
      messages: (await import(`../../messages/${locale}.json`)).default,
    }
  }

  // Fallback: browser Accept-Language header
  const headerStore = await headers()
  const acceptLang = headerStore.get('accept-language') ?? ''
  const browserLang = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase()
  const locale =
    browserLang && locales.includes(browserLang as Locale)
      ? (browserLang as Locale)
      : defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
