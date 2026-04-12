import { getRequestConfig } from 'next-intl/server'
import { defaultLocale } from './config'

// Single-locale (FR) static config : aucune lecture dynamique de
// cookies/headers, ce qui permet aux pages marketing de rester en
// rendu statique (CDN). Pour passer en multi-locale, introduire un
// segment [locale] dans l'URL et utiliser setRequestLocale.
export default getRequestConfig(async () => {
  const locale = defaultLocale
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
