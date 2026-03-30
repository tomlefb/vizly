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
  Sparkles,
  ArrowUpRight,
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
  website: { icon: Globe, label: 'Site web' },
}

/**
 * Lighten a hex color by mixing it with white.
 * amount 0 = original, amount 1 = white
 */
function lightenColor(hex: string, amount: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)

  const lr = Math.round(r + (255 - r) * amount)
  const lg = Math.round(g + (255 - g) * amount)
  const lb = Math.round(b + (255 - b) * amount)

  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`
}

export function TemplateColore({ portfolio, projects, isPremium }: TemplateProps) {
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

  const bgColor = lightenColor(primary_color, 0.93)
  const cardBg = lightenColor(primary_color, 0.96)
  const tagVariants = [
    primary_color,
    secondary_color,
    lightenColor(primary_color, 0.3),
    lightenColor(secondary_color, 0.3),
  ]

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          fontFamily: "'Nunito', sans-serif",
          backgroundColor: bgColor,
          color: '#3D3D3D',
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: 'fixed',
            top: -120,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            backgroundColor: `${primary_color}12`,
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'fixed',
            bottom: -100,
            left: -60,
            width: 260,
            height: 260,
            borderRadius: '50%',
            backgroundColor: `${secondary_color}15`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'fixed',
            top: '40%',
            left: '60%',
            width: 180,
            height: 180,
            borderRadius: '50%',
            backgroundColor: `${primary_color}08`,
            filter: 'blur(40px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <header className="px-6 pt-14 pb-8 md:px-10 md:pt-24 md:pb-12">
            <div className="mx-auto max-w-4xl text-center">
              {/* Photo with accent background */}
              {photo_url ? (
                <div
                  style={{
                    display: 'inline-block',
                    position: 'relative',
                    marginBottom: 20,
                  }}
                >
                  {/* Background shape */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: -8,
                      borderRadius: '50%',
                      backgroundColor: `${primary_color}20`,
                    }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      width: 110,
                      height: 110,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: `4px solid ${primary_color}40`,
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
                </div>
              ) : null}

              {/* Title with sparkle */}
              <div className="flex items-center justify-center gap-2">
                <h1
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 700,
                    fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
                    lineHeight: 1.15,
                    color: '#2A2A2A',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {title}
                </h1>
                <Sparkles
                  size={22}
                  style={{ color: primary_color, flexShrink: 0 }}
                />
              </div>

              {bio ? (
                <p
                  className="mx-auto mt-4 max-w-md"
                  style={{
                    fontSize: '1.05rem',
                    lineHeight: 1.65,
                    color: '#6B6B6B',
                    fontWeight: 500,
                  }}
                >
                  {bio}
                </p>
              ) : null}

              {/* Social pills */}
              <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
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
                            padding: '7px 14px',
                            borderRadius: 50,
                            backgroundColor: '#FFFFFF',
                            border: `2px solid ${primary_color}25`,
                            color: '#4A4A4A',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            textDecoration: 'none',
                            transition: 'transform 200ms ease, box-shadow 200ms ease',
                            boxShadow: `0 2px 8px ${primary_color}10`,
                          }}
                        >
                          <IconComponent size={15} style={{ color: primary_color }} />
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
                      padding: '7px 14px',
                      borderRadius: 50,
                      backgroundColor: primary_color,
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      textDecoration: 'none',
                      transition: 'transform 200ms ease, box-shadow 200ms ease',
                      boxShadow: `0 4px 12px ${primary_color}30`,
                    }}
                  >
                    <Mail size={15} />
                    <span>Contact</span>
                  </a>
                ) : null}
              </div>
            </div>
          </header>

          {/* Projects */}
          <main className="px-6 py-10 md:px-10 md:py-14">
            <div className="mx-auto max-w-5xl">
              <h2
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 600,
                  fontSize: '1.4rem',
                  color: '#2A2A2A',
                  textAlign: 'center',
                  marginBottom: 36,
                }}
              >
                Mes projets{' '}
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: primary_color,
                    marginLeft: 4,
                    verticalAlign: 'middle',
                  }}
                />
              </h2>

              {sortedProjects.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedProjects.map((project, index) => {
                    // Vary card sizes: first and every 4th card spans 2 cols on large screens
                    const isFeature = index === 0 || index % 5 === 0
                    return (
                      <article
                        key={project.id}
                        className={`group overflow-hidden transition-all duration-300 ${
                          isFeature ? 'sm:col-span-2 lg:col-span-2' : ''
                        }`}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 20,
                          border: `2px solid ${primary_color}15`,
                          boxShadow: `0 4px 20px ${primary_color}08`,
                          transition: 'transform 200ms ease, box-shadow 200ms ease',
                        }}
                      >
                        {/* Project image */}
                        {project.images[0] ? (
                          <div
                            className="relative overflow-hidden"
                            style={{
                              aspectRatio: isFeature ? '2/1' : '4/3',
                              borderRadius: '18px 18px 0 0',
                            }}
                          >
                            <Image
                              src={project.images[0]}
                              alt={project.title}
                              fill
                              className="object-cover transition-transform duration-500"
                              sizes={
                                isFeature
                                  ? '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 66vw'
                                  : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                              }
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              aspectRatio: isFeature ? '2/1' : '4/3',
                              backgroundColor: `${primary_color}10`,
                              borderRadius: '18px 18px 0 0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'Fredoka', sans-serif",
                                fontSize: '3rem',
                                fontWeight: 700,
                                color: `${primary_color}25`,
                              }}
                            >
                              {project.title.charAt(0)}
                            </span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-5 md:p-6">
                          <div className="flex items-start justify-between gap-3">
                            <h3
                              style={{
                                fontFamily: "'Fredoka', sans-serif",
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                color: '#2A2A2A',
                                lineHeight: 1.3,
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
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 32,
                                  height: 32,
                                  borderRadius: 10,
                                  backgroundColor: `${primary_color}12`,
                                  color: primary_color,
                                  flexShrink: 0,
                                  transition: 'background-color 200ms ease',
                                }}
                              >
                                <ArrowUpRight size={16} />
                              </a>
                            ) : null}
                          </div>

                          {project.description ? (
                            <p
                              className="mt-2.5"
                              style={{
                                fontSize: '0.88rem',
                                lineHeight: 1.6,
                                color: '#777777',
                                fontWeight: 500,
                                display: '-webkit-box',
                                WebkitLineClamp: isFeature ? 4 : 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {project.description}
                            </p>
                          ) : null}

                          {/* Tags with color variants */}
                          {project.tags.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {project.tags.map((tag, tagIndex) => {
                                const variantColor =
                                  tagVariants[tagIndex % tagVariants.length] ?? primary_color
                                return (
                                  <span
                                    key={tag}
                                    style={{
                                      fontFamily: "'Fredoka', sans-serif",
                                      fontSize: '0.74rem',
                                      fontWeight: 600,
                                      color: variantColor,
                                      backgroundColor: `${variantColor}12`,
                                      padding: '4px 12px',
                                      borderRadius: 50,
                                      letterSpacing: '0.01em',
                                    }}
                                  >
                                    {tag}
                                  </span>
                                )
                              })}
                            </div>
                          ) : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <p
                  className="text-center"
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    color: '#AAAAAA',
                    fontSize: '1rem',
                  }}
                >
                  Aucun projet pour le moment.
                </p>
              )}
            </div>
          </main>

          {/* Footer */}
          <footer className="px-6 py-8">
            <div className="mx-auto max-w-5xl text-center">
              <div
                style={{
                  height: 3,
                  width: 60,
                  backgroundColor: `${primary_color}30`,
                  borderRadius: 10,
                  margin: '0 auto 20px',
                }}
              />
              <div className="flex items-center justify-center gap-3">
                <p
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontSize: '0.82rem',
                    color: '#BBBBBB',
                    fontWeight: 500,
                  }}
                >
                  {new Date().getFullYear()}
                </p>
                {!isPremium ? (
                  <>
                    <span style={{ color: '#DDDDDD' }}>|</span>
                    <a
                      href="https://vizly.fr"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontSize: '0.82rem',
                        color: '#BBBBBB',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      Fait avec{' '}
                      <span style={{ fontWeight: 700, color: primary_color }}>
                        Vizly
                      </span>
                    </a>
                  </>
                ) : null}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
