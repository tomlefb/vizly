import Image from 'next/image'
import type { TemplateProps } from '@/types'
import { type SectionBlock } from '@/types/sections'
import { sanitizeHtml } from '@/lib/sanitize'
import { ClickableProject } from './ClickableProject'
import { KpiRenderer } from './KpiRenderer'
import { LayoutBlockRenderer } from './LayoutBlockRenderer'
import { TemplateFooter } from './TemplateFooter'
import { ContactFormWidget } from './ContactFormWidget'
import { SOCIAL_ICONS, getVisibleSections, getSortedProjects, getSocialEntries, isLightColor, getTemplatePalette } from './shared'
import { Mail } from 'lucide-react'

export function TemplateDark({ portfolio, projects, skills, sections, customBlocks, kpis, layoutBlocks, isPremium, isPreview }: TemplateProps) {
  const {
    title,
    bio,
    photo_url,
    primary_color,
    secondary_color,
    body_color,
    background_color,
    social_links,
    contact_email,
    contact_form_enabled,
    contact_form_title,
    contact_form_description,
    slug,
  } = portfolio

  // Dark template's identity is a dark theme. A light background_color would
  // kill the neon glows and the whole visual premise — so we ignore light
  // picks and keep the template dark. A user who truly wants a dark custom
  // hue (navy, plum, etc.) still gets it.
  const pickedBgIsDark = background_color && !isLightColor(background_color)
  const bgColor = pickedBgIsDark ? background_color! : '#0A0A0F'
  const p = getTemplatePalette(
    primary_color,
    secondary_color ?? '#F0F0F5',
    body_color ?? secondary_color ?? '#C8C8D0',
    bgColor,
  )
  const surfaceColor = p.surface

  const sortedProjects = getSortedProjects(projects)
  const visibleSections = getVisibleSections(sections)

  // Glow shadow from primary color
  const glowSm = `0 0 12px ${primary_color}40`
  const glowMd = `0 0 20px ${primary_color}50, 0 0 40px ${primary_color}20`
  const glowBorder = `0 0 0 1px ${primary_color}30`

  function renderSection(section: SectionBlock) {
    switch (section.id) {
      case 'hero':
        return (
          <header key="hero" className="px-6 pt-16 pb-10 md:px-10 md:pt-28 md:pb-14">
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
                      color: p.title,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {title}
                  </h1>
                </div>
              </div>
            </div>
          </header>
        )

      case 'bio':
        if (!bio) return null
        return (
          <section key="bio" className="px-6 md:px-10">
            <div className="mx-auto max-w-4xl">
              <p
                className="max-w-lg"
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  color: p.body,
                }}
              >
                {bio}
              </p>
            </div>
          </section>
        )

      case 'socials': {
        const socialEntries = getSocialEntries(social_links)
        if (socialEntries.length === 0 && !contact_email) return null
        return (
          <section key="socials" className="px-6 py-6 md:px-10">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
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
                })}
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
          </section>
        )
      }

      case 'projects':
        return (
          <section key="projects" className="px-6 py-12 md:px-10 md:py-16">
            <div className="mx-auto max-w-4xl">
              {/* Separator */}
              <div
                style={{
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${primary_color}30, transparent)`,
                  marginBottom: 40,
                }}
              />

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
                <div className={`grid grid-cols-1 gap-5 ${sortedProjects.length === 1 ? 'max-w-2xl' : 'md:grid-cols-2'}`}>
                  {sortedProjects.map((project, index) => {
                    const isLastOdd =
                      sortedProjects.length > 1 &&
                      sortedProjects.length % 2 === 1 &&
                      index === sortedProjects.length - 1
                    return (
                    <ClickableProject
                      key={project.id}
                      project={project}
                      primaryColor={primary_color}
                      dark
                      className={isLastOdd ? 'md:col-span-2' : undefined}
                    >
                      <article
                        className="group overflow-hidden transition-all duration-300 h-full hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                        style={{
                          backgroundColor: p.surface,
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
                              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
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
                                right: project.images.length > 1 ? 'auto' : 14,
                                left: project.images.length > 1 ? 14 : 'auto',
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.7rem',
                                color: `${primary_color}80`,
                                letterSpacing: '0.05em',
                              }}
                            >
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            {project.images.length > 1 && (
                              <span style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
                                +{project.images.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              aspectRatio: '16/9',
                              backgroundColor: p.surfaceWarm,
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
                          <h3
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 600,
                              fontSize: '1rem',
                              color: p.title,
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {project.title}
                          </h3>

                          {project.description ? (
                            <p
                              className="mt-2.5"
                              style={{
                                fontSize: '0.88rem',
                                lineHeight: 1.6,
                                color: p.muted,
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
                              {project.tags.slice(0, 5).map((tag) => (
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
                              {project.tags.length > 5 && (
                                <span style={{ fontSize: '0.7rem', color: p.meta }}>+{project.tags.length - 5}</span>
                              )}
                            </div>
                          ) : null}

                          <p style={{ marginTop: 12, fontSize: '0.75rem', color: primary_color, fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" }}>
                            Voir le detail &rarr;
                          </p>
                        </div>
                      </article>
                    </ClickableProject>
                    )
                  })}
                </div>
              ) : (
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.85rem',
                    color: p.meta,
                  }}
                >
                  <span style={{ color: primary_color }}>{'> '}</span>
                  Aucun projet pour le moment...
                </p>
              )}
            </div>
          </section>
        )

      case 'skills':
        if (skills.length === 0) return null
        return (
          <section key="skills" className="px-6 py-12 md:px-10">
            <div className="mx-auto max-w-4xl">
              <div
                style={{
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${primary_color}20, transparent)`,
                  marginBottom: 32,
                }}
              />
              <h2
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  color: primary_color,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
                className="mb-6"
              >
                <span style={{ opacity: 0.4 }}>{'> '}</span>
                competences
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: p.body,
                      backgroundColor: p.surfaceWarm,
                      padding: '6px 14px',
                      borderRadius: 6,
                      border: `1px solid ${primary_color}20`,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )

      case 'contact': {
        const showForm = isPremium && !!slug
        if (showForm) {
          return (
            <section key="contact" className="px-6 py-12 md:px-10">
              <div className="mx-auto max-w-4xl">
                <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${primary_color}20, transparent)`, marginBottom: 32 }} />
                <ContactFormWidget
                  slug={slug as string}
                  primaryColor={primary_color}
                  title={contact_form_title ?? 'Me contacter'}
                  description={contact_form_description ?? ''}
                  isPreview={isPreview}
                  textColor={p.body}
                  headingColor={p.heading}
                  surfaceColor={surfaceColor}
                  variant="dark"
                />
              </div>
            </section>
          )
        }
        if (!contact_email) return null
        return (
          <section key="contact" className="px-6 py-12 md:px-10">
            <div className="mx-auto max-w-4xl">
              <div
                style={{
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${primary_color}20, transparent)`,
                  marginBottom: 32,
                }}
              />
              <div className="text-center">
                <h2
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    color: p.title,
                    letterSpacing: '-0.01em',
                  }}
                  className="mb-3"
                >
                  Me contacter
                </h2>
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.82rem',
                    color: p.meta,
                  }}
                  className="mb-6"
                >
                  <span style={{ color: primary_color }}>{'> '}</span>
                  Interesse par mon profil ? Ecrivez-moi.
                </p>
                <a
                  href={`mailto:${contact_email}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 28px',
                    borderRadius: 8,
                    backgroundColor: primary_color,
                    color: '#0A0A0F',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: glowSm,
                  }}
                >
                  <Mail size={16} />
                  {contact_email}
                </a>
              </div>
            </div>
          </section>
        )
      }

      case 'kpis':
        if (kpis.length === 0) return null
        return (
          <section key="kpis" className="px-6 py-12 md:px-10">
            <div className="mx-auto max-w-4xl">
              <div
                style={{
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${primary_color}20, transparent)`,
                  marginBottom: 32,
                }}
              />
              <h2
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  color: primary_color,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
                className="mb-6"
              >
                <span style={{ opacity: 0.4 }}>{'> '}</span>
                chiffres cles
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {kpis.map((kpi) => (
                  <KpiRenderer key={kpi.id} kpi={kpi} primaryColor={primary_color} dark />
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
            <section key={section.id} className="px-6 py-12 md:px-10">
              <div className="mx-auto max-w-4xl">
                <div
                  style={{
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${primary_color}20, transparent)`,
                    marginBottom: 32,
                  }}
                />
                <LayoutBlockRenderer block={block} primaryColor={primary_color} dark />
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
            <section key={section.id} className="px-6 py-12 md:px-10">
              <div className="mx-auto max-w-4xl">
                <div
                  style={{
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${primary_color}20, transparent)`,
                    marginBottom: 32,
                  }}
                />
                {block.title && (
                  <h2
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      color: primary_color,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                    className="mb-2"
                  >
                    <span style={{ opacity: 0.4 }}>{'> '}</span>
                    {block.title}
                  </h2>
                )}
                {block.subtitle && (
                  <p style={{ fontSize: '0.85rem', color: p.meta, fontFamily: "'JetBrains Mono', monospace", marginBottom: 16 }}>{block.subtitle}</p>
                )}
                {block.content && (
                  <div
                    style={{ fontSize: '0.92rem', lineHeight: 1.7, color: p.body }}
                    className="[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-[#E8E8F0] [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-[#C8C8D0] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_p]:my-1 [&_b]:font-bold [&_i]:italic"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
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
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          backgroundColor: bgColor,
          color: p.body,
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
          {visibleSections.map(renderSection)}

          {/* Footer */}
          <TemplateFooter
            isPremium={isPremium}
            primaryColor={primary_color}
            className="px-6 py-8 md:px-10"
            style={{
              borderTop: 'none',
            }}
            containerClassName="mx-auto max-w-4xl flex items-center justify-between"
            yearStyle={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.7rem',
              color: p.meta,
            }}
            badgeStyle={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.7rem',
              color: p.meta,
            }}
          />
        </div>
      </div>
    </>
  )
}
