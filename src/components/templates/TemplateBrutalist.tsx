import Image from 'next/image'
import type { TemplateProps } from '@/types'
import type { LucideIcon } from 'lucide-react'
import {
  Code2,
  Link2,
  Camera,
  AtSign,
  Globe,
  Pen,
  Mail,
  ExternalLink,
} from 'lucide-react'

const SOCIAL_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  github: { icon: Code2, label: 'GitHub' },
  linkedin: { icon: Link2, label: 'LinkedIn' },
  instagram: { icon: Camera, label: 'Instagram' },
  twitter: { icon: AtSign, label: 'Twitter' },
  dribbble: { icon: Pen, label: 'Dribbble' },
  website: { icon: Globe, label: 'Site web' },
}

/**
 * Determine whether to use white or black text on a given hex background.
 * Returns "#FFFFFF" or "#000000".
 */
function contrastText(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  // Relative luminance formula (sRGB)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#000000' : '#FFFFFF'
}

export function TemplateBrutalist({
  portfolio,
  projects,
  isPremium,
}: TemplateProps) {
  const {
    title,
    bio,
    photo_url,
    primary_color,
    secondary_color,
    social_links,
    contact_email,
  } = portfolio

  const sortedProjects = [...projects].sort(
    (a, b) => a.display_order - b.display_order
  )

  // Determine if dark mode: secondary color luminance check
  const secClean = secondary_color.replace('#', '')
  const secR = parseInt(secClean.substring(0, 2), 16)
  const secG = parseInt(secClean.substring(2, 4), 16)
  const secB = parseInt(secClean.substring(4, 6), 16)
  const secLum = (0.299 * secR + 0.587 * secG + 0.114 * secB) / 255
  const isDark = secLum < 0.4

  const bgColor = isDark ? '#0D0D0D' : '#FAFAFA'
  const textColor = isDark ? '#F5F5F5' : '#0D0D0D'
  const mutedColor = isDark ? '#777777' : '#888888'
  const borderColor = isDark ? '#333333' : '#0D0D0D'
  const surfaceColor = isDark ? '#161616' : '#FFFFFF'

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Roboto+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          fontFamily: "'Roboto Mono', monospace",
          backgroundColor: bgColor,
          color: textColor,
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background watermark */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-8deg)',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(10rem, 25vw, 22rem)',
            fontWeight: 400,
            color: isDark ? '#1A1A1A' : '#F0F0F0',
            letterSpacing: '0.05em',
            pointerEvents: 'none',
            zIndex: 0,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          WORK
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <header className="px-5 pt-10 pb-8 md:px-10 md:pt-16 md:pb-12">
            <div className="mx-auto max-w-5xl">
              {/* Top bar: email + social */}
              <div
                className="mb-10 flex flex-wrap items-center justify-between gap-4"
                style={{
                  paddingBottom: 12,
                  borderBottom: `3px solid ${borderColor}`,
                }}
              >
                <div className="flex flex-wrap items-center gap-4">
                  {social_links
                    ? Object.entries(social_links).map(([platform, url]) => {
                        if (!url) return null
                        const config = SOCIAL_ICONS[platform]
                        if (!config) return null
                        const IconComponent = config.icon
                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Profil ${config.label}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              color: mutedColor,
                              fontSize: '0.72rem',
                              fontWeight: 500,
                              textDecoration: 'none',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}
                          >
                            <IconComponent size={13} />
                            <span>{config.label}</span>
                          </a>
                        )
                      })
                    : null}
                </div>
                {contact_email ? (
                  <a
                    href={`mailto:${contact_email}`}
                    aria-label="Envoyer un email"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      color: primary_color,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    <Mail size={13} />
                    <span>{contact_email}</span>
                  </a>
                ) : null}
              </div>

              {/* Name + photo layout */}
              <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-12">
                {/* Name -- ENORMOUS */}
                <div className="md:col-span-8">
                  <h1
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontWeight: 400,
                      fontSize: 'clamp(4rem, 12vw, 9rem)',
                      lineHeight: 0.85,
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      color: textColor,
                    }}
                  >
                    {title}
                  </h1>
                  {bio ? (
                    <p
                      className="mt-6 max-w-md"
                      style={{
                        fontSize: '0.82rem',
                        lineHeight: 1.7,
                        color: mutedColor,
                        fontWeight: 400,
                      }}
                    >
                      {bio}
                    </p>
                  ) : null}
                </div>

                {/* Photo -- square, brutalist border */}
                {photo_url ? (
                  <div className="md:col-span-4">
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 220,
                        aspectRatio: '1',
                        overflow: 'hidden',
                        border: `3px solid ${primary_color}`,
                        marginLeft: 'auto',
                      }}
                    >
                      <Image
                        src={photo_url}
                        alt={`Photo de ${title}`}
                        width={220}
                        height={220}
                        className="object-cover"
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          {/* Thick divider */}
          <div className="mx-auto max-w-5xl px-5 md:px-10">
            <div style={{ height: 4, backgroundColor: borderColor }} />
          </div>

          {/* Projects */}
          <main className="px-5 py-12 md:px-10 md:py-16">
            <div className="mx-auto max-w-5xl">
              <h2
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: textColor,
                  marginBottom: 40,
                  lineHeight: 1,
                }}
              >
                Projects
              </h2>

              {sortedProjects.length > 0 ? (
                <div className="flex flex-col">
                  {sortedProjects.map((project, index) => (
                    <article
                      key={project.id}
                      style={{
                        borderTop: `2px solid ${borderColor}`,
                        paddingTop: 28,
                        paddingBottom: 28,
                      }}
                    >
                      {/* Project header: number + title + link */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-start md:gap-6">
                        {/* Number -- oversized */}
                        <div className="md:col-span-2">
                          <span
                            style={{
                              fontFamily: "'Bebas Neue', sans-serif",
                              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                              lineHeight: 0.9,
                              color: primary_color,
                              letterSpacing: '0.02em',
                            }}
                          >
                            {String(index + 1).padStart(2, '0')}.
                          </span>
                        </div>

                        {/* Content */}
                        <div className="md:col-span-6">
                          <div className="flex items-start gap-3">
                            <h3
                              style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                                lineHeight: 1.05,
                                color: textColor,
                              }}
                            >
                              {project.title}
                            </h3>
                            {project.external_link ? (
                              <a
                                href={project.external_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Voir le projet ${project.title}`}
                                style={{
                                  color: primary_color,
                                  flexShrink: 0,
                                  marginTop: 4,
                                }}
                              >
                                <ExternalLink size={18} />
                              </a>
                            ) : null}
                          </div>

                          {project.description ? (
                            <p
                              className="mt-3"
                              style={{
                                fontSize: '0.8rem',
                                lineHeight: 1.65,
                                color: mutedColor,
                              }}
                            >
                              {project.description}
                            </p>
                          ) : null}

                          {/* Tags -- bracket style */}
                          {project.tags.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {project.tags.map((tag) => (
                                <span
                                  key={tag}
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    color: primary_color,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                  }}
                                >
                                  [{tag}]
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        {/* Image */}
                        <div className="md:col-span-4">
                          {project.images[0] ? (
                            <div
                              style={{
                                position: 'relative',
                                aspectRatio: '4/3',
                                overflow: 'hidden',
                                border: `2px solid ${borderColor}`,
                              }}
                            >
                              <Image
                                src={project.images[0]}
                                alt={project.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                aspectRatio: '4/3',
                                backgroundColor: surfaceColor,
                                border: `2px solid ${borderColor}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "'Bebas Neue', sans-serif",
                                  fontSize: '4rem',
                                  color: `${primary_color}30`,
                                }}
                              >
                                {String(index + 1).padStart(2, '0')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}

                  {/* Bottom border */}
                  <div style={{ borderTop: `2px solid ${borderColor}` }} />
                </div>
              ) : (
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: mutedColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  [ Aucun projet pour le moment ]
                </p>
              )}
            </div>
          </main>

          {/* Footer */}
          <footer className="px-5 py-8 md:px-10">
            <div className="mx-auto max-w-5xl">
              <div
                style={{
                  height: 4,
                  backgroundColor: borderColor,
                  marginBottom: 20,
                }}
              />
              <div className="flex items-center justify-between">
                <p
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '1rem',
                    letterSpacing: '0.08em',
                    color: mutedColor,
                  }}
                >
                  {new Date().getFullYear()}
                </p>
                {!isPremium ? (
                  <a
                    href="https://vizly.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: mutedColor,
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Fait avec{' '}
                    <span
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '0.85rem',
                        color: primary_color,
                        letterSpacing: '0.04em',
                      }}
                    >
                      VIZLY
                    </span>
                  </a>
                ) : null}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
