'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCcw, Trash2 } from 'lucide-react'
import { VzBadge, VzBtn } from '@/components/ui/vizly'
import {
  addCustomDomain,
  verifyCustomDomain,
  removeCustomDomain,
} from '@/actions/domain'

type DomainStatus = 'pending' | 'verified' | 'failed' | null

interface DomainAssignmentFormProps {
  portfolioId: string
  currentDomain: string
  currentStatus: DomainStatus
  // Hôte CNAME retourné par Railway à l'enregistrement — stocké côté DB
  // pour pouvoir l'afficher au fur et à mesure des visites même après
  // un router.refresh() qui remonterait le composant.
  currentDnsTarget: string | null
}

export function DomainAssignmentForm({
  portfolioId,
  currentDomain,
  currentStatus,
  currentDnsTarget,
}: DomainAssignmentFormProps) {
  const router = useRouter()
  const [draft, setDraft] = useState('')
  const [message, setMessage] = useState<
    | { kind: 'error' | 'success' | 'info'; text: string }
    | null
  >(null)
  const [dnsTargetOverride, setDnsTargetOverride] = useState<string | null>(null)
  const dnsTarget = dnsTargetOverride ?? currentDnsTarget
  const [isPending, startTransition] = useTransition()

  const hasDomain = currentDomain !== ''

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const result = await addCustomDomain(portfolioId, draft.trim())
      if (!result.ok) {
        setMessage({ kind: 'error', text: result.error ?? 'Erreur inconnue.' })
        return
      }
      if (result.dnsTarget) setDnsTargetOverride(result.dnsTarget)
      setMessage({
        kind: 'info',
        text: 'Domaine enregistré. Configure ton DNS puis clique sur Vérifier.',
      })
      setDraft('')
      router.refresh()
    })
  }

  function handleVerify() {
    setMessage(null)
    startTransition(async () => {
      const result = await verifyCustomDomain(portfolioId)
      if (!result.ok) {
        setMessage({ kind: 'error', text: result.error ?? 'Vérification échouée.' })
        return
      }
      setMessage({ kind: 'success', text: 'Domaine vérifié, il est maintenant actif.' })
      router.refresh()
    })
  }

  function handleRemove() {
    if (!window.confirm('Retirer ce domaine ? Le portfolio redeviendra accessible uniquement sur son sous-domaine vizly.fr.')) {
      return
    }
    setMessage(null)
    startTransition(async () => {
      const result = await removeCustomDomain(portfolioId)
      if (!result.ok) {
        setMessage({ kind: 'error', text: result.error ?? 'Suppression échouée.' })
        return
      }
      setMessage({ kind: 'success', text: 'Domaine retiré.' })
      setDnsTargetOverride(null)
      router.refresh()
    })
  }

  // Etat vide : formulaire d'ajout classique
  if (!hasDomain) {
    return (
      <div className="space-y-2">
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setMessage(null)
            }}
            placeholder="portfolio.monsite.com"
            className="h-10 min-w-0 flex-1 rounded-[var(--radius-md)] border border-border-light bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent-deep focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <VzBtn
            type="submit"
            variant="primary"
            size="md"
            disabled={isPending || draft.trim() === ''}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Enregistrement…
              </>
            ) : (
              'Ajouter'
            )}
          </VzBtn>
        </form>
        <MessageLine message={message} />
      </div>
    )
  }

  // Etat occupé : on affiche le domaine courant + status + actions
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm text-foreground">{currentDomain}</span>
        <StatusBadge status={currentStatus} />
        <div className="ml-auto flex gap-2">
          {currentStatus !== 'verified' && (
            <VzBtn
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleVerify}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : (
                <RefreshCcw className="h-4 w-4" strokeWidth={2} />
              )}
              Vérifier
            </VzBtn>
          )}
          <VzBtn
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            disabled={isPending}
            aria-label="Retirer le domaine"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
            Retirer
          </VzBtn>
        </div>
      </div>

      {currentStatus !== 'verified' && (
        <div className="rounded-[var(--radius-md)] border border-border-light bg-surface-warm px-4 py-3 text-xs text-foreground">
          <p className="font-medium">Configuration DNS à faire chez ton registrar :</p>
          <p className="mt-2">
            Crée un <Code>CNAME</Code> pour <Code>{currentDomain}</Code> pointant
            vers{' '}
            {dnsTarget ? (
              <Code>{dnsTarget}</Code>
            ) : (
              <em>
                (l&apos;hôte exact s&apos;affichera après un premier clic
                « Vérifier »)
              </em>
            )}
            . La propagation prend en général entre 1 minute et quelques heures.
            Une fois faite, clique sur « Vérifier ».
          </p>
        </div>
      )}

      <MessageLine message={message} />
    </div>
  )
}

function StatusBadge({ status }: { status: DomainStatus }) {
  if (status === 'verified') {
    return <VzBadge variant="online">Actif</VzBadge>
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
        Échec
      </span>
    )
  }
  // pending ou null
  return (
    <span className="inline-flex items-center rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent-deep">
      En attente
    </span>
  )
}

function MessageLine({
  message,
}: {
  message: { kind: 'error' | 'success' | 'info'; text: string } | null
}) {
  if (!message) return null
  const role = message.kind === 'error' ? 'alert' : 'status'
  const colorClass =
    message.kind === 'error'
      ? 'text-destructive'
      : message.kind === 'success'
        ? 'text-[var(--color-success-fg)]'
        : 'text-muted'
  return (
    <p className={`text-xs ${colorClass}`} role={role}>
      {message.text}
    </p>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-[var(--radius-sm)] bg-surface px-1.5 py-0.5 font-mono text-xs font-medium text-foreground">
      {children}
    </code>
  )
}
