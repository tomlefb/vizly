import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
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
          background: '#1A1A1A',
          borderRadius: 12,
        }}
      >
        <svg width="52" height="52" viewBox="-30 -880 1020 1020">
          <path
            fill="#FFFFFF"
            d="M454 0L287 0L10-740L183-740L323-366Q336-332 347-295Q358-258 370-210Q384-263 395.5-298Q407-333 419-366L557-740L726-740L454 0Z"
          />
          <circle cx="850" cy="-100" r="100" fill="#C2831A" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
