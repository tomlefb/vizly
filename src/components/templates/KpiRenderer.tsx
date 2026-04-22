'use client'

import { Star } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { KpiItem } from '@/types/kpis'

interface KpiRendererProps {
  kpi: KpiItem
  primaryColor: string
  dark?: boolean
}

export function KpiRenderer({ kpi, primaryColor, dark = false }: KpiRendererProps) {
  const bg = dark ? '#1E1E1E' : '#FFFFFF'
  const border = dark ? '#333' : '#EBEBEB'
  const text = dark ? '#E8E8E8' : '#1A1A1A'
  const muted = dark ? '#888' : '#8A8A8A'
  const pct = kpi.maxValue > 0 ? Math.min((kpi.value / kpi.maxValue) * 100, 100) : 0

  // All cards share: enable container queries so typography & SVG sizes shrink
  // when the card gets narrow (mobile, dense grids, scaled previews). Also
  // overflow: hidden + minWidth: 0 as a safety net against any edge-case
  // spillover (long numbers, long labels, etc.).
  const cardBase: CSSProperties = {
    backgroundColor: bg,
    border: `1px solid ${border}`,
    borderRadius: 12,
    padding: 'clamp(14px, 5cqw, 24px) clamp(12px, 4.5cqw, 20px)',
    containerType: 'inline-size',
    overflow: 'hidden',
    minWidth: 0,
  }

  // Big headline number font (scales with card width, capped). The number
  // is the hero of the card — keep it big and proudly readable.
  const bigNumFs = 'clamp(1.75rem, 22cqw, 3.25rem)'
  const midNumFs = 'clamp(1.1rem, 13cqw, 1.8rem)'
  const labelFs = 'clamp(0.72rem, 4cqw, 0.85rem)'
  const subFs = 'clamp(0.65rem, 3.6cqw, 0.78rem)'

  // Variants that are a single stack (number + label, chart + label, etc.)
  // should be vertically centered in the card so the hero value sits mid-card
  // instead of glued to the top when a sibling KPI makes the row taller.
  const centeredCard: CSSProperties = {
    ...cardBase,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  }

  switch (kpi.type) {
    case 'number':
      return (
        <div style={centeredCard}>
          <p style={{ fontSize: bigNumFs, fontWeight: 800, color: primaryColor, lineHeight: 1, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {kpi.value.toLocaleString()}{kpi.unit}
          </p>
          <p style={{ fontSize: labelFs, color: muted, marginTop: 10, overflowWrap: 'anywhere' }}>{kpi.label}</p>
        </div>
      )

    case 'percentage': {
      const size = 90
      const stroke = 8
      const r = (size - stroke) / 2
      const circ = 2 * Math.PI * r
      const offset = circ - (pct / 100) * circ
      return (
        <div style={centeredCard}>
          <div style={{ position: 'relative', width: '100%', maxWidth: size, aspectRatio: '1 / 1' }}>
            <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? '#333' : '#F0F0F0'} strokeWidth={stroke} />
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={primaryColor} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(0.95rem, 7cqw, 1.25rem)', fontWeight: 700, color: text }}>
              {Math.round(pct)}{kpi.unit || '%'}
            </span>
          </div>
          <p style={{ fontSize: labelFs, color: muted, marginTop: 10, overflowWrap: 'anywhere' }}>{kpi.label}</p>
        </div>
      )
    }

    case 'progress':
      return (
        <div style={{ ...cardBase, padding: 'clamp(12px, 4.5cqw, 20px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8, minWidth: 0 }}>
            <span style={{ fontSize: labelFs, fontWeight: 600, color: text, overflowWrap: 'anywhere', minWidth: 0 }}>{kpi.label}</span>
            <span style={{ fontSize: labelFs, fontWeight: 700, color: primaryColor, whiteSpace: 'nowrap' }}>{kpi.value}{kpi.unit}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, backgroundColor: dark ? '#333' : '#F0F0F0', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: primaryColor, transition: 'width 0.8s ease' }} />
          </div>
        </div>
      )

    case 'stars': {
      const rating = Math.min(kpi.value, 5)
      const fullStars = Math.floor(rating)
      const hasHalf = rating - fullStars >= 0.5
      return (
        <div style={centeredCard}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(2px, 1cqw, 4px)', marginBottom: 8, flexWrap: 'nowrap' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={22}
                style={{ width: 'clamp(14px, 8cqw, 26px)', height: 'auto', flexShrink: 1 }}
                fill={i < fullStars ? primaryColor : (i === fullStars && hasHalf) ? `url(#half-${kpi.id})` : 'none'}
                color={i < fullStars || (i === fullStars && hasHalf) ? primaryColor : (dark ? '#444' : '#DDD')}
              />
            ))}
          </div>
          <p style={{ fontSize: 'clamp(1.35rem, 11cqw, 2rem)', fontWeight: 800, color: text, lineHeight: 1 }}>{rating}<span style={{ fontSize: '0.55em', color: muted, fontWeight: 600 }}>/5</span></p>
          <p style={{ fontSize: labelFs, color: muted, marginTop: 8, overflowWrap: 'anywhere' }}>{kpi.label}</p>
        </div>
      )
    }

    case 'trend': {
      const isUp = (kpi.secondaryValue ?? 0) >= 0
      return (
        <div style={centeredCard}>
          <p style={{ fontSize: 'clamp(1.6rem, 18cqw, 2.75rem)', fontWeight: 800, color: text, lineHeight: 1, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {kpi.value.toLocaleString()}{kpi.unit}
          </p>
          {kpi.secondaryValue !== undefined && (
            <p style={{ fontSize: labelFs, fontWeight: 600, marginTop: 8, color: isUp ? '#22C55E' : '#EF4444', overflowWrap: 'anywhere' }}>
              {isUp ? '↑' : '↓'} {Math.abs(kpi.secondaryValue)}{kpi.unit || '%'}
              {kpi.secondaryLabel && <span style={{ color: muted, fontWeight: 400 }}> {kpi.secondaryLabel}</span>}
            </p>
          )}
          <p style={{ fontSize: labelFs, color: muted, marginTop: 6, overflowWrap: 'anywhere' }}>{kpi.label}</p>
        </div>
      )
    }

    case 'counter':
      return (
        <div style={{ ...centeredCard, backgroundColor: primaryColor, border: 'none' }}>
          <p style={{ fontSize: bigNumFs, fontWeight: 800, color: '#FFFFFF', lineHeight: 1, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {kpi.value.toLocaleString()}{kpi.unit}
          </p>
          <p style={{ fontSize: labelFs, color: 'rgba(255,255,255,0.8)', marginTop: 10, overflowWrap: 'anywhere' }}>{kpi.label}</p>
        </div>
      )

    case 'comparison': {
      // Each side only gets ~half the card width — use a tighter cqw ratio and
      // keep numbers on one line (clip with ellipsis rather than wrap mid-number).
      const compFs = 'clamp(0.9rem, 7.5cqw, 1.8rem)'
      const numStyle: CSSProperties = { fontSize: compFs, fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
      return (
        <div style={{ ...cardBase, display: 'flex', alignItems: 'center', gap: 'clamp(6px, 3cqw, 16px)', flexWrap: 'nowrap' }}>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <p style={{ ...numStyle, color: muted }}>{kpi.secondaryValue ?? 0}{kpi.unit}</p>
            <p style={{ fontSize: subFs, color: muted, marginTop: 6, overflowWrap: 'anywhere' }}>{kpi.secondaryLabel ?? 'Avant'}</p>
          </div>
          <div style={{ fontSize: 'clamp(0.9rem, 6cqw, 1.2rem)', color: primaryColor, fontWeight: 700, flexShrink: 0 }}>→</div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <p style={{ ...numStyle, color: primaryColor }}>{kpi.value}{kpi.unit}</p>
            <p style={{ fontSize: subFs, color: muted, marginTop: 6, overflowWrap: 'anywhere' }}>{kpi.label}</p>
          </div>
        </div>
      )
    }

    case 'bars': {
      const points = kpi.dataPoints ?? [{ label: kpi.label, value: kpi.value }]
      const max = Math.max(...points.map((p) => p.value), 1)
      return (
        <div style={{ ...cardBase, padding: 'clamp(12px, 4.5cqw, 20px)' }}>
          <p style={{ fontSize: labelFs, fontWeight: 600, color: text, marginBottom: 12, overflowWrap: 'anywhere' }}>{kpi.label}</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(2px, 1.5cqw, 6px)', height: 80 }}>
            {points.map((p, i) => (
              <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', backgroundColor: primaryColor, borderRadius: 4, opacity: 0.6 + (p.value / max) * 0.4,
                  height: `${(p.value / max) * 100}%`, minHeight: 4, transition: 'height 0.5s ease' }} />
                <span style={{ fontSize: 'clamp(0.55rem, 3cqw, 0.65rem)', color: muted, width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'donut': {
      const size2 = 100
      const stroke2 = 20
      const r2 = (size2 - stroke2) / 2
      const circ2 = 2 * Math.PI * r2
      const offset2 = circ2 - (pct / 100) * circ2
      return (
        <div style={centeredCard}>
          <div style={{ position: 'relative', width: '100%', maxWidth: size2, aspectRatio: '1 / 1' }}>
            <svg viewBox={`0 0 ${size2} ${size2}`} width="100%" height="100%" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
              <circle cx={size2 / 2} cy={size2 / 2} r={r2} fill="none" stroke={dark ? '#333' : '#F0F0F0'} strokeWidth={stroke2} />
              <circle cx={size2 / 2} cy={size2 / 2} r={r2} fill="none" stroke={primaryColor} strokeWidth={stroke2}
                strokeDasharray={circ2} strokeDashoffset={offset2} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 'clamp(0.95rem, 8cqw, 1.3rem)', fontWeight: 800, color: text }}>{kpi.value}</span>
              <span style={{ fontSize: 'clamp(0.55rem, 3cqw, 0.65rem)', color: muted }}>{kpi.unit || `/${kpi.maxValue}`}</span>
            </span>
          </div>
          <p style={{ fontSize: labelFs, color: muted, marginTop: 10, overflowWrap: 'anywhere' }}>{kpi.label}</p>
        </div>
      )
    }

    case 'timeline': {
      const points2 = kpi.dataPoints ?? [{ label: kpi.label, value: kpi.value }]
      return (
        <div style={{ ...cardBase, padding: 'clamp(12px, 4.5cqw, 20px)', gridColumn: 'span 2' }}>
          <p style={{ fontSize: labelFs, fontWeight: 600, color: text, marginBottom: 16, overflowWrap: 'anywhere' }}>{kpi.label}</p>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, backgroundColor: dark ? '#333' : '#EBEBEB' }} />
            {points2.map((p, i) => (
              <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: primaryColor, marginBottom: 8, border: `2px solid ${bg}`, flexShrink: 0 }} />
                <span style={{ fontSize: 'clamp(0.65rem, 4cqw, 0.75rem)', fontWeight: 600, color: text, overflowWrap: 'anywhere', textAlign: 'center' }}>{p.value}{kpi.unit}</span>
                <span style={{ fontSize: 'clamp(0.55rem, 3cqw, 0.65rem)', color: muted, marginTop: 2, overflowWrap: 'anywhere', textAlign: 'center' }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    default:
      return null
  }
}
