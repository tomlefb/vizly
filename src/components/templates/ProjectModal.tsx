'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { safeUrlOrEmpty } from '@/lib/sanitize'

interface ProjectModalProps {
  project: {
    title: string
    description: string | null
    images: string[]
    external_link: string | null
    tags: string[]
  }
  primaryColor: string
  onClose: () => void
  /** Dark mode for templates with dark backgrounds */
  dark?: boolean
}

export function ProjectModal({ project, primaryColor, onClose, dark = false }: ProjectModalProps) {
  const [currentImage, setCurrentImage] = useState(0)
  const hasImages = project.images.length > 0
  const hasMultipleImages = project.images.length > 1

  const nextImage = useCallback(() => {
    setCurrentImage((prev) => (prev + 1) % project.images.length)
  }, [project.images.length])

  const prevImage = useCallback(() => {
    setCurrentImage((prev) => (prev - 1 + project.images.length) % project.images.length)
  }, [project.images.length])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && hasMultipleImages) nextImage()
      if (e.key === 'ArrowLeft' && hasMultipleImages) prevImage()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, nextImage, prevImage, hasMultipleImages])

  // Touch swipe support — seuil 40px pour distinguer swipe d'un tap accidentel.
  const touchStartX = useRef<number | null>(null)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }, [])
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || !hasMultipleImages) return
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current
    const delta = endX - touchStartX.current
    if (delta <= -40) nextImage()
    else if (delta >= 40) prevImage()
    touchStartX.current = null
  }, [nextImage, prevImage, hasMultipleImages])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const bg = dark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.6)'
  const cardBg = dark ? '#1A1A1A' : '#FFFFFF'
  const textColor = dark ? '#E8E8E8' : '#1A1A1A'
  const mutedColor = dark ? '#999999' : '#6B6B6B'
  const borderColor = dark ? '#333333' : '#EBEBEB'

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      <div
        style={{
          backgroundColor: cardBg,
          borderRadius: 16,
          maxWidth: 720,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${borderColor}`,
        }}
      >
        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              border: `1px solid ${borderColor}`, backgroundColor: 'transparent',
              color: mutedColor, cursor: 'pointer',
            }}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Image carousel */}
        {hasImages && (
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ position: 'relative', width: '100%', aspectRatio: '16/10', backgroundColor: dark ? '#111' : '#F5F5F5' }}
          >
            <Image
              src={project.images[currentImage] ?? ''}
              alt={`${project.title} — image ${currentImage + 1}`}
              fill
              className="object-contain"
              sizes="720px"
            />

            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  style={{
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    width: 36, height: 36, borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', cursor: 'pointer',
                  }}
                  aria-label="Image précédente"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    width: 36, height: 36, borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', cursor: 'pointer',
                  }}
                  aria-label="Image suivante"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Dots */}
                <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                  {project.images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentImage(i)}
                      style={{
                        width: i === currentImage ? 20 : 8, height: 8,
                        borderRadius: 4,
                        backgroundColor: i === currentImage ? primaryColor : 'rgba(255,255,255,0.5)',
                        border: 'none', cursor: 'pointer',
                        transition: 'all 200ms ease',
                      }}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '20px 24px 24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: textColor, margin: 0 }}>
              {project.title}
            </h2>
            {project.external_link && safeUrlOrEmpty(project.external_link) && (
              <a
                href={safeUrlOrEmpty(project.external_link)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8,
                  backgroundColor: primaryColor, color: '#FFF',
                  fontSize: '0.8rem', fontWeight: 600,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
                Voir le projet
                <ExternalLink size={14} />
              </a>
            )}
          </div>

          {project.description && (
            <p style={{ marginTop: 12, fontSize: '0.95rem', lineHeight: 1.7, color: mutedColor }}>
              {project.description}
            </p>
          )}

          {project.tags.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '0.78rem', fontWeight: 500,
                    color: primaryColor, backgroundColor: `${primaryColor}12`,
                    padding: '4px 12px', borderRadius: 6,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
