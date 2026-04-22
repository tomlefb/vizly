'use client'

import { useState, type ReactNode } from 'react'
import { ProjectModal } from './ProjectModal'

interface ClickableProjectProps {
  project: {
    title: string
    description: string | null
    images: string[]
    external_link: string | null
    tags: string[]
  }
  primaryColor: string
  dark?: boolean
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function ClickableProject({
  project,
  primaryColor,
  dark = false,
  children,
  className,
  style,
}: ClickableProjectProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(true)
          }
        }}
        className={className}
        style={{ ...style, cursor: 'pointer' }}
        aria-label={`Voir le détail du projet ${project.title}`}
      >
        {children}
      </div>

      {isOpen && (
        <ProjectModal
          project={project}
          primaryColor={primaryColor}
          dark={dark}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
