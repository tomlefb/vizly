'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { upsertPortfolio } from '@/actions/portfolio'
import type { PortfolioFormData } from '@/lib/validations'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseEditorAutoSaveOptions {
  portfolioData: PortfolioFormData
  setPortfolioData: Dispatch<SetStateAction<PortfolioFormData>>
  setPortfolioId: Dispatch<SetStateAction<string | null>>
  uploadImage: (file: File) => Promise<{ url: string | null; error: string | null }>
  pendingPhotoFileRef: MutableRefObject<File | null>
  setSaveStatus: Dispatch<SetStateAction<SaveStatus>>
  setSaveError: Dispatch<SetStateAction<string | null>>
}

export function useEditorAutoSave({
  portfolioData,
  setPortfolioData,
  setPortfolioId,
  uploadImage,
  pendingPhotoFileRef,
  setSaveStatus,
  setSaveError,
}: UseEditorAutoSaveOptions) {
  const isInitialMountRef = useRef(true)
  const debouncedPortfolio = useDebounce(portfolioData, 1500)

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

      const result = await upsertPortfolio(debouncedPortfolio)

      if (cancelled) return

      if (result.error) {
        setSaveStatus('error')
        setSaveError(result.error)
      } else {
        setSaveStatus('saved')
        setSaveError(null)
        if (result.data) {
          setPortfolioId(result.data.id)
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
    const result = await upsertPortfolio(portfolioData)
    if (result.error) {
      setSaveStatus('error')
      setSaveError(result.error)
    } else {
      setSaveStatus('saved')
      if (result.data) setPortfolioId(result.data.id)
    }
  }, [portfolioData, setSaveStatus, setSaveError, setPortfolioId])

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
