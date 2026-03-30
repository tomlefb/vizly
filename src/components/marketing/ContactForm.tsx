'use client'

import { useState, useCallback } from 'react'
import { Send, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim() || !email.trim() || !message.trim()) return

      setStatus('sending')
      setErrorMsg('')

      try {
        const res = await fetch('/api/contact-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message }),
        })
        const data = (await res.json()) as { error?: string }

        if (!res.ok || data.error) {
          setStatus('error')
          setErrorMsg(data.error ?? 'Erreur lors de l\'envoi')
          return
        }

        setStatus('sent')
        setName('')
        setEmail('')
        setMessage('')
      } catch {
        setStatus('error')
        setErrorMsg('Erreur reseau. Reessaie.')
      }
    },
    [name, email, message]
  )

  if (status === 'sent') {
    return (
      <div className="rounded-[var(--radius-xl)] border border-success/20 bg-success/5 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mx-auto mb-4">
          <Check className="h-6 w-6 text-success" />
        </div>
        <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold mb-1">
          Message envoye
        </h2>
        <p className="text-sm text-muted">On te repond sous 24 heures.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="contact-name" className="block text-sm font-medium text-foreground">
          Nom
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ton nom"
          className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact-email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.com"
          className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact-message" className="block text-sm font-medium text-foreground">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ton message..."
          className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 resize-y min-h-[120px] focus:border-accent focus:outline-none"
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className={cn(
          'w-full inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold transition-all duration-200',
          status === 'sending'
            ? 'bg-accent/60 text-white/60 cursor-not-allowed'
            : 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98]'
        )}
      >
        {status === 'sending' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Envoyer
          </>
        )}
      </button>
    </form>
  )
}
