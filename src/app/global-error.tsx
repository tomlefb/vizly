'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Ultimate fallback that runs when the root layout itself throws.
 * next-intl context is unavailable here, so we hardcode bilingual-ish
 * text (French first — Vizly is fr-default) and don't rely on tokens or
 * webfonts: use system stack + inline styles so the page still renders
 * even if globals.css failed to load.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Root-level error boundary captured:', error)
  }, [error])

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          textAlign: 'center',
          backgroundColor: '#FAF8F6',
          color: '#1A1A1A',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '40px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}
        >
          Oups, <span style={{ backgroundColor: '#F1B434', padding: '0 6px', borderRadius: '3px' }}>erreur</span>
        </h1>
        <p style={{ marginTop: 20, maxWidth: 460, color: '#6B6560', lineHeight: 1.6 }}>
          Une erreur critique s&apos;est produite. Essaie de recharger la page.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 40,
            padding: '14px 22px',
            backgroundColor: '#1A1A1A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '3px 3px 0 #F1B434',
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  )
}
