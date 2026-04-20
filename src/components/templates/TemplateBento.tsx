import { Fragment } from 'react'
import Image from 'next/image'
import type { TemplateProps } from '@/types'
import { type SectionBlock } from '@/types/sections'
import { ClickableProject } from './ClickableProject'
import { KpiRenderer } from './KpiRenderer'
import { LayoutBlockRenderer } from './LayoutBlockRenderer'
import { TemplateFooter } from './TemplateFooter'
import { ContactFormWidget } from './ContactFormWidget'
import { SOCIAL_ICONS, getVisibleSections, getSortedProjects, getSocialEntries } from './shared'
import {
  Mail,
  ArrowUpRight,
} from 'lucide-react'

/** Mix a hex color with white. amount 0=hex, 1=white */
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

const BG_SURFACE = '#F4F3EF'
const CARD_BG = '#FFFFFF'
const BORDER = '#E8E7E2'
const TEXT_PRIMARY = '#1A1A1A'
const TEXT_SECONDARY = '#6F6F6A'
const TEXT_TERTIARY = '#A8A8A2'

// Reusable card style helpers
const CARD_BASE: React.CSSProperties = {
  backgroundColor: CARD_BG,
  borderRadius: 18,
  border: `1px solid ${BORDER}`,
  overflow: 'hidden',
}

const CARD_LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'Inter Tight', sans-serif",
  fontWeight: 500,
  fontSize: '0.68rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: TEXT_TERTIARY,
}

export function TemplateBento({
  portfolio,
  projects,
  skills,
  sections,
  customBlocks,
  kpis,
  layoutBlocks,
  isPremium,
  isPreview,
}: TemplateProps) {
  const {
    title,
    bio,
    photo_url,
    primary_color,
    secondary_color,
    social_links,
    contact_email,
    contact_form_enabled,
    contact_form_title,
    contact_form_description,
    slug,
  } = portfolio

  const sortedProjects = getSortedProjects(projects)
  const visibleSections = getVisibleSections(sections)

  const accentLight = lightenHex(primary_color, 0.92)

  const socialEntries = getSocialEntries(social_links)

  function renderSection(section: SectionBlock): React.ReactNode {
    switch (section.id) {
      case 'hero': {
        // Hero combines: photo + identity card + stats — packs into a single row
        return (
          <>
            {/* Photo card — square, accents the identity (placed first for left position) */}
            <div
              key="hero-photo"
              className="col-span-1 sm:col-span-1 md:col-span-1"
              style={{
                ...CARD_BASE,
                aspectRatio: '1',
                position: 'relative',
              }}
            >
              {photo_url ? (
                <Image
                  src={photo_url}
                  alt={`Photo de ${title}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 25vw"
                  priority
                />
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
                      fontWeight: 700,
                      color: primary_color,
                      opacity: 0.4,
                    }}
                  >
                    {title.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Identity card — name + availability badge */}
            <div
              key="hero-identity"
              className="col-span-2 sm:col-span-2 md:col-span-2"
              style={{
                ...CARD_BASE,
                padding: 'clamp(18px, 2.5vw, 26px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16,
                minHeight: 140,
              }}
            >
              <p style={CARD_LABEL_STYLE}>Portfolio</p>
              <div>
                <h1
                  style={{
                    fontFamily: "'Inter Tight', sans-serif",
                    fontWeight: 700,
                    fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                    lineHeight: 1.05,
                    letterSpacing: '-0.03em',
                    color: TEXT_PRIMARY,
                  }}
                >
                  {title}
                </h1>
                <div
                  style={{
                    marginTop: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 11px',
                    borderRadius: 999,
                    backgroundColor: accentLight,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      backgroundColor: primary_color,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Inter Tight', sans-serif",
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: primary_color,
                      letterSpacing: '0.01em',
                    }}
                  >
                    Disponible
                  </span>
                </div>
              </div>
            </div>

            {/* Stats card — projects count, accent color */}
            <div
              key="hero-stats"
              className="bento-stats col-span-1 sm:col-span-1 md:col-span-1"
              style={{
                borderRadius: 18,
                backgroundColor: primary_color,
                padding: 'clamp(14px, 2vw, 20px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#FFFFFF',
                overflow: 'hidden',
                gap: 24,
              }}
            >
              <p
                style={{
                  ...CARD_LABEL_STYLE,
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                Projets
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
                <span
                  style={{
                    fontFamily: "'Inter Tight', sans-serif",
                    fontWeight: 700,
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    lineHeight: 0.85,
                    letterSpacing: '-0.04em',
                  }}
                >
                  {String(sortedProjects.length).padStart(2, '0')}
                </span>
                <ArrowUpRight size={20} style={{ opacity: 0.7, marginBottom: 4 }} />
              </div>
            </div>
          </>
        )
      }

      case 'bio': {
        if (!bio) return null
        return (
          <div
            key="bio"
            className="col-span-2 sm:col-span-2 md:col-span-2"
            style={{
              ...CARD_BASE,
              padding: 'clamp(18px, 2.5vw, 24px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <p style={CARD_LABEL_STYLE}>À propos</p>
            <p
              style={{
                marginTop: 10,
                fontSize: '0.88rem',
                lineHeight: 1.6,
                color: TEXT_SECONDARY,
                fontWeight: 400,
              }}
            >
              {bio}
            </p>
          </div>
        )
      }

      case 'socials': {
        if (socialEntries.length === 0 && !contact_email) return null
        return (
          <div
            key="socials"
            className="col-span-2 sm:col-span-2 md:col-span-2"
            style={{
              ...CARD_BASE,
              padding: 'clamp(18px, 2.5vw, 24px)',
            }}
          >
            <p style={CARD_LABEL_STYLE}>Contact</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {socialEntries.map(([platform, url]) => {
                const config = SOCIAL_ICONS[platform]
                if (!config) return null
                const Icon = config.icon
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
                      padding: '6px 11px',
                      borderRadius: 999,
                      backgroundColor: BG_SURFACE,
                      color: TEXT_SECONDARY,
                      fontSize: '0.74rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      transition: 'background-color 200ms ease',
                    }}
                  >
                    <Icon size={13} />
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
                    padding: '6px 11px',
                    borderRadius: 999,
                    backgroundColor: primary_color,
                    color: '#FFFFFF',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <Mail size={13} />
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
            className="col-span-2 sm:col-span-2 md:col-span-2"
            style={{
              ...CARD_BASE,
              padding: 'clamp(18px, 2.5vw, 24px)',
            }}
          >
            <p style={CARD_LABEL_STYLE}>Compétences</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    fontFamily: "'Inter Tight', sans-serif",
                    fontSize: '0.74rem',
                    fontWeight: 500,
                    color: TEXT_PRIMARY,
                    backgroundColor: BG_SURFACE,
                    padding: '5px 11px',
                    borderRadius: 999,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )
      }

      case 'projects': {
        if (sortedProjects.length === 0) {
          return (
            <div
              key="projects-empty"
              className="col-span-2 sm:col-span-4 md:col-span-4"
              style={{
                ...CARD_BASE,
                padding: 36,
                textAlign: 'center',
              }}
            >
              <p style={{ color: TEXT_TERTIARY, fontSize: '0.9rem' }}>
                Aucun projet pour le moment.
              </p>
            </div>
          )
        }

        return sortedProjects.map((project) => {
          // All projects use the same compact card. Single project = full width.
          const colSpan =
            sortedProjects.length === 1
              ? 'col-span-2 sm:col-span-4 md:col-span-4'
              : 'col-span-2 sm:col-span-2 md:col-span-2'

          return (
            <ClickableProject
              key={`project-${project.id}`}
              project={project}
              primaryColor={primary_color}
              className={colSpan}
            >
              <article
                className="group h-full flex flex-col"
                style={{
                  ...CARD_BASE,
                  transition: 'border-color 200ms ease',
                }}
              >
                {/* Image */}
                <div
                  className="relative overflow-hidden shrink-0"
                  style={{
                    aspectRatio: '16/10',
                    width: '100%',
                    backgroundColor: accentLight,
                  }}
                >
                  {project.images[0] ? (
                    <Image
                      src={project.images[0]}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Inter Tight', sans-serif",
                          fontSize: '2.25rem',
                          fontWeight: 700,
                          color: primary_color,
                          opacity: 0.35,
                        }}
                      >
                        {project.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  {project.images.length > 1 ? (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(4px)',
                        color: '#FFF',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '3px 9px',
                        borderRadius: 999,
                      }}
                    >
                      +{project.images.length - 1}
                    </span>
                  ) : null}
                </div>

                {/* Content */}
                <div
                  style={{
                    padding: 'clamp(16px, 2vw, 22px)',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      style={{
                        fontFamily: "'Inter Tight', sans-serif",
                        fontWeight: 600,
                        fontSize: '1rem',
                        color: TEXT_PRIMARY,
                        lineHeight: 1.25,
                        letterSpacing: '-0.01em',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {project.title}
                    </h3>
                    <ArrowUpRight
                      size={16}
                      style={{
                        color: TEXT_TERTIARY,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                  </div>

                  {project.description ? (
                    <p
                      className="mt-2"
                      style={{
                        fontSize: '0.82rem',
                        lineHeight: 1.55,
                        color: TEXT_SECONDARY,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {project.description}
                    </p>
                  ) : null}

                  {project.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontFamily: "'Inter Tight', sans-serif",
                            fontSize: '0.68rem',
                            fontWeight: 500,
                            color: TEXT_SECONDARY,
                            backgroundColor: BG_SURFACE,
                            padding: '3px 9px',
                            borderRadius: 6,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 4 ? (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: TEXT_TERTIARY,
                            alignSelf: 'center',
                          }}
                        >
                          +{project.tags.length - 4}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            </ClickableProject>
          )
        })
      }

      case 'contact': {
        const showForm = contact_form_enabled && isPremium && !!slug && !isPreview
        if (showForm) {
          return (
            <div key="contact" className="col-span-2 sm:col-span-4 md:col-span-4" style={{ padding: 'clamp(16px, 2vw, 24px)' }}>
              <ContactFormWidget
                slug={slug as string}
                primaryColor={primary_color}
                title={contact_form_title ?? 'Me contacter'}
                description={contact_form_description ?? ''}
                textColor="#1A1A1A"
                surfaceColor="#FFFFFF"
              />
            </div>
          )
        }
        if (!contact_email) return null
        return (
          <div
            key="contact"
            className="col-span-2 sm:col-span-4 md:col-span-4"
            style={{
              borderRadius: 18,
              backgroundColor: TEXT_PRIMARY,
              padding: 'clamp(24px, 3vw, 36px)',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <p
              style={{
                ...CARD_LABEL_STYLE,
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              Travaillons ensemble
            </p>
            <h2
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                maxWidth: 540,
              }}
            >
              Un projet en tête ? Parlons-en.
            </h2>
            <a
              href={`mailto:${contact_email}`}
              style={{
                marginTop: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 20px',
                borderRadius: 999,
                backgroundColor: '#FFFFFF',
                color: TEXT_PRIMARY,
                fontFamily: "'Inter Tight', sans-serif",
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Mail size={15} />
              {contact_email}
            </a>
          </div>
        )
      }

      case 'kpis': {
        if (kpis.length === 0) return null
        return (
          <div
            key="kpis"
            className="col-span-2 sm:col-span-4 md:col-span-4"
            style={{
              ...CARD_BASE,
              padding: 'clamp(18px, 2.5vw, 24px)',
            }}
          >
            <p style={CARD_LABEL_STYLE}>Chiffres clés</p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {kpis.map((kpi) => (
                <KpiRenderer key={kpi.id} kpi={kpi} primaryColor={primary_color} />
              ))}
            </div>
          </div>
        )
      }

      default: {
        if (section.id.startsWith('layout-')) {
          const blockId = section.id.replace('layout-', '')
          const block = layoutBlocks.find((b) => b.id === blockId)
          if (!block) return null
          return (
            <div
              key={section.id}
              className="col-span-2 sm:col-span-4 md:col-span-4"
              style={{
                ...CARD_BASE,
                padding: 'clamp(18px, 2.5vw, 24px)',
              }}
            >
              <LayoutBlockRenderer block={block} primaryColor={primary_color} />
            </div>
          )
        }

        if (section.id.startsWith('custom-')) {
          const blockId = section.id.replace('custom-', '')
          const block = customBlocks.find((b) => b.id === blockId)
          if (!block) return null
          return (
            <div
              key={section.id}
              className="col-span-2 sm:col-span-4 md:col-span-4"
              style={{
                ...CARD_BASE,
                padding: 'clamp(18px, 2.5vw, 24px)',
              }}
            >
              {block.title ? (
                <h2
                  style={{
                    fontFamily: "'Inter Tight', sans-serif",
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    color: TEXT_PRIMARY,
                    letterSpacing: '-0.01em',
                    marginBottom: 4,
                  }}
                >
                  {block.title}
                </h2>
              ) : null}
              {block.subtitle ? (
                <p style={{ fontSize: '0.85rem', color: TEXT_TERTIARY, marginBottom: 12 }}>
                  {block.subtitle}
                </p>
              ) : null}
              {block.content ? (
                <div
                  style={{
                    fontSize: '0.9rem',
                    lineHeight: 1.65,
                    color: TEXT_SECONDARY,
                  }}
                  className="[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_p]:my-1 [&_b]:font-bold [&_i]:italic"
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              ) : null}
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
        href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          fontFamily: "'Inter Tight', sans-serif",
          backgroundColor: BG_SURFACE,
          color: TEXT_PRIMARY,
          minHeight: '100vh',
        }}
      >
        <div className="mx-auto max-w-5xl px-3 py-6 sm:px-5 sm:py-8 md:px-6 md:py-10">
          {/* Bento grid: 2 cols on mobile, 4 cols from sm+ */}
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5 md:gap-4"
            style={{ gridAutoFlow: 'dense' }}
          >
            {visibleSections.map((section) => (
              <Fragment key={section.id}>
                {renderSection(section)}
              </Fragment>
            ))}
          </div>

          {/* Footer */}
          <TemplateFooter
            isPremium={isPremium}
            primaryColor={primary_color}
            className="mt-6 px-1"
            style={{
              borderTop: 'none',
              fontFamily: "'Inter Tight', sans-serif",
            }}
            containerClassName="flex items-center justify-between"
            yearStyle={{
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: '0.7rem',
              fontWeight: 500,
              color: TEXT_TERTIARY,
            }}
            badgeStyle={{
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: '0.7rem',
              fontWeight: 500,
              color: TEXT_TERTIARY,
            }}
          >
            <p
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                fontSize: '0.7rem',
                fontWeight: 500,
                color: TEXT_TERTIARY,
              }}
            >
              © {new Date().getFullYear()} {title}
            </p>
          </TemplateFooter>
        </div>
      </div>
    </>
  )
}
