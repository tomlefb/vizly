'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TemplatePurchaseModal } from '@/components/billing/TemplatePurchaseModal'

interface Props {
  templateName: string
  templateLabel: string
  isPremium: boolean
  isAuthenticated: boolean
  alreadyOwned: boolean
}

export function TemplateDetailCTA({
  templateName,
  templateLabel,
  isPremium,
  isAuthenticated,
  alreadyOwned,
}: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)

  const secondary = (
    <Link
      href="/templates"
      className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-warm"
    >
      Voir les autres templates
    </Link>
  )

  if (!isAuthenticated) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link
          href="/register"
          className="inline-flex items-center rounded-[var(--radius-md)] bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
        >
          {isPremium ? 'Essayer ce template (2,99\u20AC)' : 'Utiliser ce template'}
        </Link>
        {secondary}
      </div>
    )
  }

  if (!isPremium || alreadyOwned) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link
          href="/editor"
          className="inline-flex items-center rounded-[var(--radius-md)] bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
        >
          Utiliser ce template
        </Link>
        {secondary}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center rounded-[var(--radius-md)] bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
        >
          Acheter ce template (2,99&euro;)
        </button>
        {secondary}
      </div>

      <TemplatePurchaseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        templateId={templateName}
        templateLabel={templateLabel}
        onSuccess={() => router.push('/editor')}
        onAlreadyOwned={() => router.push('/editor')}
      />
    </>
  )
}
