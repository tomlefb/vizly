'use client'

import { useCallback, useState } from 'react'
import { Send, Loader2, CheckCircle2 } from 'lucide-react'

interface ContactFormWidgetProps {
  slug: string
  primaryColor: string
  title: string
  description: string
  textColor?: string
  surfaceColor?: string
  isPreview?: boolean
}

/**
 * Formulaire de contact embarqué dans les templates (feature Pro).
 * POST vers /api/contact qui valide côté serveur que le propriétaire est Pro.
 * Styles inline uniquement — les templates sont rendus côté serveur avec
 * du CSS isolé, pas de classes Tailwind fiables ici.
 */
export function ContactFormWidget({
  slug,
  primaryColor,
  title,
  description,
  textColor = '#1A1A1A',
  surfaceColor = '#FFFFFF',
  isPreview = false,
}: ContactFormWidgetProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '0.9rem',
    borderRadius: 10,
    border: `1px solid ${textColor}1F`,
    background: surfaceColor,
    color: textColor,
    outline: 'none',
    transition: 'border-color 150ms ease',
    fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 6,
    fontSize: '0.82rem',
    fontWeight: 500,
    color: textColor,
  }

  if (status === 'sent') {
    return (
      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          padding: '32px 24px',
          borderRadius: 14,
          background: surfaceColor,
          border: `1px solid ${textColor}14`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: `${primaryColor}14`,
            marginBottom: 12,
          }}
        >
          <CheckCircle2 size={22} color={primaryColor} strokeWidth={2} />
        </div>
        <p style={{ fontSize: '1rem', fontWeight: 600, color: textColor, marginBottom: 6 }}>
          Message envoyé !
        </p>
        <p style={{ fontSize: '0.88rem', color: `${textColor}99` }}>
          Merci, je te réponds dès que possible.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 520,
        margin: '0 auto',
        padding: '28px 24px',
        borderRadius: 14,
        background: surfaceColor,
        border: `1px solid ${textColor}14`,
        textAlign: 'left',
      }}
    >
      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: textColor,
          marginBottom: 6,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: '0.9rem', color: `${textColor}99`, marginBottom: 20, lineHeight: 1.5 }}>
        {description}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor={`vf-name-${slug}`}>Nom</label>
          <input
            id={`vf-name-${slug}`}
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ton nom"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor={`vf-email-${slug}`}>Email</label>
          <input
            id={`vf-email-${slug}`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="toi@example.com"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor={`vf-msg-${slug}`}>Message</label>
          <textarea
            id={`vf-msg-${slug}`}
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Dis-moi ce qui t'amène…"
            style={{ ...inputStyle, resize: 'vertical', minHeight: 100, fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {status === 'error' && (
        <p style={{ marginTop: 10, fontSize: '0.82rem', color: '#DC2626' }}>{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        style={{
          marginTop: 16,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
          padding: '12px 20px',
          borderRadius: 10,
          background: primaryColor,
          color: '#FFFFFF',
          fontSize: '0.92rem',
          fontWeight: 600,
          border: 'none',
          cursor: status === 'sending' ? 'not-allowed' : 'pointer',
          opacity: status === 'sending' ? 0.7 : 1,
          transition: 'opacity 150ms ease',
          fontFamily: 'inherit',
        }}
      >
        {status === 'sending' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Envoi…
          </>
        ) : (
          <>
            <Send size={16} />
            Envoyer
          </>
        )}
      </button>
    </form>
  )
}
