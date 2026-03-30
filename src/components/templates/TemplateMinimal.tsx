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

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  github: Code2,
  linkedin: Link2,
  instagram: Camera,
  twitter: AtSign,
  dribbble: Pen,
  website: Globe,
}

export function TemplateMinimal({ portfolio, projects, isPremium }: TemplateProps) {
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

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          fontFamily: "'Source Sans 3', sans-serif",
          backgroundColor: '#FAFAFA',
          color: '#2D2D2D',
          minHeight: '100vh',
        }}
      >
        {/* Header */}
        <header
          style={{ borderBottom: `1px solid ${secondary_color}22` }}
          className="px-6 pt-16 pb-12 md:pt-24 md:pb-16"
        >
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10">
              {/* Photo */}
              {photo_url ? (
                <div
                  className="shrink-0 overflow-hidden"
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    border: `3px solid ${primary_color}`,
                  }}
                >
                  <Image
                    src={photo_url}
                    alt={`Photo de ${title}`}
                    width={96}
                    height={96}
                    className="object-cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              ) : null}

              {/* Info */}
              <div className="text-center md:text-left">
                <h1
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                    lineHeight: 1.15,
                    color: '#1A1A1A',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {title}
                </h1>
                {bio ? (
                  <p
                    className="mt-3 max-w-lg"
                    style={{
                      fontSize: '1.05rem',
                      lineHeight: 1.65,
                      color: '#5A5A5A',
                    }}
                  >
                    {bio}
                  </p>
                ) : null}

                {/* Social links + email */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  {social_links
                    ? Object.entries(social_links).map(([platform, url]) => {
                        if (!url) return null
                        const IconComponent = SOCIAL_ICONS[platform]
                        if (!IconComponent) return null
                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Profil ${platform}`}
                            className="transition-colors duration-200"
                            style={{
                              color: '#8A8A8A',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 38,
                              height: 38,
                              borderRadius: 8,
                              border: '1px solid #E8E8E8',
                              backgroundColor: '#FFFFFF',
                            }}
                            onMouseOver={undefined}
                          >
                            <IconComponent size={17} />
                          </a>
                        )
                      })
                    : null}
                  {contact_email ? (
                    <a
                      href={`mailto:${contact_email}`}
                      aria-label="Envoyer un email"
                      className="transition-colors duration-200"
                      style={{
                        color: '#8A8A8A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        border: '1px solid #E8E8E8',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <Mail size={17} />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Projects section */}
        <main className="px-6 py-12 md:py-16">
          <div className="mx-auto max-w-5xl">
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: '1.35rem',
                color: '#1A1A1A',
                letterSpacing: '-0.01em',
              }}
              className="mb-8"
            >
              Projets
            </h2>

            {sortedProjects.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sortedProjects.map((project) => (
                  <article
                    key={project.id}
                    className="group overflow-hidden transition-shadow duration-250"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 12,
                      border: '1px solid #EBEBEB',
                    }}
                  >
                    {/* Project image */}
                    {project.images[0] ? (
                      <div
                        className="relative overflow-hidden"
                        style={{ aspectRatio: '16/10' }}
                      >
                        <Image
                          src={project.images[0]}
                          alt={project.title}
                          fill
                          className="object-cover transition-transform duration-500"
                          style={{ transform: 'scale(1)' }}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        {/* Accent line on top */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            backgroundColor: primary_color,
                            opacity: 0,
                            transition: 'opacity 300ms ease-out',
                          }}
                          className="group-hover:opacity-100"
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          aspectRatio: '16/10',
                          backgroundColor: `${primary_color}08`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: '2rem',
                            fontWeight: 600,
                            color: `${primary_color}30`,
                          }}
                        >
                          {project.title.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 600,
                            fontSize: '1.05rem',
                            color: '#1A1A1A',
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
                            style={{ color: primary_color }}
                            className="shrink-0 transition-transform duration-200"
                          >
                            <ExternalLink size={16} />
                          </a>
                        ) : null}
                      </div>

                      {project.description ? (
                        <p
                          className="mt-2"
                          style={{
                            fontSize: '0.9rem',
                            lineHeight: 1.6,
                            color: '#6B6B6B',
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
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                color: primary_color,
                                backgroundColor: `${primary_color}0C`,
                                padding: '3px 10px',
                                borderRadius: 6,
                                letterSpacing: '0.01em',
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
              <p style={{ color: '#8A8A8A', fontSize: '0.95rem' }}>
                Aucun projet pour le moment.
              </p>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer
          className="px-6 py-8"
          style={{ borderTop: '1px solid #EBEBEB' }}
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <p style={{ fontSize: '0.8rem', color: '#ABABAB' }}>
              {new Date().getFullYear()}
            </p>
            {!isPremium ? (
              <a
                href="https://vizly.fr"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.75rem',
                  color: '#ABABAB',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
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
