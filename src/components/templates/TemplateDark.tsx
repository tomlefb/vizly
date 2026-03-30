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
  ChevronRight,
} from 'lucide-react'

const SOCIAL_ICONS: Record<
  string,
  { icon: LucideIcon; label: string }
> = {
  github: { icon: Code2, label: 'GitHub' },
  linkedin: { icon: Link2, label: 'LinkedIn' },
  instagram: { icon: Camera, label: 'Instagram' },
  twitter: { icon: AtSign, label: 'Twitter' },
  dribbble: { icon: Pen, label: 'Dribbble' },
  website: { icon: Globe, label: 'Website' },
}

export function TemplateDark({ portfolio, projects, isPremium }: TemplateProps) {
  const {
    title,
    bio,
    photo_url,
    primary_color,
    secondary_color,
    social_links,
    contact_email,
  } = portfolio

  const sortedProjects = [...projects].sort((a, b) => a.display_order - b.display_order)

  // Glow shadow from primary color
  const glowSm = `0 0 12px ${primary_color}40`
  const glowMd = `0 0 20px ${primary_color}50, 0 0 40px ${primary_color}20`
  const glowBorder = `0 0 0 1px ${primary_color}30`

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          backgroundColor: '#0A0A0F',
          color: '#C8C8D0',
          minHeight: '100vh',
        }}
      >
        {/* Subtle grid background pattern */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundImage: `
              linear-gradient(${primary_color}06 1px, transparent 1px),
              linear-gradient(90deg, ${primary_color}06 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <header className="px-6 pt-16 pb-10 md:px-10 md:pt-28 md:pb-14">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
                {/* Photo with glow */}
                {photo_url ? (
                  <div
                    className="shrink-0 self-center md:self-start"
                    style={{
                      width: 110,
                      height: 110,
                      borderRadius: 14,
                      overflow: 'hidden',
                      border: `2px solid ${primary_color}60`,
                      boxShadow: glowMd,
                    }}
                  >
                    <Image
                      src={photo_url}
                      alt={`Photo de ${title}`}
                      width={110}
                      height={110}
                      className="object-cover"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                ) : null}

                {/* Info block */}
                <div className="text-center md:text-left">
                  {/* Terminal-style prompt */}
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.8rem',
                      color: primary_color,
                      marginBottom: 8,
                      letterSpacing: '0.04em',
                    }}
                  >
                    <span style={{ opacity: 0.5 }}>~/</span>portfolio
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 16,
                        backgroundColor: primary_color,
                        marginLeft: 4,
                        verticalAlign: 'middle',
                        opacity: 0.7,
                      }}
                    />
                  </div>

                  <h1
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)',
                      lineHeight: 1.1,
                      color: '#F0F0F5',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {title}
                  </h1>

                  {bio ? (
                    <p
                      className="mt-4 max-w-lg"
                      style={{
                        fontSize: '1rem',
                        lineHeight: 1.7,
                        color: '#8888A0',
                      }}
                    >
                      {bio}
                    </p>
                  ) : null}

                  {/* Social links in terminal style */}
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
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
                                gap: 6,
                                padding: '6px 12px',
                                borderRadius: 6,
                                backgroundColor: `${primary_color}10`,
                                border: `1px solid ${primary_color}20`,
                                color: primary_color,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.75rem',
                                textDecoration: 'none',
                                transition: 'all 200ms ease-out',
                              }}
                            >
                              <IconComponent size={14} />
                              <span>{config.label}</span>
                            </a>
                          )
                        })
                      : null}
                    {contact_email ? (
                      <a
                        href={`mailto:${contact_email}`}
                        aria-label="Envoyer un email"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 6,
                          backgroundColor: `${primary_color}10`,
                          border: `1px solid ${primary_color}20`,
                          color: primary_color,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '0.75rem',
                          textDecoration: 'none',
                          transition: 'all 200ms ease-out',
                        }}
                      >
                        <Mail size={14} />
                        <span>Email</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Separator */}
          <div className="mx-auto max-w-4xl px-6 md:px-10">
            <div
              style={{
                height: 1,
                background: `linear-gradient(90deg, transparent, ${primary_color}30, transparent)`,
              }}
            />
          </div>

          {/* Projects */}
          <main className="px-6 py-12 md:px-10 md:py-16">
            <div className="mx-auto max-w-4xl">
              <h2
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  color: primary_color,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
                className="mb-10"
              >
                <span style={{ opacity: 0.4 }}>{'> '}</span>
                projets
              </h2>

              {sortedProjects.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {sortedProjects.map((project, index) => (
                    <article
                      key={project.id}
                      className="group overflow-hidden transition-all duration-300"
                      style={{
                        backgroundColor: '#12121A',
                        borderRadius: 10,
                        border: `1px solid ${primary_color}15`,
                        boxShadow: glowBorder,
                        transition: 'box-shadow 300ms ease-out, border-color 300ms ease-out',
                      }}
                    >
                      {/* Project image */}
                      {project.images[0] ? (
                        <div
                          className="relative overflow-hidden"
                          style={{ aspectRatio: '16/9' }}
                        >
                          <Image
                            src={project.images[0]}
                            alt={project.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                          {/* Overlay gradient */}
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: `linear-gradient(to top, #12121A, transparent 60%)`,
                            }}
                          />
                          {/* Index number */}
                          <span
                            style={{
                              position: 'absolute',
                              top: 12,
                              right: 14,
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '0.7rem',
                              color: `${primary_color}80`,
                              letterSpacing: '0.05em',
                            }}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            aspectRatio: '16/9',
                            backgroundColor: '#16161F',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '3rem',
                              fontWeight: 700,
                              color: `${primary_color}15`,
                            }}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 600,
                              fontSize: '1rem',
                              color: '#E8E8F0',
                              letterSpacing: '-0.01em',
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
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                fontSize: '0.75rem',
                                fontFamily: "'JetBrains Mono', monospace",
                                textDecoration: 'none',
                                flexShrink: 0,
                              }}
                            >
                              <span>voir</span>
                              <ChevronRight size={14} />
                            </a>
                          ) : null}
                        </div>

                        {project.description ? (
                          <p
                            className="mt-2.5"
                            style={{
                              fontSize: '0.88rem',
                              lineHeight: 1.6,
                              color: '#6E6E85',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {project.description}
                          </p>
                        ) : null}

                        {/* Tags */}
                        {project.tags.length > 0 ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {project.tags.map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: '0.7rem',
                                  fontWeight: 500,
                                  color: primary_color,
                                  backgroundColor: `${primary_color}10`,
                                  padding: '3px 9px',
                                  borderRadius: 4,
                                  border: `1px solid ${primary_color}15`,
                                  letterSpacing: '0.02em',
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.85rem',
                    color: '#555568',
                  }}
                >
                  <span style={{ color: primary_color }}>{'> '}</span>
                  Aucun projet pour le moment...
                </p>
              )}
            </div>
          </main>

          {/* Footer */}
          <footer className="px-6 py-8 md:px-10">
            <div className="mx-auto max-w-4xl">
              <div
                style={{
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${primary_color}20, transparent)`,
                  marginBottom: 24,
                }}
              />
              <div className="flex items-center justify-between">
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.7rem',
                    color: '#444458',
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
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.7rem',
                      color: '#444458',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    built with{' '}
                    <span style={{ color: primary_color, fontWeight: 600 }}>
                      vizly
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
