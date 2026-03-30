'use client'

import { useState, useCallback } from 'react'

interface UploadResult {
  url: string | null
  error: string | null
}

interface UseImageUploadReturn {
  uploadImage: (file: File) => Promise<UploadResult>
  isUploading: boolean
}

/**
 * Hook pour l'upload d'images vers /api/upload.
 * Envoie le fichier en FormData et retourne l'URL publique Supabase.
 */
export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false)

  const uploadImage = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = (await response.json()) as { url?: string; error?: string }

      if (!response.ok || result.error) {
        return {
          url: null,
          error: result.error ?? 'Erreur lors de l\'upload',
        }
      }

      return {
        url: result.url ?? null,
        error: result.url ? null : 'URL manquante dans la reponse',
      }
    } catch {
      return {
        url: null,
        error: 'Erreur reseau lors de l\'upload',
      }
    } finally {
      setIsUploading(false)
    }
  }, [])

  return { uploadImage, isUploading }
}
