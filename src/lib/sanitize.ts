import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'p',
  'br',
  'span',
  'strong',
  'em',
  'b',
  'i',
  'u',
  's',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'code',
  'pre',
]

const ALLOWED_ATTR = ['href', 'target', 'rel']

const ALLOWED_URI_REGEXP = /^(?:https?:|mailto:|#)/i

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
  })
}

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:'])

export function isSafeUrl(raw: string | null | undefined): boolean {
  if (!raw) return false
  try {
    const url = new URL(raw)
    return SAFE_URL_PROTOCOLS.has(url.protocol)
  } catch {
    return false
  }
}

export function safeUrlOrEmpty(raw: string | null | undefined): string {
  return isSafeUrl(raw) ? (raw as string) : ''
}

const SAFE_MAILTO_REGEX = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/

export function safeMailtoEmail(raw: string | null | undefined): string {
  if (!raw) return ''
  return SAFE_MAILTO_REGEX.test(raw) ? raw : ''
}
