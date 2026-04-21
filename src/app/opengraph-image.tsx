import { ImageResponse } from 'next/og'
import { DEFAULT_PORTFOLIO_COLOR } from '@/lib/constants'

// OG image par défaut pour toute page marketing qui n'a pas son propre
// opengraph-image.tsx. Next.js la sert automatiquement à /opengraph-image.
// Les pages enfants peuvent l'override en plaçant leur propre fichier dans
// leur dossier — sinon elles héritent de celle-ci.

export const alt = 'Vizly — Crée ton portfolio en ligne'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const ACCENT = DEFAULT_PORTFOLIO_COLOR

export default function RootOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#FAF8F6',
          padding: '72px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '44px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#1A1A1A',
          }}
        >
          Vizly
          <span style={{ color: ACCENT, marginLeft: '4px' }}>•</span>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              fontSize: '88px',
              fontWeight: 800,
              color: '#1A1A1A',
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
            }}
          >
            Crée ton portfolio
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '88px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
              marginTop: '4px',
            }}
          >
            <span style={{ color: '#1A1A1A' }}>en</span>
            <span style={{ color: ACCENT, marginLeft: '18px' }}>5 minutes</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '30px',
              color: '#6B6560',
              marginTop: '28px',
              lineHeight: 1.4,
              maxWidth: '900px',
            }}
          >
            Le builder de portfolios le plus simple. Remplis, personnalise, publie.
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '24px',
            color: '#6B6560',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex' }}>vizly.fr</div>
          <div style={{ display: 'flex', gap: '18px' }}>
            <span>Portfolios · Templates · Domaines perso</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
