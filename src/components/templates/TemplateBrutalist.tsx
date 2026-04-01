import Image from 'next/image'
import type { TemplateProps } from '@/types'
import { DEFAULT_SECTIONS, type SectionBlock } from '@/types/sections'
import { ClickableProject } from './ClickableProject'
import { KpiRenderer } from './KpiRenderer'
import { LayoutBlockRenderer } from './LayoutBlockRenderer'
import type { LucideIcon } from 'lucide-react'
import {
  Code2,
  Link2,
  Camera,
  AtSign,
  Globe,
  Pen,
  Mail,
} from 'lucide-react'

const SOCIAL_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  github: { icon: Code2, label: 'GitHub' },
  linkedin: { icon: Link2, label: 'LinkedIn' },
  instagram: { icon: Camera, label: 'Instagram' },
  twitter: { icon: AtSign, label: 'Twitter' },
  dribbble: { icon: Pen, label: 'Dribbble' },
  website: { icon: Globe, label: 'Site web' },
}

export function TemplateBrutalist({
  portfolio,
  projects,
  skills,
  sections,
  customBlocks,
  kpis,
  layoutBlocks,
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

  function renderSection(section: SectionBlock) {
    switch (section.id) {
      case 'hero':
        return (
          <header key="hero" className="px-5 pt-10 pb-8 md:px-10 md:pt-16 md:pb-12">
            <div className="mx-auto max-w-5xl">
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
        )

      case 'bio':
        if (!bio) return null
        return (
          <section key="bio" className="px-5 md:px-10">
            <div className="mx-auto max-w-5xl">
              <p
                className="max-w-md"
                style={{
                  fontSize: '0.82rem',
                  lineHeight: 1.7,
                  color: mutedColor,
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
          <section key="socials" className="px-5 py-6 md:px-10">
            <div className="mx-auto max-w-5xl">
              <div
                className="flex flex-wrap items-center justify-between gap-4"
                style={{
                  paddingBottom: 12,
                  borderBottom: `3px solid ${borderColor}`,
                }}
              >
                <div className="flex flex-wrap items-center gap-4">
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
                  })}
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
            </div>
          </section>
        )
      }

      case 'projects':
        return (
          <section key="projects">
            {/* Thick divider */}
            <div className="mx-auto max-w-5xl px-5 md:px-10">
              <div style={{ height: 4, backgroundColor: borderColor }} />
            </div>

            {/* Projects */}
            <div className="px-5 py-12 md:px-10 md:py-16">
              <div className={`mx-auto ${sortedProjects.length === 1 ? 'max-w-2xl' : 'max-w-5xl'}`}>
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
                      <ClickableProject key={project.id} project={project} primaryColor={primary_color} dark={isDark}>
                        <article
                          className="group"
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

                              {project.description ? (
                                <p
                                  className="mt-3"
                                  style={{
                                    fontSize: '0.8rem',
                                    lineHeight: 1.65,
                                    color: mutedColor,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {project.description}
                                </p>
                              ) : null}

                              {/* Tags -- bracket style */}
                              {project.tags.length > 0 ? (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {project.tags.slice(0, 5).map((tag) => (
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
                                  {project.tags.length > 5 && (
                                    <span style={{ fontSize: '0.7rem', color: mutedColor }}>+{project.tags.length - 5}</span>
                                  )}
                                </div>
                              ) : null}

                              <p style={{ marginTop: 12, fontSize: '0.72rem', color: primary_color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Voir le detail &rarr;
                              </p>
                            </div>

                            {/* Image */}
                            <div className="md:col-span-4">
                              {project.images[0] ? (
                                <div
                                  className="relative overflow-hidden"
                                  style={{
                                    aspectRatio: '4/3',
                                    border: `2px solid ${borderColor}`,
                                  }}
                                >
                                  <Image
                                    src={project.images[0]}
                                    alt={project.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                  />
                                  {project.images.length > 1 && (
                                    <span style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
                                      +{project.images.length - 1}
                                    </span>
                                  )}
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
                      </ClickableProject>
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
            </div>
          </section>
        )

      case 'skills':
        if (skills.length === 0) return null
        return (
          <section key="skills" className="px-5 py-12 md:px-10">
            <div className="mx-auto max-w-5xl">
              <div style={{ height: 4, backgroundColor: borderColor, marginBottom: 32 }} />
              <h2
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: textColor,
                  marginBottom: 24,
                  lineHeight: 1,
                }}
              >
                Skills
              </h2>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: primary_color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '6px 14px',
                      border: `2px solid ${primary_color}`,
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
          <section key="contact" className="px-5 py-12 md:px-10">
            <div className="mx-auto max-w-5xl">
              <div style={{ height: 4, backgroundColor: borderColor, marginBottom: 32 }} />
              <div className="text-center">
                <h2
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: textColor,
                    lineHeight: 1,
                  }}
                  className="mb-4"
                >
                  Contact
                </h2>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: mutedColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                  className="mb-6"
                >
                  Interesse ? Ecrivez-moi.
                </p>
                <a
                  href={`mailto:${contact_email}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: primary_color,
                    color: isDark ? '#0D0D0D' : '#FFFFFF',
                    padding: '14px 32px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    textDecoration: 'none',
                    border: `2px solid ${primary_color}`,
                  }}
                >
                  <Mail size={16} />
                  {contact_email}
                </a>
              </div>
            </div>
          </section>
        )

      case 'kpis':
        if (kpis.length === 0) return null
        return (
          <section key="kpis" className="px-5 py-12 md:px-10">
            <div className="mx-auto max-w-5xl">
              <div style={{ height: 4, backgroundColor: borderColor, marginBottom: 32 }} />
              <h2
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: textColor,
                  marginBottom: 24,
                  lineHeight: 1,
                }}
              >
                Chiffres Cles
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {kpis.map((kpi) => (
                  <KpiRenderer key={kpi.id} kpi={kpi} primaryColor={primary_color} />
                ))}
              </div>
            </div>
          </section>
        )

      default: {
        // Layout blocks
        if (section.id.startsWith('layout-')) {
          const blockId = section.id.replace('layout-', '')
          const block = layoutBlocks.find((b) => b.id === blockId)
          if (!block) return null
          return (
            <section key={section.id} className="px-5 py-12 md:px-10">
              <div className="mx-auto max-w-5xl">
                <div style={{ height: 4, backgroundColor: borderColor, marginBottom: 32 }} />
                <LayoutBlockRenderer block={block} primaryColor={primary_color} />
              </div>
            </section>
          )
        }

        // Custom blocks
        if (section.id.startsWith('custom-')) {
          const blockId = section.id.replace('custom-', '')
          const block = customBlocks.find((b) => b.id === blockId)
          if (!block) return null
          return (
            <section key={section.id} className="px-5 py-12 md:px-10">
              <div className="mx-auto max-w-5xl">
                <div style={{ height: 4, backgroundColor: borderColor, marginBottom: 32 }} />
                {block.title && (
                  <h2
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: textColor,
                      marginBottom: 8,
                      lineHeight: 1,
                    }}
                  >
                    {block.title}
                  </h2>
                )}
                {block.subtitle && (
                  <p style={{ fontSize: '0.82rem', color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>{block.subtitle}</p>
                )}
                {block.content && (
                  <div
                    style={{ fontSize: '0.82rem', lineHeight: 1.7, color: mutedColor }}
                    className="[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:uppercase [&_h2]:tracking-wider [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:uppercase [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_p]:my-1 [&_b]:font-bold [&_i]:italic"
                    dangerouslySetInnerHTML={{ __html: block.content }}
                  />
                )}
              </div>
            </section>
          )
        }
        return null
      }
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
          {visibleSections.map(renderSection)}

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
