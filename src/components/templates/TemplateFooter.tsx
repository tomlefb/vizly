import type { CSSProperties, ReactNode } from 'react'

interface TemplateFooterProps {
  isPremium: boolean
  primaryColor: string
  className?: string
  style?: CSSProperties
  containerClassName?: string
  containerStyle?: CSSProperties
  yearStyle?: CSSProperties
  badgeStyle?: CSSProperties
  children?: ReactNode
}

export function TemplateFooter({
  isPremium,
  primaryColor,
  className = 'px-6 py-8',
  style,
  containerClassName = 'mx-auto flex max-w-5xl items-center justify-between',
  containerStyle,
  yearStyle,
  badgeStyle,
  children,
}: TemplateFooterProps) {
  return (
    <footer className={className} style={{ borderTop: '1px solid #EBEBEB', ...style }}>
      <div className={containerClassName} style={containerStyle}>
        {children ?? (
          <p style={{ fontSize: '0.8rem', color: '#ABABAB', ...yearStyle }}>
            {new Date().getFullYear()}
          </p>
        )}
        {!isPremium ? (
          <a
            href="https://vizly.fr"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.75rem',
              color: '#ABABAB',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              ...badgeStyle,
            }}
          >
            Fait avec{' '}
            <span style={{ fontWeight: 600, color: primaryColor }}>Vizly</span>
          </a>
        ) : null}
      </div>
    </footer>
  )
}
