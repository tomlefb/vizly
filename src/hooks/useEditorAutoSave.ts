'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { upsertPortfolio } from '@/actions/portfolio'
import type { PortfolioFormData } from '@/lib/validations'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseEditorAutoSaveOptions {
  portfolioData: PortfolioFormData
  setPortfolioData: Dispatch<SetStateAction<PortfolioFormData>>
  portfolioId: string | null
  setPortfolioId: Dispatch<SetStateAction<string | null>>
  uploadImage: (file: File) => Promise<{ url: string | null; error: string | null }>
  pendingPhotoFileRef: MutableRefObject<File | null>
  setSaveStatus: Dispatch<SetStateAction<SaveStatus>>
  setSaveError: Dispatch<SetStateAction<string | null>>
}

export function useEditorAutoSave({
  portfolioData,
  setPortfolioData,
  portfolioId,
  setPortfolioId,
  uploadImage,
  pendingPhotoFileRef,
  setSaveStatus,
  setSaveError,
}: UseEditorAutoSaveOptions) {
  const router = useRouter()
  const isInitialMountRef = useRef(true)
  const debouncedPortfolio = useDebounce(portfolioData, 1500)
  // Ref pour lire le portfolioId courant depuis l'effect sans retrigger
  // l'auto-save à chaque changement d'id (sinon boucle après le 1er INSERT).
  const portfolioIdRef = useRef(portfolioId)
  useEffect(() => {
    portfolioIdRef.current = portfolioId
  }, [portfolioId])

  // Auto-save on debounced portfolio changes
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      return
    }

    if (!debouncedPortfolio.title.trim()) return

    let cancelled = false

    async function save() {
      setSaveStatus('saving')
      setSaveError(null)

      if (pendingPhotoFileRef.current) {
        const file = pendingPhotoFileRef.current
        pendingPhotoFileRef.current = null

        const uploadResult = await uploadImage(file)
        if (uploadResult.url) {
          debouncedPortfolio.photo_url = uploadResult.url
          if (!cancelled) {
            setPortfolioData((prev) => ({
              ...prev,
              photo_url: uploadResult.url ?? prev.photo_url,
            }))
          }
        } else if (uploadResult.error) {
          if (!cancelled) {
            setSaveStatus('error')
            setSaveError(uploadResult.error)
          }
          return
        }
      }

      const currentId = portfolioIdRef.current
      const result = await upsertPortfolio(debouncedPortfolio, currentId ?? undefined)

      if (cancelled) return

      if (result.error) {
        setSaveStatus('error')
        setSaveError(result.error)
      } else {
        setSaveStatus('saved')
        setSaveError(null)
        if (result.data) {
          // Au premier INSERT (currentId null), on met l'id en URL pour
          // que F5 recharge ce portfolio précis — sinon l'editor se
          // retrouverait sans id et créerait un 2ᵉ portfolio.
          if (!currentId) {
            setPortfolioId(result.data.id)
            router.replace(`/editor?id=${result.data.id}`)
          }
        }
      }
    }

    void save()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPortfolio])

  // Manual save (Ctrl+S / Cmd+S)
  const manualSave = useCallback(async () => {
    if (!portfolioData.title.trim()) return
    setSaveStatus('saving')
    setSaveError(null)
    const currentId = portfolioIdRef.current
    const result = await upsertPortfolio(portfolioData, currentId ?? undefined)
    if (result.error) {
      setSaveStatus('error')
      setSaveError(result.error)
    } else {
      setSaveStatus('saved')
      if (result.data && !currentId) {
        setPortfolioId(result.data.id)
        router.replace(`/editor?id=${result.data.id}`)
      }
    }
  }, [portfolioData, setSaveStatus, setSaveError, setPortfolioId, router])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        void manualSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [manualSave])
}
