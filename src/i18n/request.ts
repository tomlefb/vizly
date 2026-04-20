import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, locales, type Locale } from './config'

// Résolution du locale par requête :
//   1. Cookie `NEXT_LOCALE` (posé par LanguageSwitcher quand l'user fixe
//      sa préférence dans /settings) — priorité absolue.
//   2. Header `Accept-Language` du navigateur — détection auto au premier
//      passage. On prend la première préférence compatible, quelle que
//      soit la q-value (Vizly ne supporte que 2 langues, un simple first-match
//      suffit).
//   3. Fallback `defaultLocale` (fr).
//
// Conséquence : la lecture de cookies/headers rend chaque page dynamic
// (plus de SSG CDN pour les pages marketing). Trade-off assumé pour
// proposer une i18n fonctionnelle sans refondre le routing en [locale].

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

function pickLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return defaultLocale
  const preferred = header
    .split(',')
    .map((part) => part.split(';')[0]?.trim().toLowerCase().split('-')[0])
    .filter((x): x is string => Boolean(x))
  for (const candidate of preferred) {
    if (isLocale(candidate)) return candidate
  }
  return defaultLocale
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value

  const locale: Locale = isLocale(cookieLocale)
    ? cookieLocale
    : pickLocaleFromAcceptLanguage((await headers()).get('accept-language'))

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
