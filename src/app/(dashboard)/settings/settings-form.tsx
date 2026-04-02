'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile, deleteAccount } from '@/actions/auth'

interface SettingsFormProps {
  initialName: string
  showDeleteOnly?: boolean
}

export function SettingsForm({ initialName, showDeleteOnly }: SettingsFormProps) {
  const router = useRouter()

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
        // Redirect to home after account deletion
        router.push('/')
        router.refresh()
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Render: delete-only mode (for danger zone section)
  // ---------------------------------------------------------------------------
  if (showDeleteOnly) {
    return (
      <div>
        {!showConfirm ? (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="inline-flex items-center rounded-[var(--radius-md)] border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors duration-150 hover:bg-red-50"
          >
            Supprimer mon compte
          </button>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-red-300 bg-white p-4">
            <p className="text-sm font-medium text-red-700 mb-3">
              Es-tu certain de vouloir supprimer ton compte ? Cette action est irreversible.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center rounded-[var(--radius-md)] bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Oui, supprimer definitivement'}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface-warm disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
            {deleteError && (
              <p className="mt-3 text-sm text-red-600" role="alert">
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
      <label htmlFor="settings-name" className="block text-sm font-medium text-foreground mb-1.5">
        Nom
      </label>
      <div className="flex gap-3">
        <input
          id="settings-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setNameError(null)
            setNameSuccess(false)
          }}
          placeholder="Ton nom complet"
          maxLength={100}
          className="flex-1 h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-[border-color] duration-150 focus:outline-none focus:border-[#D1D5DB] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
        />
        <button
          type="submit"
          disabled={isPending || name.trim() === initialName}
          className="inline-flex items-center h-10 rounded-lg bg-[#E8553D] px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#D4442E] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
      {nameError && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {nameError}
        </p>
      )}
      {nameSuccess && (
        <p className="mt-2 text-sm text-green-600" role="status">
          Nom mis a jour avec succes.
        </p>
      )}
    </form>
  )
}
