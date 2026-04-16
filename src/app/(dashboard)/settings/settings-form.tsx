'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { updateProfile, deleteAccount } from '@/actions/auth'

interface SettingsFormProps {
  initialName: string
  showDeleteOnly?: boolean
}

export function SettingsForm({ initialName, showDeleteOnly }: SettingsFormProps) {
  const router = useRouter()
  const t = useTranslations('settings')

  // ---------------------------------------------------------------------------
  // Name update
  // ---------------------------------------------------------------------------
  const [name, setName] = useState(initialName)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleNameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setNameError(null)
    setNameSuccess(false)

    startTransition(async () => {
      const result = await updateProfile(name.trim())
      if (result.error) {
        setNameError(result.error)
      } else {
        setNameSuccess(true)
        router.refresh()
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Delete account
  // ---------------------------------------------------------------------------
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, startDelete] = useTransition()

  function handleDelete() {
    setDeleteError(null)

    startDelete(async () => {
      const result = await deleteAccount()
      if (result.error) {
        setDeleteError(result.error)
        setShowConfirm(false)
      } else {
        router.push('/')
        router.refresh()
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Render: delete-only mode — horizontal footer layout
  // (title + description left, destructive CTA right; inline confirmation below
  // when triggered).
  // ---------------------------------------------------------------------------
  if (showDeleteOnly) {
    return (
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-[family-name:var(--font-satoshi)] text-base font-semibold text-foreground">
              {t('deleteAccount')}
            </h3>
            <p className="mt-1 text-sm text-muted">{t('dangerDescription')}</p>
          </div>
          {!showConfirm && (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="inline-flex h-9 shrink-0 items-center rounded-[var(--radius-md)] border border-destructive/20 bg-surface px-4 text-sm font-semibold text-destructive transition-colors duration-150 hover:bg-destructive/5"
            >
              {t('deleteAccountCta')}
            </button>
          )}
        </div>
        {showConfirm && (
          <div className="mt-5 rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/5 p-4">
            <p className="mb-3 text-sm font-medium text-destructive">
              {t('deleteConfirm')}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex h-9 items-center rounded-[var(--radius-md)] bg-destructive px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-destructive/90 disabled:opacity-50"
              >
                {isDeleting ? t('deleting') : t('deleteConfirmBtn')}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface-warm disabled:opacity-50"
              >
                {t('cancel')}
              </button>
            </div>
            {deleteError && (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {deleteError}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: name form
  // ---------------------------------------------------------------------------
  return (
    <form onSubmit={handleNameSubmit}>
      <label
        htmlFor="settings-name"
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        {t('name')}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="settings-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setNameError(null)
            setNameSuccess(false)
          }}
          placeholder={t('namePlaceholder')}
          maxLength={100}
          className="h-10 min-w-0 flex-1 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
        />
        <button
          type="submit"
          disabled={isPending || name.trim() === initialName}
          className="inline-flex h-10 min-w-[140px] items-center justify-center rounded-[var(--radius-md)] bg-accent px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? t('saving') : t('save')}
        </button>
      </div>
      {nameError && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {nameError}
        </p>
      )}
      {nameSuccess && (
        <p className="mt-2 text-sm text-success" role="status">
          {t('nameSuccess')}
        </p>
      )}
    </form>
  )
}
