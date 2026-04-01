'use client'

import { Star } from 'lucide-react'
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

  switch (kpi.type) {
    case 'number':
      return (
        <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '24px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: primaryColor, lineHeight: 1 }}>
            {kpi.value.toLocaleString()}{kpi.unit}
          </p>
          <p style={{ fontSize: '0.85rem', color: muted, marginTop: 8 }}>{kpi.label}</p>
        </div>
      )

    case 'percentage': {
      const size = 90
      const stroke = 8
      const r = (size - stroke) / 2
      const circ = 2 * Math.PI * r
      const offset = circ - (pct / 100) * circ
      return (
        <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '24px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? '#333' : '#F0F0F0'} strokeWidth={stroke} />
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={primaryColor} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: text }}>
              {Math.round(pct)}{kpi.unit || '%'}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: muted, marginTop: 10 }}>{kpi.label}</p>
        </div>
      )
    }

    case 'progress':
      return (
        <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: text }}>{kpi.label}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: primaryColor }}>{kpi.value}{kpi.unit}</span>
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
        <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={22}
                fill={i < fullStars ? primaryColor : (i === fullStars && hasHalf) ? `url(#half-${kpi.id})` : 'none'}
                color={i < fullStars || (i === fullStars && hasHalf) ? primaryColor : (dark ? '#444' : '#DDD')}
              />
            ))}
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: text }}>{rating}<span style={{ fontSize: '0.9rem', color: muted }}>/5</span></p>
          <p style={{ fontSize: '0.85rem', color: muted, marginTop: 4 }}>{kpi.label}</p>
        </div>
      )
    }

    case 'trend': {
      const isUp = (kpi.secondaryValue ?? 0) >= 0
      return (
        <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '24px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: '2.2rem', fontWeight: 800, color: text, lineHeight: 1 }}>
            {kpi.value.toLocaleString()}{kpi.unit}
          </p>
          {kpi.secondaryValue !== undefined && (
            <p style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: 8, color: isUp ? '#22C55E' : '#EF4444' }}>
              {isUp ? '↑' : '↓'} {Math.abs(kpi.secondaryValue)}{kpi.unit || '%'}
              {kpi.secondaryLabel && <span style={{ color: muted, fontWeight: 400 }}> {kpi.secondaryLabel}</span>}
            </p>
          )}
          <p style={{ fontSize: '0.85rem', color: muted, marginTop: 6 }}>{kpi.label}</p>
        </div>
      )
    }

    case 'counter':
      return (
        <div style={{ backgroundColor: primaryColor, borderRadius: 12, padding: '24px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
            {kpi.value.toLocaleString()}{kpi.unit}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>{kpi.label}</p>
        </div>
      )

    case 'comparison':
      return (
        <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: muted, lineHeight: 1 }}>{kpi.secondaryValue ?? 0}{kpi.unit}</p>
            <p style={{ fontSize: '0.78rem', color: muted, marginTop: 6 }}>{kpi.secondaryLabel ?? 'Avant'}</p>
          </div>
          <div style={{ fontSize: '1.2rem', color: primaryColor, fontWeight: 700 }}>→</div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: primaryColor, lineHeight: 1 }}>{kpi.value}{kpi.unit}</p>
            <p style={{ fontSize: '0.78rem', color: muted, marginTop: 6 }}>{kpi.label}</p>
          </div>
        </div>
      )

    case 'bars': {
      const points = kpi.dataPoints ?? [{ label: kpi.label, value: kpi.value }]
      const max = Math.max(...points.map((p) => p.value), 1)
      return (
        <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '20px' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: text, marginBottom: 12 }}>{kpi.label}</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
            {points.map((p, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', backgroundColor: primaryColor, borderRadius: 4, opacity: 0.6 + (p.value / max) * 0.4,
                  height: `${(p.value / max) * 100}%`, minHeight: 4, transition: 'height 0.5s ease' }} />
                <span style={{ fontSize: '0.65rem', color: muted, whiteSpace: 'nowrap' }}>{p.label}</span>
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
        <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '24px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: size2, height: size2 }}>
            <svg width={size2} height={size2} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={size2 / 2} cy={size2 / 2} r={r2} fill="none" stroke={dark ? '#333' : '#F0F0F0'} strokeWidth={stroke2} />
              <circle cx={size2 / 2} cy={size2 / 2} r={r2} fill="none" stroke={primaryColor} strokeWidth={stroke2}
                strokeDasharray={circ2} strokeDashoffset={offset2} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: text }}>{kpi.value}</span>
              <span style={{ fontSize: '0.65rem', color: muted }}>{kpi.unit || `/${kpi.maxValue}`}</span>
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: muted, marginTop: 10 }}>{kpi.label}</p>
        </div>
      )
    }

    case 'timeline': {
      const points2 = kpi.dataPoints ?? [{ label: kpi.label, value: kpi.value }]
      return (
        <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '20px', gridColumn: 'span 2' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: text, marginBottom: 16 }}>{kpi.label}</p>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, backgroundColor: dark ? '#333' : '#EBEBEB' }} />
            {points2.map((p, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: primaryColor, marginBottom: 8, border: `2px solid ${bg}` }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: text }}>{p.value}{kpi.unit}</span>
                <span style={{ fontSize: '0.65rem', color: muted, marginTop: 2 }}>{p.label}</span>
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
