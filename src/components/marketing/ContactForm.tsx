'use client'

import { useState, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VzHighlight, vzBtnClasses } from '@/components/ui/vizly'

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
        setErrorMsg('Erreur réseau. Réessaie.')
      }
    },
    [name, email, message]
  )

  if (status === 'sent') {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border-light bg-surface p-10 text-center">
        <h2 className="font-[family-name:var(--font-satoshi)] text-xl font-semibold tracking-tight leading-[1.1]">
          Message <VzHighlight>envoyé</VzHighlight>.
        </h2>
        <p className="mt-4 text-sm text-muted leading-relaxed">
          On te répond au plus vite.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus('idle')
            setErrorMsg('')
          }}
          className="mt-6 text-sm font-medium text-foreground underline underline-offset-4 transition-colors duration-150 hover:text-accent-deep"
        >
          Envoyer un autre message
        </button>
      </div>
    )
  }

  const inputClasses =
    'w-full h-10 rounded-[var(--radius-md)] border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20'

  const textareaClasses =
    'w-full rounded-[var(--radius-md)] border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 resize-y min-h-[120px] focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20'

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
          className={inputClasses}
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
          className={inputClasses}
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
          className={textareaClasses}
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className={cn(
          vzBtnClasses({ variant: 'primary', size: 'md', className: 'w-full' }),
          status === 'sending' && 'opacity-70 cursor-not-allowed'
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
