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
  Layers,
  Hash,
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
 * Lighten a hex color by mixing with white.
 */
function lightenHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)

  const lr = Math.round(r + (255 - r) * amount)
  const lg = Math.round(g + (255 - g) * amount)
  const lb = Math.round(b + (255 - b) * amount)

  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`
}

export function TemplateBento({
  portfolio,
  projects,
  skills,
  sections,
  customBlocks,
  kpis,
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

  const bgSurface = '#F3F3F1'
  const cardBg = '#FFFFFF'
  const accentLight = lightenHex(primary_color, 0.88)
  const borderLight = '#EAEAE8'

  // Social entries for rendering
  const socialEntries = social_links
    ? Object.entries(social_links).filter(
        ([, url]) => url
      )
    : []

  function renderSection(section: SectionBlock) {
    switch (section.id) {
      case 'hero':
        return [
          /* Block: Photo (1x1) */
          <div
            key="hero-photo"
            className="col-span-2 md:col-span-1"
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              overflow: 'hidden',
              border: `1px solid ${borderLight}`,
              aspectRatio: '1',
            }}
          >
            {photo_url ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                }}
              >
                <Image
                  src={photo_url}
                  alt={`Photo de ${title}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  priority
                />
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: accentLight,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Inter Tight', sans-serif",
                    fontSize: '3rem',
                    fontWeight: 800,
                    color: `${primary_color}30`,
                  }}
                >
                  {title.charAt(0)}
                </span>
              </div>
            )}
          </div>,

          /* Block: Name + Bio (2x1) */
          <div
            key="hero-name"
            className="col-span-2"
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              border: `1px solid ${borderLight}`,
              padding: 'clamp(16px, 3vw, 28px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: '#1A1A1A',
              }}
            >
              {title}
            </h1>
          </div>,

          /* Block: Stats (1x1) */
          <div
            key="hero-stats"
            className="col-span-2 md:col-span-1"
            style={{
              backgroundColor: primary_color,
              borderRadius: 20,
              padding: 'clamp(16px, 3vw, 24px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              aspectRatio: '1',
            }}
          >
            <Layers
              size={22}
              style={{ color: '#FFFFFF', opacity: 0.6 }}
            />
            <div>
              <p
                style={{
                  fontFamily: "'Inter Tight', sans-serif",
                  fontWeight: 800,
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  color: '#FFFFFF',
                  lineHeight: 1,
                }}
              >
                {sortedProjects.length}
              </p>
              <p
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  color: '#FFFFFF',
                  opacity: 0.7,
                  marginTop: 4,
                  letterSpacing: '0.02em',
                }}
              >
                {sortedProjects.length === 1 ? 'Projet' : 'Projets'}
              </p>
            </div>
          </div>,
        ]

      case 'bio':
        if (!bio) return null
        return (
          <div
            key="bio"
            className="col-span-4"
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              border: `1px solid ${borderLight}`,
              padding: 'clamp(16px, 3vw, 24px)',
            }}
          >
            <p
              style={{
                fontSize: '0.92rem',
                lineHeight: 1.65,
                color: '#7A7A7A',
                fontWeight: 400,
                maxWidth: 600,
              }}
            >
              {bio}
            </p>
          </div>
        )

      case 'socials': {
        if (socialEntries.length === 0 && !contact_email) return null
        return (
          <div
            key="socials"
            className="col-span-4 md:col-span-2"
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              border: `1px solid ${borderLight}`,
              padding: 'clamp(16px, 3vw, 24px)',
            }}
          >
            <p
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                fontWeight: 600,
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#BBBBBB',
                marginBottom: 14,
              }}
            >
              Connect
            </p>
            <div className="flex flex-wrap gap-2">
              {socialEntries.map(([platform, url]) => {
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
                      padding: '8px 14px',
                      borderRadius: 12,
                      backgroundColor: bgSurface,
                      color: '#5A5A5A',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      transition: 'background-color 200ms ease-out',
                    }}
                  >
                    <IconComponent size={15} />
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
                    padding: '8px 14px',
                    borderRadius: 12,
                    backgroundColor: `${primary_color}12`,
                    color: primary_color,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <Mail size={15} />
                  <span>Email</span>
                </a>
              ) : null}
            </div>
          </div>
        )
      }

      case 'skills': {
        if (skills.length === 0) return null
        return (
          <div
            key="skills"
            className="col-span-4 md:col-span-2"
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              border: `1px solid ${borderLight}`,
              padding: 'clamp(16px, 3vw, 24px)',
            }}
          >
            <div
              className="mb-3 flex items-center gap-2"
              style={{ color: '#BBBBBB' }}
            >
              <Hash size={14} />
              <p
                style={{
                  fontFamily: "'Inter Tight', sans-serif",
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Competences
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <span
                  key={skill}
                  style={{
                    fontFamily: "'Inter Tight', sans-serif",
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color:
                      i % 2 === 0
                        ? primary_color
                        : secondary_color,
                    backgroundColor:
                      i % 2 === 0
                        ? `${primary_color}10`
                        : `${secondary_color}10`,
                    padding: '6px 14px',
                    borderRadius: 10,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )
      }

      case 'projects':
        return [
          ...sortedProjects.map((project, index) => {
            // Vary widget sizes: first project gets 4 cols, rest get 2
            const isHero = index === 0 && sortedProjects.length > 1
            const showLargeImage = isHero

            return (
              <ClickableProject
                key={`project-${project.id}`}
                project={project}
                primaryColor={primary_color}
                className={
                  isHero ? 'col-span-4 md:col-span-4' : sortedProjects.length === 1 ? 'col-span-4 md:col-span-4 max-w-2xl' : 'col-span-4 md:col-span-2'
                }
              >
                <article
                  className="group h-full overflow-hidden transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: 20,
                    border: `1px solid ${borderLight}`,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Project image */}
                  {project.images[0] ? (
                    <div
                      className="relative overflow-hidden"
                      style={{
                        aspectRatio: showLargeImage ? '2.2/1' : '16/10',
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        src={project.images[0]}
                        alt={project.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes={
                          isHero
                            ? '(max-width: 768px) 100vw, 90vw'
                            : '(max-width: 768px) 100vw, 50vw'
                        }
                      />
                      {/* Overlay gradient */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '40%',
                          background:
                            'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
                          pointerEvents: 'none',
                        }}
                      />
                      {/* Title overlay on hero */}
                      {showLargeImage ? (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: 'clamp(16px, 3vw, 28px)',
                          }}
                        >
                          <h3
                            style={{
                              fontFamily: "'Inter Tight', sans-serif",
                              fontWeight: 700,
                              fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
                              color: '#FFFFFF',
                              lineHeight: 1.2,
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {project.title}
                          </h3>
                        </div>
                      ) : null}
                      {project.images.length > 1 && (
                        <span style={{ position: 'absolute', bottom: showLargeImage ? 48 : 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
                          +{project.images.length - 1}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        aspectRatio: showLargeImage ? '2.2/1' : '16/10',
                        backgroundColor: accentLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Inter Tight', sans-serif",
                          fontSize: showLargeImage ? '4rem' : '2.5rem',
                          fontWeight: 800,
                          color: `${primary_color}20`,
                        }}
                      >
                        {project.title.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div
                    style={{
                      padding: 'clamp(14px, 2.5vw, 22px)',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Title (for non-hero cards) */}
                    {!showLargeImage ? (
                      <h3
                        style={{
                          fontFamily: "'Inter Tight', sans-serif",
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: '#1A1A1A',
                          lineHeight: 1.25,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {project.title}
                      </h3>
                    ) : (
                      <span
                        style={{
                          fontFamily: "'Inter Tight', sans-serif",
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          color: '#999999',
                        }}
                      >
                        Featured
                      </span>
                    )}

                    {project.description ? (
                      <p
                        className="mt-2"
                        style={{
                          fontSize: '0.82rem',
                          lineHeight: 1.55,
                          color: '#888888',
                          fontWeight: 400,
                          display: '-webkit-box',
                          WebkitLineClamp: showLargeImage ? 3 : 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {project.description}
                      </p>
                    ) : null}

                    {/* Tags */}
                    {project.tags.length > 0 ? (
                      <div
                        className="flex flex-wrap gap-1.5"
                        style={{ paddingTop: 10 }}
                      >
                        {project.tags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontFamily: "'Inter Tight', sans-serif",
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              color: '#AAAAAA',
                              backgroundColor: bgSurface,
                              padding: '3px 10px',
                              borderRadius: 6,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 5 && (
                          <span style={{ fontSize: '0.68rem', color: '#CCCCCC' }}>+{project.tags.length - 5}</span>
                        )}
                      </div>
                    ) : null}

                    <p style={{ marginTop: 'auto', paddingTop: 10, fontSize: '0.75rem', color: primary_color, fontWeight: 600, fontFamily: "'Inter Tight', sans-serif" }}>
                      Voir le detail &rarr;
                    </p>
                  </div>
                </article>
              </ClickableProject>
            )
          }),
          ...(sortedProjects.length === 0
            ? [
                <div
                  key="projects-empty"
                  className="col-span-4"
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: 20,
                    border: `1px solid ${borderLight}`,
                    padding: 40,
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Inter Tight', sans-serif",
                      color: '#CCCCCC',
                      fontSize: '0.95rem',
                    }}
                  >
                    Aucun projet pour le moment.
                  </p>
                </div>,
              ]
            : []),
        ]

      case 'contact':
        if (!contact_email) return null
        return (
          <div
            key="contact"
            className="col-span-4"
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              border: `1px solid ${borderLight}`,
              padding: 'clamp(20px, 3vw, 32px)',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                fontWeight: 700,
                fontSize: '1.1rem',
                color: '#1A1A1A',
                letterSpacing: '-0.01em',
              }}
              className="mb-2"
            >
              Me contacter
            </h2>
            <p
              style={{
                fontSize: '0.82rem',
                color: '#999999',
                fontWeight: 400,
              }}
              className="mb-5"
            >
              Interesse par mon profil ? Ecrivez-moi.
            </p>
            <a
              href={`mailto:${contact_email}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 12,
                backgroundColor: primary_color,
                color: '#FFFFFF',
                fontFamily: "'Inter Tight', sans-serif",
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Mail size={16} />
              {contact_email}
            </a>
          </div>
        )

      case 'kpis':
        if (kpis.length === 0) return null
        return (
          <div
            key="kpis"
            className="col-span-4"
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              border: `1px solid ${borderLight}`,
              padding: 'clamp(16px, 3vw, 24px)',
            }}
          >
            <p
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                fontWeight: 600,
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#BBBBBB',
                marginBottom: 14,
              }}
            >
              Chiffres cles
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {kpis.map((kpi) => (
                <KpiRenderer key={kpi.id} kpi={kpi} primaryColor={primary_color} />
              ))}
            </div>
          </div>
        )

      default: {
        // Custom blocks
        if (section.id.startsWith('custom-')) {
          const blockId = section.id.replace('custom-', '')
          const block = customBlocks.find((b) => b.id === blockId)
          if (!block) return null
          return (
            <div
              key={section.id}
              className="col-span-4"
              style={{
                backgroundColor: cardBg,
                borderRadius: 20,
                border: `1px solid ${borderLight}`,
                padding: 'clamp(16px, 3vw, 24px)',
              }}
            >
              {block.title && (
                <h2
                  style={{
                    fontFamily: "'Inter Tight', sans-serif",
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: '#1A1A1A',
                    letterSpacing: '-0.01em',
                    marginBottom: 4,
                  }}
                >
                  {block.title}
                </h2>
              )}
              {block.subtitle && (
                <p style={{ fontSize: '0.82rem', color: '#999999', fontWeight: 400, marginBottom: 12 }}>{block.subtitle}</p>
              )}
              {block.content && (
                <div
                  style={{ fontSize: '0.88rem', lineHeight: 1.65, color: '#7A7A7A', fontWeight: 400 }}
                  className="[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_p]:my-1 [&_b]:font-bold [&_i]:italic"
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              )}
            </div>
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
        href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Red+Hat+Display:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          fontFamily: "'Red Hat Display', sans-serif",
          backgroundColor: bgSurface,
          color: '#2D2D2D',
          minHeight: '100vh',
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12 lg:px-8">
          {/* Bento grid */}
          <div
            className="grid gap-3 md:gap-4"
            style={{
              gridTemplateColumns: 'repeat(4, 1fr)',
              gridAutoRows: 'minmax(0, 1fr)',
            }}
          >
            {visibleSections.map(renderSection)}
          </div>

          {/* Footer */}
          <div
            className="mt-6 flex items-center justify-between px-2"
            style={{ paddingTop: 8 }}
          >
            <p
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#CCCCCC',
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
                  fontFamily: "'Inter Tight', sans-serif",
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color: '#CCCCCC',
                  textDecoration: 'none',
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
      </div>
    </>
  )
}
