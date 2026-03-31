import Image from 'next/image'
import type { TemplateProps } from '@/types'
import { DEFAULT_SECTIONS, type SectionBlock } from '@/types/sections'
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

export function TemplateCreatif({
  portfolio,
  projects,
  skills,
  sections,
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
  const visibleSections = [...(sections ?? DEFAULT_SECTIONS)]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)

  // Split name to highlight first letter
  const firstChar = title.charAt(0)
  const restOfTitle = title.slice(1)

  function renderSection(section: SectionBlock) {
    switch (section.id) {
      case 'hero':
        return (
          <header key="hero" className="px-5 pt-12 pb-10 md:px-12 md:pt-20 md:pb-16 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12 md:gap-6">
                {/* Left: name */}
                <div className="md:col-span-7 lg:col-span-8">
                  {/* Name with creative first-letter treatment */}
                  <h1
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 800,
                      fontSize: 'clamp(2.5rem, 7vw, 5rem)',
                      lineHeight: 0.95,
                      letterSpacing: '-0.04em',
                      color: '#1A1A1A',
                    }}
                  >
                    <span
                      style={{
                        color: primary_color,
                        display: 'inline',
                        WebkitTextStroke: `2px ${primary_color}`,
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {firstChar}
                    </span>
                    {restOfTitle}
                  </h1>
                </div>

                {/* Right: photo -- creative crop */}
                {photo_url ? (
                  <div className="md:col-span-5 lg:col-span-4">
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: 340,
                        marginLeft: 'auto',
                      }}
                    >
                      {/* Background accent shape -- offset */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 12,
                          left: -12,
                          right: 12,
                          bottom: -12,
                          backgroundColor: `${primary_color}15`,
                          borderRadius: '4px 4px 4px 40px',
                        }}
                      />
                      <div
                        style={{
                          position: 'relative',
                          aspectRatio: '3/4',
                          overflow: 'hidden',
                          borderRadius: '4px 4px 4px 40px',
                        }}
                      >
                        <Image
                          src={photo_url}
                          alt={`Photo de ${title}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 340px"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>
        )

      case 'bio':
        if (!bio) return null
        return (
          <section key="bio" className="px-5 md:px-12 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <p
                className="max-w-md"
                style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  color: '#6A6A6A',
                  fontWeight: 400,
                }}
              >
                {bio}
              </p>
            </div>
          </section>
        )

      case 'socials': {
        const socialEntries = social_links ? Object.entries(social_links).filter(([, url]) => url) : []
        if (socialEntries.length === 0 && !contact_email) return null
        return (
          <section key="socials" className="px-5 py-8 md:px-12 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-wrap items-center gap-5">
                {socialEntries.map(([platform, url]) => {
                  const config = SOCIAL_ICONS[platform]
                  if (!config || !url) return null
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
                        color: '#8A8A8A',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        textDecoration: 'none',
                        transition: 'color 200ms ease-out',
                      }}
                    >
                      <IconComponent size={16} />
                      <span>{config.label}</span>
                    </a>
                  )
                })}
                {contact_email ? (
                  <a
                    href={`mailto:${contact_email}`}
                    aria-label="Envoyer un email"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      color: primary_color,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <Mail size={16} />
                    <span>Contact</span>
                  </a>
                ) : null}
              </div>
            </div>
          </section>
        )
      }

      case 'projects':
        return (
          <section key="projects">
            {/* Thin separator */}
            <div className="mx-auto max-w-6xl px-5 md:px-12 lg:px-20">
              <div
                style={{
                  height: 1,
                  background: `linear-gradient(90deg, ${primary_color}, ${secondary_color}40, transparent)`,
                }}
              />
            </div>

            {/* Projects -- case study style */}
            <div className="px-5 py-14 md:px-12 md:py-20 lg:px-20">
              <div className="mx-auto max-w-6xl">
                <h2
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    color: '#AAAAAA',
                    marginBottom: 48,
                  }}
                >
                  Selected Work
                </h2>

                {sortedProjects.length > 0 ? (
                  <div className="flex flex-col gap-20 md:gap-28">
                    {sortedProjects.map((project, index) => {
                      const isEven = index % 2 === 0
                      return (
                        <article key={project.id}>
                          {/* Project number + title row */}
                          <div className="mb-6 flex items-baseline gap-4">
                            <span
                              style={{
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                color: primary_color,
                                letterSpacing: '0.05em',
                              }}
                            >
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <div className="flex flex-1 items-baseline gap-4">
                              <h3
                                style={{
                                  fontFamily: "'Syne', sans-serif",
                                  fontWeight: 700,
                                  fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                                  color: '#1A1A1A',
                                  letterSpacing: '-0.02em',
                                  lineHeight: 1.2,
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
                                  }}
                                >
                                  <ExternalLink size={18} />
                                </a>
                              ) : null}
                            </div>
                          </div>

                          {/* Tags as slashes */}
                          {project.tags.length > 0 ? (
                            <p
                              className="mb-6"
                              style={{
                                fontFamily: "'Syne', sans-serif",
                                fontSize: '0.82rem',
                                fontWeight: 500,
                                color: '#999999',
                                letterSpacing: '0.02em',
                              }}
                            >
                              {project.tags.join(' / ')}
                            </p>
                          ) : null}

                          {/* Image -- alternating layout */}
                          <div
                            className={`grid grid-cols-1 items-start gap-8 ${
                              project.description
                                ? 'md:grid-cols-12'
                                : 'md:grid-cols-1'
                            }`}
                          >
                            {/* Image section */}
                            <div
                              className={
                                project.description
                                  ? isEven
                                    ? 'md:col-span-8'
                                    : 'md:col-span-8 md:order-2'
                                  : 'md:col-span-1'
                              }
                            >
                              {project.images[0] ? (
                                <div
                                  style={{
                                    position: 'relative',
                                    aspectRatio: index === 0 ? '16/9' : '3/2',
                                    overflow: 'hidden',
                                    borderRadius: 6,
                                  }}
                                >
                                  <Image
                                    src={project.images[0]}
                                    alt={project.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 66vw"
                                  />
                                  {/* Subtle color overlay on bottom */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      bottom: 0,
                                      left: 0,
                                      right: 0,
                                      height: '30%',
                                      background: `linear-gradient(to top, ${primary_color}10, transparent)`,
                                      pointerEvents: 'none',
                                    }}
                                  />
                                </div>
                              ) : (
                                <div
                                  style={{
                                    aspectRatio: '3/2',
                                    backgroundColor: `${primary_color}08`,
                                    borderRadius: 6,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontFamily: "'Syne', sans-serif",
                                      fontSize: '4rem',
                                      fontWeight: 800,
                                      color: `${primary_color}15`,
                                    }}
                                  >
                                    {project.title.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Description */}
                            {project.description ? (
                              <div
                                className={
                                  isEven
                                    ? 'md:col-span-4'
                                    : 'md:col-span-4 md:order-1'
                                }
                              >
                                <p
                                  style={{
                                    fontSize: '0.95rem',
                                    lineHeight: 1.75,
                                    color: '#5A5A5A',
                                  }}
                                >
                                  {project.description}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                ) : (
                  <p
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      color: '#AAAAAA',
                      fontSize: '1rem',
                    }}
                  >
                    Aucun projet pour le moment.
                  </p>
                )}
              </div>
            </div>
          </section>
        )

      case 'skills':
        if (skills.length === 0) return null
        return (
          <section key="skills" className="px-5 py-12 md:px-12 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: '#AAAAAA',
                  marginBottom: 24,
                }}
              >
                Competences
              </h2>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#4A4A4A',
                      backgroundColor: `${primary_color}08`,
                      padding: '8px 18px',
                      borderRadius: 6,
                      border: `1px solid ${primary_color}15`,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )

      case 'contact':
        if (!contact_email) return null
        return (
          <section key="contact" className="px-5 py-14 md:px-12 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <div
                style={{
                  height: 1,
                  backgroundColor: '#E5E5E0',
                  marginBottom: 40,
                }}
              />
              <div className="text-center">
                <h2
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                    color: '#1A1A1A',
                    letterSpacing: '-0.02em',
                  }}
                  className="mb-3"
                >
                  Me contacter
                </h2>
                <p
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: 1.7,
                    color: '#6A6A6A',
                  }}
                  className="mb-6"
                >
                  Interesse par mon profil ? Ecrivez-moi.
                </p>
                <a
                  href={`mailto:${contact_email}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: primary_color,
                    color: '#FFFFFF',
                    padding: '12px 28px',
                    borderRadius: 6,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    fontFamily: "'Syne', sans-serif",
                    textDecoration: 'none',
                    letterSpacing: '-0.01em',
                  }}
                >
                  <Mail size={18} />
                  {contact_email}
                </a>
              </div>
            </div>
          </section>
        )

      default:
        return null
    }
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Work+Sans:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          fontFamily: "'Work Sans', sans-serif",
          backgroundColor: '#F8F7F4',
          color: '#2B2B2B',
          minHeight: '100vh',
        }}
      >
        {visibleSections.map(renderSection)}

        {/* Footer */}
        <footer className="px-5 py-10 md:px-12 lg:px-20">
          <div className="mx-auto max-w-6xl">
            <div
              style={{
                height: 1,
                backgroundColor: '#E5E5E0',
                marginBottom: 24,
              }}
            />
            <div className="flex items-center justify-between">
              <p
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#BBBBBB',
                  letterSpacing: '0.05em',
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
                    fontFamily: "'Syne', sans-serif",
                    fontSize: '0.75rem',
                    color: '#BBBBBB',
                    textDecoration: 'none',
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                  }}
                >
                  Fait avec{' '}
                  <span style={{ fontWeight: 700, color: primary_color }}>
                    Vizly
                  </span>
                </a>
              ) : null}
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
