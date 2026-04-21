'use client'

import { useCallback, useState, type CSSProperties } from 'react'
import { Send, Loader2, CheckCircle2 } from 'lucide-react'

export type ContactFormVariant =
  | 'minimal'
  | 'dark'
  | 'classique'
  | 'colore'
  | 'creatif'
  | 'brutalist'
  | 'elegant'
  | 'bento'

interface ContactFormWidgetProps {
  slug: string
  primaryColor: string
  title: string
  description: string
  textColor?: string
  /** Heading color — used for the form title & success headline. Falls back to textColor. */
  headingColor?: string
  surfaceColor?: string
  isPreview?: boolean
  variant?: ContactFormVariant
}

interface VariantStyles {
  container: CSSProperties
  title: CSSProperties
  description: CSSProperties
  label: CSSProperties
  input: CSSProperties
  inputFocus?: CSSProperties
  button: CSSProperties
  buttonIcon?: number
  successContainer?: CSSProperties
  successIconWrap: CSSProperties
  successTitle: CSSProperties
  successText: CSSProperties
  gap: number
  // Optional decorative separator between title+desc and form fields
  headerSeparator?: CSSProperties
}

function buildVariant(
  variant: ContactFormVariant,
  primary: string,
  text: string,
  heading: string,
  surface: string,
): VariantStyles {
  const alpha = (hex: string, a: string) => `${hex}${a}`
  const isLight = (hex: string): boolean => {
    const clean = hex.replace('#', '')
    if (clean.length !== 6) return true
    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
  }

  switch (variant) {
    case 'dark': {
      const inputBg = '#0E0E17'
      return {
        container: {
          padding: '28px 24px',
          borderRadius: 12,
          background: surface,
          border: `1px solid ${alpha(primary, '26')}`,
          boxShadow: `0 0 0 1px ${alpha(primary, '10')}, 0 24px 48px -24px ${alpha(primary, '33')}`,
          maxWidth: 560,
          margin: '0 auto',
        },
        title: {
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '1.1rem',
          fontWeight: 700,
          color: heading,
          marginBottom: 6,
          letterSpacing: '-0.01em',
        },
        description: {
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.82rem',
          color: alpha(text, '99'),
          marginBottom: 20,
          lineHeight: 1.55,
        },
        label: {
          display: 'block',
          marginBottom: 6,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.7rem',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: alpha(text, 'AA'),
        },
        input: {
          width: '100%',
          padding: '11px 13px',
          fontSize: '0.88rem',
          borderRadius: 8,
          border: `1px solid ${alpha(primary, '2E')}`,
          background: inputBg,
          color: text,
          outline: 'none',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          fontFamily: "'JetBrains Mono', monospace",
        },
        button: {
          marginTop: 18,
          width: '100%',
          padding: '12px 20px',
          borderRadius: 8,
          background: primary,
          color: '#FFFFFF',
          fontSize: '0.82rem',
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          border: 'none',
          boxShadow: `0 0 24px -4px ${alpha(primary, '80')}`,
        },
        buttonIcon: 15,
        successIconWrap: {
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: alpha(primary, '1F'),
          border: `1px solid ${alpha(primary, '55')}`,
        },
        successTitle: {
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '1rem',
          fontWeight: 700,
          color: heading,
          letterSpacing: '-0.01em',
        },
        successText: {
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.82rem',
          color: alpha(text, '99'),
        },
        gap: 14,
      }
    }

    case 'classique': {
      return {
        container: {
          padding: '32px 28px',
          borderRadius: 4,
          background: surface,
          border: `1px solid #D9D5CF`,
          maxWidth: 560,
          margin: '0 auto',
        },
        title: {
          fontFamily: "'Merriweather', serif",
          fontSize: '1.4rem',
          fontWeight: 700,
          color: heading,
          marginBottom: 8,
          letterSpacing: '-0.01em',
        },
        description: {
          fontFamily: "'Lato', sans-serif",
          fontSize: '0.9rem',
          color: alpha(text, '99'),
          marginBottom: 22,
          lineHeight: 1.6,
        },
        label: {
          display: 'block',
          marginBottom: 6,
          fontFamily: "'Lato', sans-serif",
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: text,
        },
        input: {
          width: '100%',
          padding: '10px 12px',
          fontSize: '0.92rem',
          borderRadius: 2,
          border: `1px solid #D9D5CF`,
          background: '#FFFFFF',
          color: text,
          outline: 'none',
          transition: 'border-color 150ms ease',
          fontFamily: "'Lato', sans-serif",
        },
        button: {
          marginTop: 18,
          width: '100%',
          padding: '13px 20px',
          borderRadius: 2,
          background: primary,
          color: '#FFFFFF',
          fontSize: '0.82rem',
          fontWeight: 700,
          fontFamily: "'Lato', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          border: 'none',
        },
        buttonIcon: 15,
        headerSeparator: {
          width: 44,
          height: 2,
          background: primary,
          margin: '0 0 20px 0',
        },
        successIconWrap: {
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: alpha(primary, '14'),
        },
        successTitle: {
          fontFamily: "'Merriweather', serif",
          fontSize: '1.1rem',
          fontWeight: 700,
          color: heading,
        },
        successText: {
          fontFamily: "'Lato', sans-serif",
          fontSize: '0.9rem',
          color: alpha(text, '99'),
        },
        gap: 14,
      }
    }

    case 'colore': {
      return {
        container: {
          padding: '32px 28px',
          borderRadius: 22,
          background: surface,
          border: `1.5px solid ${alpha(primary, '29')}`,
          boxShadow: `0 24px 48px -24px ${alpha(primary, '2E')}`,
          maxWidth: 560,
          margin: '0 auto',
        },
        title: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '1.45rem',
          fontWeight: 700,
          color: heading,
          marginBottom: 6,
          letterSpacing: '-0.015em',
        },
        description: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.92rem',
          color: alpha(text, '99'),
          marginBottom: 22,
          lineHeight: 1.55,
        },
        label: {
          display: 'block',
          marginBottom: 6,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.82rem',
          fontWeight: 600,
          color: text,
        },
        input: {
          width: '100%',
          padding: '12px 16px',
          fontSize: '0.92rem',
          borderRadius: 14,
          border: `1.5px solid ${alpha(primary, '20')}`,
          background: '#FFFFFF',
          color: text,
          outline: 'none',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          fontFamily: "'DM Sans', sans-serif",
        },
        button: {
          marginTop: 20,
          width: '100%',
          padding: '14px 20px',
          borderRadius: 999,
          background: primary,
          color: '#FFFFFF',
          fontSize: '0.95rem',
          fontWeight: 700,
          fontFamily: "'DM Sans', sans-serif",
          border: 'none',
          boxShadow: `0 8px 20px -6px ${alpha(primary, '66')}`,
        },
        buttonIcon: 16,
        successIconWrap: {
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: alpha(primary, '1A'),
        },
        successTitle: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '1.15rem',
          fontWeight: 700,
          color: heading,
        },
        successText: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.92rem',
          color: alpha(text, '99'),
        },
        gap: 14,
      }
    }

    case 'creatif': {
      return {
        container: {
          padding: '36px 30px',
          borderRadius: 0,
          background: surface,
          border: 'none',
          borderTop: `1px solid ${alpha(text, '1A')}`,
          borderBottom: `1px solid ${alpha(text, '1A')}`,
          maxWidth: 640,
          margin: '0 auto',
        },
        title: {
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)',
          fontWeight: 700,
          color: heading,
          marginBottom: 8,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        },
        description: {
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.95rem',
          color: alpha(text, '99'),
          marginBottom: 26,
          lineHeight: 1.6,
          maxWidth: 420,
        },
        label: {
          display: 'block',
          marginBottom: 6,
          fontFamily: "'Syne', sans-serif",
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: alpha(text, 'CC'),
        },
        input: {
          width: '100%',
          padding: '10px 0',
          fontSize: '0.95rem',
          borderRadius: 0,
          border: 'none',
          borderBottom: `1px solid ${alpha(text, '33')}`,
          background: 'transparent',
          color: text,
          outline: 'none',
          transition: 'border-color 150ms ease',
          fontFamily: "'Inter', sans-serif",
        },
        button: {
          marginTop: 26,
          width: '100%',
          padding: '15px 24px',
          borderRadius: 0,
          background: text,
          color: surface,
          fontSize: '0.82rem',
          fontWeight: 700,
          fontFamily: "'Syne', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          border: 'none',
        },
        buttonIcon: 15,
        successIconWrap: {
          width: 52,
          height: 52,
          borderRadius: 0,
          background: alpha(primary, '14'),
        },
        successTitle: {
          fontFamily: "'Syne', sans-serif",
          fontSize: '1.35rem',
          fontWeight: 700,
          color: heading,
          letterSpacing: '-0.01em',
        },
        successText: {
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.92rem',
          color: alpha(text, '99'),
        },
        gap: 18,
      }
    }

    case 'brutalist': {
      return {
        container: {
          padding: '32px 28px',
          borderRadius: 0,
          background: surface,
          border: `3px solid ${text}`,
          boxShadow: `8px 8px 0 0 ${primary}`,
          maxWidth: 540,
          margin: '0 auto',
        },
        title: {
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 400,
          color: heading,
          marginBottom: 6,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          lineHeight: 1,
        },
        description: {
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.82rem',
          color: alpha(text, 'CC'),
          marginBottom: 24,
          lineHeight: 1.55,
        },
        label: {
          display: 'block',
          marginBottom: 6,
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: text,
        },
        input: {
          width: '100%',
          padding: '11px 13px',
          fontSize: '0.9rem',
          borderRadius: 0,
          border: `2px solid ${text}`,
          background: surface,
          color: text,
          outline: 'none',
          transition: 'box-shadow 120ms ease',
          fontFamily: "'Space Mono', monospace",
        },
        button: {
          marginTop: 22,
          width: '100%',
          padding: '14px 22px',
          borderRadius: 0,
          background: primary,
          color: '#FFFFFF',
          fontSize: '0.92rem',
          fontWeight: 700,
          fontFamily: "'Bebas Neue', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          border: `3px solid ${text}`,
        },
        buttonIcon: 16,
        successIconWrap: {
          width: 52,
          height: 52,
          borderRadius: 0,
          background: primary,
          border: `3px solid ${text}`,
        },
        successTitle: {
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1.6rem',
          fontWeight: 400,
          color: heading,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        },
        successText: {
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.85rem',
          color: alpha(text, 'AA'),
        },
        gap: 16,
      }
    }

    case 'elegant': {
      return {
        container: {
          padding: '44px 40px',
          borderRadius: 0,
          background: surface,
          border: 'none',
          borderTop: `1px solid ${alpha(text, '1A')}`,
          borderBottom: `1px solid ${alpha(text, '1A')}`,
          textAlign: 'center',
          maxWidth: 600,
          margin: '0 auto',
        },
        title: {
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(1.8rem, 3.2vw, 2.4rem)',
          fontWeight: 400,
          color: heading,
          marginBottom: 10,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          lineHeight: 1.15,
          textAlign: 'center',
        },
        description: {
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          fontSize: '1rem',
          color: alpha(text, '80'),
          marginBottom: 28,
          lineHeight: 1.5,
          letterSpacing: '0.02em',
          textAlign: 'center',
        },
        label: {
          display: 'block',
          marginBottom: 8,
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '0.78rem',
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: alpha(text, 'AA'),
          textAlign: 'left',
        },
        input: {
          width: '100%',
          padding: '10px 0',
          fontSize: '1rem',
          borderRadius: 0,
          border: 'none',
          borderBottom: `1px solid ${alpha(text, '2E')}`,
          background: 'transparent',
          color: text,
          outline: 'none',
          transition: 'border-color 150ms ease',
          fontFamily: "'Cormorant Garamond', serif",
        },
        button: {
          marginTop: 28,
          padding: '13px 36px',
          borderRadius: 0,
          background: 'transparent',
          color: text,
          fontSize: '0.78rem',
          fontWeight: 500,
          fontFamily: "'Cormorant Garamond', serif",
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
          border: `1px solid ${text}`,
          alignSelf: 'center',
        },
        buttonIcon: 14,
        headerSeparator: {
          width: 40,
          height: 1,
          background: alpha(primary, '66'),
          margin: '0 auto 28px',
        },
        successIconWrap: {
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'transparent',
          border: `1px solid ${alpha(primary, '55')}`,
        },
        successTitle: {
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '1.4rem',
          fontWeight: 400,
          color: heading,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        },
        successText: {
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          fontSize: '1rem',
          color: alpha(text, '80'),
        },
        gap: 18,
      }
    }

    case 'bento': {
      const surfaceIsLight = isLight(surface)
      const bentoBorder = surfaceIsLight ? '#E8E7E2' : alpha(text, '1F')
      const inputBg = surfaceIsLight ? '#FAFAF7' : alpha(text, '0A')
      const inputBorder = surfaceIsLight ? '#E8E7E2' : alpha(text, '1F')
      // When the surface is dark, text is light → using it as button bg makes
      // the white label invisible. Use the accent instead in that case.
      const buttonBg = surfaceIsLight ? text : primary
      return {
        container: {
          padding: 'clamp(24px, 3vw, 34px)',
          borderRadius: 18,
          background: surface,
          border: `1px solid ${bentoBorder}`,
          width: '100%',
        },
        title: {
          fontFamily: "'Inter Tight', sans-serif",
          fontSize: '1.3rem',
          fontWeight: 700,
          color: heading,
          marginBottom: 6,
          letterSpacing: '-0.02em',
        },
        description: {
          fontFamily: "'Inter Tight', sans-serif",
          fontSize: '0.88rem',
          color: alpha(text, '99'),
          marginBottom: 22,
          lineHeight: 1.55,
        },
        label: {
          display: 'block',
          marginBottom: 5,
          fontFamily: "'Inter Tight', sans-serif",
          fontSize: '0.7rem',
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: alpha(text, '80'),
        },
        input: {
          width: '100%',
          padding: '11px 14px',
          fontSize: '0.9rem',
          borderRadius: 10,
          border: `1px solid ${inputBorder}`,
          background: inputBg,
          color: text,
          outline: 'none',
          transition: 'border-color 150ms ease, background 150ms ease',
          fontFamily: "'Inter Tight', sans-serif",
        },
        button: {
          marginTop: 18,
          width: '100%',
          padding: '12px 20px',
          borderRadius: 999,
          background: buttonBg,
          color: '#FFFFFF',
          fontSize: '0.88rem',
          fontWeight: 600,
          fontFamily: "'Inter Tight', sans-serif",
          letterSpacing: '-0.01em',
          border: 'none',
        },
        buttonIcon: 15,
        successIconWrap: {
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: alpha(primary, '14'),
        },
        successTitle: {
          fontFamily: "'Inter Tight', sans-serif",
          fontSize: '1.05rem',
          fontWeight: 600,
          color: heading,
          letterSpacing: '-0.01em',
        },
        successText: {
          fontFamily: "'Inter Tight', sans-serif",
          fontSize: '0.88rem',
          color: alpha(text, '99'),
        },
        gap: 12,
      }
    }

    case 'minimal':
    default: {
      return {
        container: {
          padding: '30px 26px',
          borderRadius: 14,
          background: surface,
          border: `1px solid ${alpha(text, '14')}`,
          maxWidth: 520,
          margin: '0 auto',
        },
        title: {
          fontFamily: "'Outfit', sans-serif",
          fontSize: '1.25rem',
          fontWeight: 700,
          color: heading,
          marginBottom: 6,
          letterSpacing: '-0.01em',
        },
        description: {
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.9rem',
          color: alpha(text, '99'),
          marginBottom: 22,
          lineHeight: 1.55,
        },
        label: {
          display: 'block',
          marginBottom: 6,
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.82rem',
          fontWeight: 500,
          color: text,
        },
        input: {
          width: '100%',
          padding: '11px 13px',
          fontSize: '0.9rem',
          borderRadius: 10,
          border: `1px solid ${alpha(text, '1F')}`,
          background: surface,
          color: text,
          outline: 'none',
          transition: 'border-color 150ms ease',
          fontFamily: "'Outfit', sans-serif",
        },
        button: {
          marginTop: 18,
          width: '100%',
          padding: '12px 20px',
          borderRadius: 10,
          background: primary,
          color: '#FFFFFF',
          fontSize: '0.92rem',
          fontWeight: 600,
          fontFamily: "'Outfit', sans-serif",
          border: 'none',
        },
        buttonIcon: 15,
        successIconWrap: {
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: alpha(primary, '14'),
        },
        successTitle: {
          fontFamily: "'Outfit', sans-serif",
          fontSize: '1.05rem',
          fontWeight: 600,
          color: heading,
        },
        successText: {
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.9rem',
          color: alpha(text, '99'),
        },
        gap: 12,
      }
    }
  }
}

/**
 * Formulaire de contact embarqué dans les templates (feature Pro).
 * POST vers /api/contact qui valide côté serveur que le propriétaire est Pro.
 * Le prop `variant` fait correspondre le style à l'identité visuelle du template parent.
 */
export function ContactFormWidget({
  slug,
  primaryColor,
  title,
  description,
  textColor = '#1A1A1A',
  headingColor,
  surfaceColor = '#FFFFFF',
  isPreview = false,
  variant = 'minimal',
}: ContactFormWidgetProps) {
  const resolvedHeading = headingColor ?? textColor
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [focusedId, setFocusedId] = useState<string | null>(null)

  const v = buildVariant(variant, primaryColor, textColor, resolvedHeading, surfaceColor)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (isPreview) return
      if (!name.trim() || !email.trim() || !message.trim()) return
      setStatus('sending')
      setErrorMsg('')
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message, slug }),
        })
        const data = (await res.json()) as { error?: string }
        if (!res.ok || data.error) {
          setStatus('error')
          setErrorMsg(data.error ?? 'Erreur lors de l\u2019envoi')
          return
        }
        setStatus('sent')
        setName('')
        setEmail('')
        setMessage('')
      } catch {
        setStatus('error')
        setErrorMsg('Impossible de contacter le serveur')
      }
    },
    [name, email, message, slug, isPreview]
  )

  const focusedInputStyle = (id: string): CSSProperties =>
    focusedId === id
      ? { borderColor: primaryColor, boxShadow: `0 0 0 3px ${primaryColor}1A` }
      : {}

  if (status === 'sent') {
    return (
      <div
        style={{
          ...v.container,
          textAlign: v.container.textAlign ?? 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
            ...v.successIconWrap,
          }}
        >
          <CheckCircle2
            size={22}
            color={variant === 'brutalist' ? '#FFFFFF' : primaryColor}
            strokeWidth={variant === 'brutalist' ? 2.5 : 2}
          />
        </div>
        <p style={{ ...v.successTitle, marginBottom: 6 }}>Message envoyé !</p>
        <p style={v.successText}>Merci, je te réponds dès que possible.</p>
      </div>
    )
  }

  const centered = variant === 'elegant'
  const buttonWrapperStyle: CSSProperties = centered
    ? { display: 'flex', justifyContent: 'center' }
    : {}

  return (
    <form onSubmit={handleSubmit} style={{ ...v.container, textAlign: v.container.textAlign }}>
      <h3 style={v.title}>{title}</h3>
      {description ? <p style={v.description}>{description}</p> : null}
      {v.headerSeparator ? <div style={v.headerSeparator} /> : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: v.gap }}>
        <div>
          <label style={v.label} htmlFor={`vf-name-${slug}`}>Nom</label>
          <input
            id={`vf-name-${slug}`}
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocusedId(`vf-name-${slug}`)}
            onBlur={() => setFocusedId(null)}
            placeholder="Ton nom"
            style={{ ...v.input, ...focusedInputStyle(`vf-name-${slug}`) }}
          />
        </div>
        <div>
          <label style={v.label} htmlFor={`vf-email-${slug}`}>Email</label>
          <input
            id={`vf-email-${slug}`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedId(`vf-email-${slug}`)}
            onBlur={() => setFocusedId(null)}
            placeholder="toi@example.com"
            style={{ ...v.input, ...focusedInputStyle(`vf-email-${slug}`) }}
          />
        </div>
        <div>
          <label style={v.label} htmlFor={`vf-msg-${slug}`}>Message</label>
          <textarea
            id={`vf-msg-${slug}`}
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setFocusedId(`vf-msg-${slug}`)}
            onBlur={() => setFocusedId(null)}
            placeholder="Dis-moi ce qui t'amène…"
            style={{
              ...v.input,
              resize: 'vertical',
              minHeight: 100,
              ...focusedInputStyle(`vf-msg-${slug}`),
            }}
          />
        </div>
      </div>

      {status === 'error' && (
        <p style={{ marginTop: 10, fontSize: '0.82rem', color: '#DC2626', fontFamily: 'inherit' }}>
          {errorMsg}
        </p>
      )}

      <div style={buttonWrapperStyle}>
        <button
          type="submit"
          disabled={status === 'sending'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: status === 'sending' ? 'not-allowed' : 'pointer',
            opacity: status === 'sending' ? 0.7 : 1,
            transition: 'opacity 150ms ease, transform 150ms ease',
            ...v.button,
          }}
        >
          {status === 'sending' ? (
            <>
              <Loader2 size={v.buttonIcon ?? 15} className="animate-spin" />
              Envoi…
            </>
          ) : (
            <>
              <Send size={v.buttonIcon ?? 15} />
              Envoyer
            </>
          )}
        </button>
      </div>
    </form>
  )
}
