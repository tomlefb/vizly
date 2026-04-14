import frMessages from '../../../messages/fr.json'
import enMessages from '../../../messages/en.json'
import type { EmailLocale } from './types'

// Centralised email strings, sourced from the same messages/{locale}.json
// files used by next-intl on the web side. Keeps translations in one place
// and avoids duplicating copy in templates.

const STRINGS = {
  fr: frMessages.emails,
  en: enMessages.emails,
} as const

export type EmailStrings = (typeof STRINGS)[EmailLocale]

export function getEmailStrings(locale: EmailLocale): EmailStrings {
  switch (locale) {
    case 'fr':
      return STRINGS.fr
    case 'en':
      return STRINGS.en
  }
}
