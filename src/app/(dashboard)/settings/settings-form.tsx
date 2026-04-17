'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { VzBtn } from '@/components/ui/vizly'
import { updateProfile, deleteAccount } from '@/actions/auth'

interface SettingsFormProps {
  initialName: string
  showDeleteOnly?: boolean
}

const INPUT_CLASSES =
  'block h-10 w-full rounded-[var(--radius-md)] border border-border-light bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:border-accent-deep focus:ring-2 focus:ring-accent/30'

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

  // Render : delete-only mode
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
            <VzBtn
              variant="destructive"
              size="md"
              onClick={() => setShowConfirm(true)}
              className="shrink-0"
            >
              {t('deleteAccountCta')}
            </VzBtn>
          )}
        </div>
        {showConfirm && (
          <div className="mt-5 rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5 p-4">
            <p className="mb-3 text-sm font-medium text-destructive">
              {t('deleteConfirm')}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-destructive px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-destructive/90 disabled:opacity-50"
              >
                {isDeleting ? t('deleting') : t('deleteConfirmBtn')}
              </button>
              <VzBtn
                variant="secondary"
                size="md"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
              >
                {t('cancel')}
              </VzBtn>
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

  // Render : name form
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
          className={`${INPUT_CLASSES} min-w-0 flex-1`}
        />
        <VzBtn
          type="submit"
          variant="primary"
          size="md"
          disabled={isPending || name.trim() === initialName}
          className="min-w-[140px]"
        >
          {isPending ? t('saving') : t('save')}
        </VzBtn>
      </div>
      {nameError && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {nameError}
        </p>
      )}
      {nameSuccess && (
        <p className="mt-2 text-sm text-[var(--color-success-fg)]" role="status">
          {t('nameSuccess')}
        </p>
      )}
    </form>
  )
}
