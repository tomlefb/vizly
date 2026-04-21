import Image from 'next/image'
import type { TemplateProps } from '@/types'
import type { SectionBlock } from '@/types/sections'
import { ClickableProject } from './ClickableProject'
import { KpiRenderer } from './KpiRenderer'
import { LayoutBlockRenderer } from './LayoutBlockRenderer'
import { TemplateFooter } from './TemplateFooter'
import { ContactFormWidget } from './ContactFormWidget'
import { SOCIAL_ICONS, getVisibleSections, getSortedProjects, getSocialEntries, getTemplatePalette } from './shared'
import { Mail } from 'lucide-react'

export function TemplateElegant({
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
    body_color,
    background_color,
    social_links,
    contact_email,
    contact_form_enabled,
    contact_form_title,
    contact_form_description,
    slug,
  } = portfolio

  const userPickedBg = background_color && background_color.toUpperCase() !== '#FFFFFF'
  const bgColor = userPickedBg ? background_color! : '#FAF9F6'
  const p = getTemplatePalette(
    primary_color,
    secondary_color ?? '#1A1A1A',
    body_color ?? secondary_color ?? '#1A1A1A',
    bgColor,
  )
  const textColor = p.body

  const sortedProjects = getSortedProjects(projects)
  const visibleSections = getVisibleSections(sections)

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
                  color: p.title,
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
                  color: p.muted,
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
        const socialEntries = getSocialEntries(social_links)
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
                        color: p.meta,
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
                  color: p.meta,
                  textAlign: 'center',
                  marginBottom: 60,
                }}
              >
                Portfolio
              </h2>
            </div>

            {sortedProjects.length > 0 ? (
              <div className={`flex flex-col ${sortedProjects.length === 1 ? 'max-w-2xl mx-auto' : ''}`}>
                {sortedProjects.map((project) => (
                  <ClickableProject key={project.id} project={project} primaryColor={primary_color}>
                    <article
                      className="group px-6 md:px-16 lg:px-24"
                      style={{
                        paddingTop: 48,
                        paddingBottom: 60,
                      }}
                    >
                      <div className="mx-auto max-w-4xl">
                        {/* Project image -- large, clean */}
                        {project.images[0] ? (
                          <div
                            className="relative overflow-hidden"
                            style={{
                              aspectRatio: '3/2',
                              borderRadius: 2,
                              marginBottom: 32,
                            }}
                          >
                            <Image
                              src={project.images[0]}
                              alt={project.title}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                              sizes="(max-width: 768px) 100vw, 800px"
                            />
                            {project.images.length > 1 && (
                              <span style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
                                +{project.images.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div
                            className="relative flex items-center justify-center"
                            style={{
                              aspectRatio: '3/2',
                              borderRadius: 2,
                              marginBottom: 32,
                              backgroundColor: '#F2EFE8',
                              border: '1px solid #E8E4D9',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: '4rem',
                                fontWeight: 300,
                                fontStyle: 'italic',
                                color: p.meta,
                                letterSpacing: '0.05em',
                              }}
                            >
                              {project.title.charAt(0)}
                            </span>
                          </div>
                        )}

                        {/* Title */}
                        <h3
                          style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontWeight: 500,
                            fontStyle: 'italic',
                            fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
                            color: p.title,
                            lineHeight: 1.3,
                            letterSpacing: '0.01em',
                          }}
                        >
                          {project.title}
                        </h3>

                        {project.description ? (
                          <p
                            className="mt-4 max-w-2xl"
                            style={{
                              fontSize: '0.88rem',
                              lineHeight: 1.85,
                              color: p.muted,
                              fontWeight: 300,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {project.description}
                          </p>
                        ) : null}

                        {/* Tags -- minimal, uppercase, almost invisible */}
                        {project.tags.length > 0 ? (
                          <div className="mt-5 flex flex-wrap gap-4">
                            {project.tags.slice(0, 5).map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 500,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.2em',
                                  color: p.meta,
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                            {project.tags.length > 5 && (
                              <span style={{ fontSize: '0.62rem', color: p.meta, letterSpacing: '0.1em' }}>+{project.tags.length - 5}</span>
                            )}
                          </div>
                        ) : null}

                        <p style={{ marginTop: 20, fontSize: '0.78rem', color: primary_color, fontWeight: 400, fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.02em' }}>
                          Voir le detail &rarr;
                        </p>

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
                  </ClickableProject>
                ))}
              </div>
            ) : (
              <div className="px-6 md:px-16 lg:px-24">
                <p
                  className="mx-auto max-w-4xl text-center"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    color: p.meta,
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
                  color: p.meta,
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
                      color: p.muted,
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

      case 'contact': {
        const showForm = isPremium && !!slug
        if (showForm) {
          return (
            <section key="contact" className="px-6 py-16 md:px-16 lg:px-24">
              <div className="mx-auto max-w-3xl">
                <ContactFormWidget
                  slug={slug as string}
                  primaryColor={primary_color}
                  title={contact_form_title ?? 'Me contacter'}
                  description={contact_form_description ?? ''}
                  isPreview={isPreview}
                  textColor={p.body}
                  headingColor={p.heading}
                  surfaceColor={bgColor}
                  variant="elegant"
                />
              </div>
            </section>
          )
        }
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
                  color: p.title,
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
                  color: p.meta,
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
      }

      case 'kpis':
        if (kpis.length === 0) return null
        return (
          <section key="kpis" className="px-6 py-12 md:px-16 lg:px-24" style={{ textAlign: 'center' }}>
            <div className="mx-auto max-w-4xl">
              <h2
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: 300,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  color: p.meta,
                  marginBottom: 28,
                }}
              >
                Chiffres cles
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {kpis.map((kpi) => (
                  <KpiRenderer key={kpi.id} kpi={kpi} primaryColor={primary_color} />
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

      default: {
        // Layout blocks
        if (section.id.startsWith('layout-')) {
          const blockId = section.id.replace('layout-', '')
          const block = layoutBlocks.find((b) => b.id === blockId)
          if (!block) return null
          return (
            <section key={section.id} className="px-6 py-12 md:px-16 lg:px-24">
              <div className="mx-auto max-w-4xl">
                <LayoutBlockRenderer block={block} primaryColor={primary_color} />
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
        }

        // Custom blocks
        if (section.id.startsWith('custom-')) {
          const blockId = section.id.replace('custom-', '')
          const block = customBlocks.find((b) => b.id === blockId)
          if (!block) return null
          return (
            <section key={section.id} className="px-6 py-12 md:px-16 lg:px-24" style={{ textAlign: 'center' }}>
              <div className="mx-auto max-w-3xl">
                {block.title && (
                  <h2
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 300,
                      fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: p.title,
                      marginBottom: 8,
                    }}
                  >
                    {block.title}
                  </h2>
                )}
                {block.subtitle && (
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    fontSize: '1rem',
                    color: p.meta,
                    letterSpacing: '0.02em',
                    marginBottom: 20,
                  }}>
                    {block.subtitle}
                  </p>
                )}
                {block.content && (
                  <div
                    style={{ fontSize: '0.92rem', lineHeight: 1.85, color: p.muted, fontWeight: 300, textAlign: 'left' }}
                    className="mx-auto max-w-lg [&_h2]:text-xl [&_h2]:font-normal [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:tracking-wider [&_h2]:uppercase [&_h3]:text-lg [&_h3]:font-normal [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_p]:my-1 [&_b]:font-medium [&_i]:italic"
                    dangerouslySetInnerHTML={{ __html: block.content }}
                  />
                )}
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
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Raleway:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          fontFamily: "'Raleway', sans-serif",
          backgroundColor: bgColor,
          color: textColor,
          minHeight: '100vh',
        }}
      >
        {visibleSections.map(renderSection)}

        {/* Footer */}
        <TemplateFooter
          isPremium={isPremium}
          primaryColor={primary_color}
          className="px-6 py-16 md:px-16 md:py-20 lg:px-24"
          style={{ borderTop: 'none', textAlign: 'center' }}
          containerClassName="mx-auto max-w-4xl"
          badgeStyle={{
            display: 'inline-block',
            marginTop: 12,
            fontFamily: "'Raleway', sans-serif",
            fontSize: '0.65rem',
            fontWeight: 400,
            color: p.meta,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
          }}
        >
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
              color: p.meta,
              letterSpacing: '0.1em',
              fontWeight: 300,
            }}
          >
            {new Date().getFullYear()}
          </p>
        </TemplateFooter>
      </div>
    </>
  )
}
