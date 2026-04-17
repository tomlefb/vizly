'use client'

import { useEffect, useState } from 'react'
import {
  User,
  Globe,
  Link2,
  Code2,
  Pen,
  Image,
  AtSign,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PortfolioFormData, ProjectFormData } from '@/lib/validations'

const SOCIAL_ICONS_MAP: Record<string, React.ElementType> = {
  linkedin: Link2,
  github: Code2,
  dribbble: Pen,
  instagram: Image,
  twitter: AtSign,
  website: Globe,
}

interface LivePreviewProps {
  data: PortfolioFormData
  projects: ProjectFormData[]
  className?: string
}

function hasContent(data: PortfolioFormData, projects: ProjectFormData[]): boolean {
  return !!(data.title || data.bio || data.photo_url || projects.length > 0)
}

/** Load a Google Font dynamically by injecting a <link> into <head> */
function useGoogleFont(fontName: string) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!fontName) return

    const family = fontName.replace(/ /g, '+')
    const id = `gfont-preview-${family}`

    // Already loaded
    if (document.getElementById(id)) {
      setLoaded(true)
      return
    }

    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${family}:wght@400;600;700&display=swap`
    link.onload = () => setLoaded(true)
    document.head.appendChild(link)

    return () => {
      // Cleanup on font change
      const el = document.getElementById(id)
      if (el) el.remove()
      setLoaded(false)
    }
  }, [fontName])

  return loaded
}

export function LivePreview({
  data,
  projects,
  className,
}: LivePreviewProps) {
  const showContent = hasContent(data, projects)
  useGoogleFont(data.font)

  const socialEntries = Object.entries(data.social_links ?? {}).filter(
    ([, url]) => typeof url === 'string' && url.trim() !== ''
  )

  return (
    <div
      className={cn(
        'flex flex-col rounded-[var(--radius-lg)] border border-border-light overflow-hidden bg-surface h-full',
        className
      )}
      data-testid="live-preview"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border-light bg-surface-warm px-3 py-2 shrink-0">
        <div className="flex gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <div className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="rounded-[3px] bg-surface border border-border-light px-3 py-0.5 text-[10px] text-muted-foreground font-mono">
            pseudo.vizly.fr
          </div>
        </div>
        <span className="text-[9px] text-muted-foreground/60 font-medium capitalize shrink-0">
          {data.template}
        </span>
      </div>

      {/* Preview content */}
      <div
        className="flex-1 overflow-y-auto p-5"
        style={{
          fontFamily: `"${data.font}", system-ui, sans-serif`,
        }}
      >
        {!showContent ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-surface-warm mb-4">
              <User className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-muted-foreground/60 max-w-[220px] leading-relaxed">
              Commence a remplir le formulaire pour voir ton portfolio ici
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              {data.photo_url ? (
                <div className="h-12 w-12 shrink-0 rounded-[var(--radius-md)] overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.photo_url}
                    alt="Photo de profil"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-[var(--radius-md)] bg-surface-warm border border-border-light flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground/30" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3
                  className="text-base font-bold leading-tight truncate"
                  style={{ color: data.primary_color }}
                >
                  {data.title || 'Ton nom'}
                </h3>
                {data.contact_email && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {data.contact_email}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            {data.bio && (
              <p
                className="text-xs leading-relaxed line-clamp-4"
                style={{ color: data.secondary_color }}
              >
                {data.bio}
              </p>
            )}

            {/* Social links */}
            {socialEntries.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {socialEntries.map(([platform]) => {
                  const Icon = SOCIAL_ICONS_MAP[platform] ?? Globe
                  return (
                    <div
                      key={platform}
                      className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-border-light"
                    >
                      <Icon className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )
                })}
              </div>
            )}

            {/* Divider */}
            {projects.length > 0 && (
              <div className="h-px bg-border-light" />
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Projets
                </p>
                <div className="grid gap-2">
                  {projects.map((project, i) => (
                    <div
                      key={i}
                      className="rounded-[var(--radius-sm)] border border-border-light p-2.5 bg-surface-warm/50"
                    >
                      <div className="flex items-start gap-2.5">
                        {project.images.length > 0 ? (
                          <div className="h-8 w-8 shrink-0 rounded-[3px] overflow-hidden bg-surface-warm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={project.images[0]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-8 w-8 shrink-0 rounded-[3px] bg-surface-warm border border-border-light" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {project.title || 'Sans titre'}
                          </p>
                          {project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-1">
                              {project.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-block rounded-[2px] px-1 py-0 text-[8px] font-medium"
                                  style={{
                                    backgroundColor: `${data.primary_color}12`,
                                    color: data.primary_color,
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {project.external_link && (
                          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/40 mt-0.5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
