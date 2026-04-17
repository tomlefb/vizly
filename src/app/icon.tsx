import { ImageResponse } from 'next/og'
import { DEFAULT_PORTFOLIO_COLOR } from '@/lib/constants'

export const size = { width: 48, height: 48 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111827',
          borderRadius: 9,
        }}
      >
        <svg width="36" height="36" viewBox="0 0 32 32">
          <path
            d="M8 9l8 15 8-15"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="24" r="2.5" fill={DEFAULT_PORTFOLIO_COLOR} />
        </svg>
      </div>
    ),
    { ...size }
  )
}
