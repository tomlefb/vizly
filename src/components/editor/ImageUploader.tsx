'use client'

import { useState, useCallback, useRef, useId } from 'react'
import { Upload, X, ImageIcon, GripVertical, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAX_IMAGES_PER_PROJECT } from '@/lib/constants'

interface ImageUploaderProps {
  images: File[]
  existingUrls?: string[]
  isUploading?: boolean
  onImagesChange: (files: File[]) => void
  onImageRemove: (index: number) => void
  className?: string
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function ImageUploader({
  images,
  existingUrls = [],
  isUploading = false,
  onImagesChange,
  onImageRemove,
  className,
}: ImageUploaderProps) {
  const id = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null)

  const totalImages = existingUrls.length + images.length
  const canAddMore = totalImages < MAX_IMAGES_PER_PROJECT
  const remaining = MAX_IMAGES_PER_PROJECT - totalImages

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return
      const validFiles: File[] = []
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        if (file && ACCEPTED_TYPES.includes(file.type) && validFiles.length + totalImages < MAX_IMAGES_PER_PROJECT) {
          validFiles.push(file)
        }
      }
      if (validFiles.length > 0) {
        onImagesChange([...images, ...validFiles])
      }
    },
    [images, onImagesChange, totalImages]
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleReorderDragStart = useCallback(
    (index: number) => {
      setDragStartIndex(index)
    },
    []
  )

  const handleReorderDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      setDragOverIndex(index)
    },
    []
  )

  const handleReorderDrop = useCallback(
    (targetIndex: number) => {
      if (dragStartIndex === null || dragStartIndex === targetIndex) {
        setDragStartIndex(null)
        setDragOverIndex(null)
        return
      }
      const reordered = [...images]
      const [moved] = reordered.splice(dragStartIndex, 1)
      if (moved) {
        reordered.splice(targetIndex, 0, moved)
        onImagesChange(reordered)
      }
      setDragStartIndex(null)
      setDragOverIndex(null)
    },
    [dragStartIndex, images, onImagesChange]
  )

  return (
    <div className={cn('space-y-3', className)} data-testid="image-uploader">
      {/* Drop zone */}
      {canAddMore && (
        <div
          data-testid="image-drop-zone"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              fileInputRef.current?.click()
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Ajouter des images. ${remaining} emplacement${remaining > 1 ? 's' : ''} disponible${remaining > 1 ? 's' : ''}`}
          className={cn(
            'relative flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed px-6 py-8 cursor-pointer transition-all duration-200',
            isDragging
              ? 'border-accent bg-accent-light/40 scale-[1.01]'
              : 'border-border hover:border-accent/50 hover:bg-surface-warm'
          )}
        >
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] transition-colors duration-200',
              isDragging ? 'bg-accent/10' : 'bg-surface-warm'
            )}
          >
            <Upload
              className={cn(
                'h-5 w-5 transition-colors duration-200',
                isDragging ? 'text-accent' : 'text-muted-foreground'
              )}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {isDragging ? 'Depose tes images ici' : 'Glisse tes images ou clique'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, WebP ou GIF
            </p>
          </div>
          <input
            ref={fileInputRef}
            id={`${id}-file`}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      )}

      {/* Counter */}
      <p className="text-xs text-muted-foreground text-right">
        {totalImages}/{MAX_IMAGES_PER_PROJECT} images
      </p>

      {/* Image previews */}
      {totalImages > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {/* Existing URLs */}
          {existingUrls.map((url, index) => (
            <div
              key={`existing-${index}`}
              className="group relative aspect-square rounded-[var(--radius-sm)] overflow-hidden border border-border bg-surface-warm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Image existante ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onImageRemove(index)}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-destructive"
                aria-label={`Supprimer l'image ${index + 1}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* New files with local preview */}
          {images.map((file, index) => {
            const previewUrl = URL.createObjectURL(file)
            const globalIndex = existingUrls.length + index
            return (
              <div
                key={`new-${index}`}
                draggable
                onDragStart={() => handleReorderDragStart(index)}
                onDragOver={(e) => handleReorderDragOver(e, index)}
                onDrop={() => handleReorderDrop(index)}
                className={cn(
                  'group relative aspect-square rounded-[var(--radius-sm)] overflow-hidden border bg-surface-warm cursor-grab active:cursor-grabbing transition-all duration-150',
                  dragOverIndex === index
                    ? 'border-accent ring-2 ring-accent/20 scale-105'
                    : 'border-border'
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={`Nouvelle image ${index + 1}: ${file.name}`}
                  className="h-full w-full object-cover"
                  onLoad={() => URL.revokeObjectURL(previewUrl)}
                />
                {/* Upload overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                )}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-150" />
                <button
                  type="button"
                  onClick={() => onImageRemove(globalIndex)}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-destructive"
                  aria-label={`Supprimer l'image ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-70 transition-opacity duration-150">
                  <GripVertical className="h-4 w-4 text-white drop-shadow-md" />
                </div>
              </div>
            )
          })}

          {/* Empty slot placeholder */}
          {canAddMore && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-border hover:border-accent/50 hover:bg-surface-warm transition-colors duration-150"
              aria-label="Ajouter une image"
            >
              <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
