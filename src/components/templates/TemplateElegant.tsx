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

export function TemplateElegant({
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

  function renderSection(section: SectionBlock) {
    switch (section.id) {
      case 'hero':
        return (
          <header
            key="hero"
            className="px-6 pt-20 pb-8 md:px-16 md:pt-32 md:pb-12 lg:px-24"
            style={{ textAlign: 'center' }}
          >
            <div className="mx-auto max-w-3xl">
              {/* Photo -- portrait, fine border */}
              {photo_url ? (
                <div
                  style={{
                    display: 'inline-block',
                    marginBottom: 40,
                  }}
                >
                  <div
                    style={{
                      width: 140,
                      height: 180,
                      overflow: 'hidden',
                      borderRadius: 2,
                      border: `1px solid ${secondary_color}30`,
                    }}
                  >
                    <Image
                      src={photo_url}
                      alt={`Portrait de ${title}`}
                      width={140}
                      height={180}
                      className="object-cover"
                      style={{ width: '100%', height: '100%' }}
                      priority
                    />
                  </div>
                </div>
              ) : null}

              {/* Name -- serif, light weight, wide tracking */}
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 300,
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  lineHeight: 1.15,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#1A1A1A',
                }}
              >
                {title}
              </h1>

              {/* Thin elegant separator */}
              <div
                style={{
                  width: 60,
                  height: 1,
                  backgroundColor: primary_color,
                  margin: '24px auto',
                  opacity: 0.6,
                }}
              />
            </div>
          </header>
        )

      case 'bio':
        if (!bio) return null
        return (
          <section key="bio" className="px-6 md:px-16 lg:px-24" style={{ textAlign: 'center' }}>
            <div className="mx-auto max-w-3xl">
              <p
                className="mx-auto max-w-lg"
                style={{
                  fontSize: '1.15rem',
                  lineHeight: 1.8,
                  color: '#7A7A7A',
                  fontWeight: 300,
                  letterSpacing: '0.01em',
                  fontStyle: 'italic',
                  fontFamily: "'Cormorant Garamond', serif",
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
          <section key="socials" className="px-6 py-10 md:px-16 lg:px-24" style={{ textAlign: 'center' }}>
            <div className="mx-auto max-w-3xl">
              <div className="flex flex-wrap items-center justify-center gap-6">
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
                        color: '#AAAAAA',
                        fontSize: '0.72rem',
                        fontWeight: 400,
                        textDecoration: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        transition: 'color 250ms ease-out',
                      }}
                    >
                      <IconComponent size={13} />
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
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                    }}
                  >
                    <Mail size={13} />
                    <span>Email</span>
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
            <div className="mx-auto max-w-4xl px-6 md:px-16 lg:px-24">
              <h2
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: 300,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  color: '#BBBBBB',
                  textAlign: 'center',
                  marginBottom: 60,
                }}
              >
                Portfolio
              </h2>
            </div>

            {sortedProjects.length > 0 ? (
              <div className="flex flex-col">
                {sortedProjects.map((project) => (
                  <article
                    key={project.id}
                    className="px-6 md:px-16 lg:px-24"
                    style={{
                      paddingTop: 48,
                      paddingBottom: 60,
                    }}
                  >
                    <div className="mx-auto max-w-4xl">
                      {/* Project image -- large, clean */}
                      {project.images[0] ? (
                        <div
                          style={{
                            position: 'relative',
                            aspectRatio: '3/2',
                            overflow: 'hidden',
                            borderRadius: 2,
                            marginBottom: 32,
                          }}
                        >
                          <Image
                            src={project.images[0]}
                            alt={project.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 800px"
                          />
                        </div>
                      ) : null}

                      {/* Title row */}
                      <div className="flex items-baseline justify-between gap-4">
                        <h3
                          style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontWeight: 500,
                            fontStyle: 'italic',
                            fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
                            color: '#1A1A1A',
                            lineHeight: 1.3,
                            letterSpacing: '0.01em',
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
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              color: primary_color,
                              fontStyle: 'italic',
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: '0.9rem',
                              textDecoration: 'none',
                              flexShrink: 0,
                              borderBottom: `1px solid ${primary_color}40`,
                              paddingBottom: 2,
                              transition: 'border-color 250ms ease-out',
                            }}
                          >
                            <span>Voir</span>
                            <ExternalLink size={14} />
                          </a>
                        ) : null}
                      </div>

                      {project.description ? (
                        <p
                          className="mt-4 max-w-2xl"
                          style={{
                            fontSize: '0.88rem',
                            lineHeight: 1.85,
                            color: '#7A7A7A',
                            fontWeight: 300,
                          }}
                        >
                          {project.description}
                        </p>
                      ) : null}

                      {/* Tags -- minimal, uppercase, almost invisible */}
                      {project.tags.length > 0 ? (
                        <div className="mt-5 flex flex-wrap gap-4">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.2em',
                                color: '#C0C0C0',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {/* Thin separator */}
                      <div
                        style={{
                          width: 40,
                          height: 1,
                          backgroundColor: `${primary_color}30`,
                          marginTop: 48,
                        }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="px-6 md:px-16 lg:px-24">
                <p
                  className="mx-auto max-w-4xl text-center"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    color: '#BBBBBB',
                    fontSize: '1.1rem',
                    paddingBottom: 60,
                  }}
                >
                  Aucun projet pour le moment.
                </p>
              </div>
            )}
          </section>
        )

      case 'skills':
        if (skills.length === 0) return null
        return (
          <section key="skills" className="px-6 py-12 md:px-16 lg:px-24" style={{ textAlign: 'center' }}>
            <div className="mx-auto max-w-4xl">
              <h2
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: 300,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  color: '#BBBBBB',
                  marginBottom: 28,
                }}
              >
                Competences
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '0.95rem',
                      fontWeight: 400,
                      fontStyle: 'italic',
                      color: '#7A7A7A',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <div
                style={{
                  width: 40,
                  height: 1,
                  backgroundColor: `${primary_color}30`,
                  margin: '32px auto 0',
                }}
              />
            </div>
          </section>
        )

      case 'contact':
        if (!contact_email) return null
        return (
          <section key="contact" className="px-6 py-16 md:px-16 lg:px-24" style={{ textAlign: 'center' }}>
            <div className="mx-auto max-w-3xl">
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 300,
                  fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#1A1A1A',
                }}
                className="mb-4"
              >
                Me contacter
              </h2>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                  fontSize: '1rem',
                  color: '#AAAAAA',
                  letterSpacing: '0.02em',
                }}
                className="mb-8"
              >
                Interesse par mon profil ? N&apos;hesitez pas.
              </p>
              <a
                href={`mailto:${contact_email}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: primary_color,
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  borderBottom: `1px solid ${primary_color}40`,
                  paddingBottom: 4,
                  transition: 'border-color 250ms ease-out',
                }}
              >
                <Mail size={14} />
                {contact_email}
              </a>
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
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Raleway:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          fontFamily: "'Raleway', sans-serif",
          backgroundColor: '#FAF9F6',
          color: '#3D3D3D',
          minHeight: '100vh',
        }}
      >
        {visibleSections.map(renderSection)}

        {/* Footer */}
        <footer
          className="px-6 py-16 md:px-16 md:py-20 lg:px-24"
          style={{ textAlign: 'center' }}
        >
          <div className="mx-auto max-w-4xl">
            <div
              style={{
                width: 1,
                height: 40,
                backgroundColor: '#E0E0E0',
                margin: '0 auto 24px',
              }}
            />
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '0.85rem',
                color: '#CCCCCC',
                letterSpacing: '0.1em',
                fontWeight: 300,
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
                  display: 'inline-block',
                  marginTop: 12,
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: '0.65rem',
                  fontWeight: 400,
                  color: '#CCCCCC',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                }}
              >
                Fait avec{' '}
                <span style={{ fontWeight: 600, color: primary_color }}>
                  Vizly
                </span>
              </a>
            ) : null}
          </div>
        </footer>
      </div>
    </>
  )
}
