import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

// Next.js auto-detects this file in the same directory as page.tsx and wires
// it as the og:image / twitter:image for the route. It runs on each crawler
// request (Next caches the response). The image is generated from the live
// portfolio data so the social preview is personalised per user.

export const alt = 'Portfolio Vizly'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface OgImageProps {
  params: Promise<{ slug: string }>
}

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vizly.fr'

// Vizly brand accent — used for the wordmark dot regardless of the
// user's custom primary_color, so the brand mark stays recognisable
// across all portfolio OG cards.
const VIZLY_BRAND_ACCENT = '#D4634E'

// Truncate at a word boundary near `max` chars and append an ellipsis.
function truncate(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  const sliced = cleaned.slice(0, max)
  const lastSpace = sliced.lastIndexOf(' ')
  const cut = lastSpace > max * 0.6 ? sliced.slice(0, lastSpace) : sliced
  return `${cut}…`
}

export default async function PortfolioOgImage({ params }: OgImageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('title, bio, photo_url, primary_color')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  const name = portfolio?.title?.trim() || slug
  const tagline = portfolio?.bio ? truncate(portfolio.bio, 140) : ''
  const accent = portfolio?.primary_color || '#D4634E'
  const photoUrl = portfolio?.photo_url ?? null
  const initial = (name[0] ?? '?').toUpperCase()
  const subdomain = `${slug}.${APP_DOMAIN}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FAF8F6',
          padding: '64px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: '40px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#1A1A1A',
          }}
        >
          Vizly
          <span style={{ color: VIZLY_BRAND_ACCENT }}>•</span>
        </div>

        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            marginTop: '32px',
          }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              width={200}
              height={200}
              style={{
                borderRadius: '100px',
                objectFit: 'cover',
                flexShrink: 0,
                marginRight: '56px',
              }}
              alt=""
            />
          ) : (
            <div
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '100px',
                backgroundColor: accent,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '92px',
                fontWeight: 700,
                flexShrink: 0,
                marginRight: '56px',
              }}
            >
              {initial}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '64px',
                fontWeight: 700,
                color: '#1A1A1A',
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
              }}
            >
              {name}
            </div>
            {tagline && (
              <div
                style={{
                  display: 'flex',
                  fontSize: '26px',
                  color: '#6B6560',
                  marginTop: '20px',
                  lineHeight: 1.4,
                }}
              >
                {tagline}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: '22px',
            color: '#6B6560',
            fontWeight: 500,
          }}
        >
          {subdomain}
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
