import type { CSSProperties } from 'react'

// Design tokens for transactional emails.
// Mirrors the marketing design system in src/app/globals.css, but uses
// email-safe font stacks because web fonts are unreliable across mail
// clients (Gmail, Outlook, Apple Mail all behave differently).

// Palette email Handcrafted : lime #C8F169 + lime deep #8AB83D pour
// le dot du wordmark (lisibilité sur fond clair). Les anciens tokens
// terracotta sont remplacés. Fond principal crème pour cohérence visuelle
// avec le site.
export const colors = {
  background: '#FFFFFF',
  surfaceWarm: '#FAF8F6',
  foreground: '#1A1A1A',
  muted: '#6B6560',
  mutedForeground: '#9C958E',
  border: '#E8E3DE',
  borderLight: '#F0EBE6',
  accent: '#C8F169',
  accentHover: '#B8E150',
  accentDeep: '#8AB83D',
  accentLight: '#F1FADC',
  destructive: '#DC2626',
  success: '#16A34A',
} as const

export const fonts = {
  // System sans stack for everything (wordmark, headings, body).
  // Web fonts are unreliable in mail clients, so we lean on the OS font
  // — San Francisco on macOS/iOS, Segoe UI on Windows, Roboto on Android.
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
} as const

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
} as const

// Reusable inline style objects for React Email components.

export const body: CSSProperties = {
  margin: 0,
  padding: 0,
  backgroundColor: colors.surfaceWarm,
  fontFamily: fonts.sans,
  color: colors.foreground,
  WebkitFontSmoothing: 'antialiased',
}

export const container: CSSProperties = {
  margin: '0 auto',
  padding: `${spacing.xl} 0`,
  maxWidth: '600px',
  width: '100%',
}

export const card: CSSProperties = {
  backgroundColor: colors.background,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  overflow: 'hidden',
}

export const headerSection: CSSProperties = {
  padding: `${spacing.xl} ${spacing.xl} 0 ${spacing.xl}`,
}

export const logoText: CSSProperties = {
  margin: 0,
  fontFamily: fonts.sans,
  fontSize: '24px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: colors.foreground,
}

export const logoDot: CSSProperties = {
  // Lime deep pour le point, lisible sur fond clair (le lime pur #C8F169
  // disparaîtrait sur blanc/crème).
  color: colors.accentDeep,
  fontWeight: 800,
}

export const contentSection: CSSProperties = {
  padding: `${spacing.lg} ${spacing.xl} ${spacing.xl} ${spacing.xl}`,
}

export const heading: CSSProperties = {
  margin: `0 0 ${spacing.base} 0`,
  fontFamily: fonts.sans,
  fontSize: '26px',
  fontWeight: 600,
  lineHeight: 1.3,
  letterSpacing: '-0.02em',
  color: colors.foreground,
}

export const paragraph: CSSProperties = {
  margin: `0 0 ${spacing.base} 0`,
  fontFamily: fonts.sans,
  fontSize: '15px',
  lineHeight: 1.6,
  color: colors.foreground,
  textAlign: 'left',
}

export const paragraphMuted: CSSProperties = {
  ...paragraph,
  color: colors.muted,
  fontSize: '14px',
}

// Bouton Handcrafted — fond noir + texte blanc + ombre offset lime
// (la signature). Les clients mail qui ignorent box-shadow auront juste
// un bouton noir propre, ce qui reste cohérent.
export const button: CSSProperties = {
  display: 'inline-block',
  padding: '12px 24px',
  backgroundColor: colors.foreground,
  color: '#FFFFFF',
  fontFamily: fonts.sans,
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  borderRadius: radius.md,
  textAlign: 'center',
  boxShadow: `3px 3px 0 ${colors.accent}`,
}

export const hr: CSSProperties = {
  margin: `${spacing.lg} ${spacing.xl}`,
  border: 'none',
  borderTop: `1px solid ${colors.border}`,
}

export const footerSection: CSSProperties = {
  padding: `0 ${spacing.xl} ${spacing.xl} ${spacing.xl}`,
}

export const footerText: CSSProperties = {
  margin: 0,
  fontFamily: fonts.sans,
  fontSize: '13px',
  lineHeight: 1.5,
  color: colors.mutedForeground,
  textAlign: 'left',
}

export const footerLink: CSSProperties = {
  color: colors.muted,
  textDecoration: 'underline',
}
