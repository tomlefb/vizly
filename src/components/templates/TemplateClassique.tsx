import Image from 'next/image'
import type { TemplateProps } from '@/types'
import { type SectionBlock } from '@/types/sections'
import { sanitizeHtml } from '@/lib/sanitize'
import { ClickableProject } from './ClickableProject'
import { KpiRenderer } from './KpiRenderer'
import { LayoutBlockRenderer } from './LayoutBlockRenderer'
import { TemplateFooter } from './TemplateFooter'
import { ContactFormWidget } from './ContactFormWidget'
import { SOCIAL_ICONS, getVisibleSections, getSortedProjects, getSocialEntries, getTemplatePalette } from './shared'
import { Mail } from 'lucide-react'

export function TemplateClassique({ portfolio, projects, skills, sections, customBlocks, kpis, layoutBlocks, isPremium, isPreview }: TemplateProps) {
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
  const bgColor = userPickedBg ? background_color! : '#F7F7F5'
  const p = getTemplatePalette(
    primary_color,
    secondary_color ?? '#1A1A1A',
    body_color ?? secondary_color ?? '#1A1A1A',
    bgColor,
  )
  const textColor = p.body

  const sortedProjects = getSortedProjects(projects)
  const visibleSections = getVisibleSections(sections)

  // The Classique template has a sidebar layout on desktop.
  // We render the sidebar content from visible sections, and projects in main.
  // Sidebar sections: hero, bio, socials, skills, contact
  // Main section: projects

  function renderSidebarSection(section: SectionBlock) {
    switch (section.id) {
      case 'hero':
        return (
          <div key="hero">
            {/* Photo */}
            {photo_url ? (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  maxWidth: 200,
                  borderRadius: 6,
                  overflow: 'hidden',
                  margin: '0 auto',
                  border: `2px solid ${secondary_color}30`,
                }}
              >
                <Image
                  src={photo_url}
                  alt={`Photo de ${title}`}
                  width={200}
                  height={200}
                  className="object-cover"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            ) : null}

            {/* Name */}
            <h1
              style={{
                fontFamily: "'Merriweather', serif",
                fontWeight: 900,
                fontSize: '1.4rem',
                lineHeight: 1.3,
                color: p.title,
                marginTop: 20,
              }}
            >
              {title}
            </h1>

            {/* Accent line */}
            <div
              style={{
                width: 40,
                height: 3,
                backgroundColor: primary_color,
                marginTop: 12,
                borderRadius: 2,
              }}
            />
          </div>
        )

      case 'bio':
        if (!bio) return null
        return (
          <div key="bio">
            <p
              style={{
                fontSize: '0.88rem',
                lineHeight: 1.65,
                color: p.muted,
                marginTop: 16,
              }}
            >
              {bio}
            </p>
          </div>
        )

      case 'socials': {
        const hasSocials = social_links && Object.values(social_links).some(Boolean)
        if (!hasSocials) return null
        return (
          <div key="socials" style={{ marginTop: 24 }}>
            <h2
              style={{
                fontFamily: "'Merriweather', serif",
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: p.meta,
                marginBottom: 12,
              }}
            >
              En ligne
            </h2>
            <div className="flex flex-col gap-2">
              {social_links ? Object.entries(social_links).map(([platform, url]) => {
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.84rem',
                      color: p.body,
                      textDecoration: 'none',
                    }}
                  >
                    <IconComponent
                      size={14}
                      style={{ color: primary_color, flexShrink: 0 }}
                    />
                    <span>{config.label}</span>
                  </a>
                )
              }) : null}
            </div>
          </div>
        )
      }

      case 'skills':
        if (skills.length === 0) return null
        return (
          <div key="skills" style={{ marginTop: 24 }}>
            <h2
              style={{
                fontFamily: "'Merriweather', serif",
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: p.meta,
                marginBottom: 12,
              }}
            >
              Competences
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: primary_color,
                    backgroundColor: `${primary_color}0A`,
                    padding: '4px 10px',
                    borderRadius: 3,
                    border: `1px solid ${primary_color}18`,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )

      case 'contact': {
        // The full contact form renders at the bottom of the main column
        // (see renderMainContactForm below) — too cramped inside the 300px
        // sidebar. Here we only show the email summary.
        if (!contact_email) return null
        return (
          <div key="contact" style={{ marginTop: 28 }}>
            <h2
              style={{
                fontFamily: "'Merriweather', serif",
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: p.meta,
                marginBottom: 12,
              }}
            >
              Contact
            </h2>
            <a
              href={`mailto:${contact_email}`}
              aria-label="Envoyer un email"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.84rem',
                color: p.body,
                textDecoration: 'none',
                marginBottom: 8,
                wordBreak: 'break-all',
              }}
            >
              <Mail size={14} style={{ color: primary_color, flexShrink: 0 }} />
              <span>{contact_email}</span>
            </a>
          </div>
        )
      }

      case 'kpis':
        if (kpis.length === 0) return null
        return (
          <div key="kpis" style={{ marginTop: 24 }}>
            <h2
              style={{
                fontFamily: "'Merriweather', serif",
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: p.meta,
                marginBottom: 12,
              }}
            >
              Chiffres cles
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {kpis.map((kpi) => (
                <KpiRenderer key={kpi.id} kpi={kpi} primaryColor={primary_color} />
              ))}
            </div>
          </div>
        )

      case 'projects':
        // Projects are rendered in the main column, not sidebar
        return null

      default: {
        // Layout blocks in sidebar
        if (section.id.startsWith('layout-')) {
          const blockId = section.id.replace('layout-', '')
          const block = layoutBlocks.find((b) => b.id === blockId)
          if (!block) return null
          return (
            <div key={section.id} style={{ marginTop: 24 }}>
              <LayoutBlockRenderer block={block} primaryColor={primary_color} />
            </div>
          )
        }

        // Custom blocks in sidebar
        if (section.id.startsWith('custom-')) {
          const blockId = section.id.replace('custom-', '')
          const block = customBlocks.find((b) => b.id === blockId)
          if (!block) return null
          return (
            <div key={section.id} style={{ marginTop: 24 }}>
              {block.title && (
                <h2
                  style={{
                    fontFamily: "'Merriweather', serif",
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: p.meta,
                    marginBottom: 12,
                  }}
                >
                  {block.title}
                </h2>
              )}
              {block.subtitle && (
                <p style={{ fontSize: '0.82rem', color: p.meta, marginBottom: 8 }}>{block.subtitle}</p>
              )}
              {block.content && (
                <div
                  style={{ fontSize: '0.84rem', lineHeight: 1.65, color: p.muted }}
                  className="[&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-2 [&_p]:my-1 [&_b]:font-bold [&_i]:italic"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
                />
              )}
            </div>
          )
        }
        return null
      }
    }
  }

  function renderMobileSection(section: SectionBlock) {
    switch (section.id) {
      case 'hero':
        return (
          <div key="hero" className="flex flex-col items-center gap-5">
            {photo_url ? (
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: `2px solid ${secondary_color}40`,
                }}
              >
                <Image
                  src={photo_url}
                  alt={`Photo de ${title}`}
                  width={100}
                  height={100}
                  className="object-cover"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            ) : null}

            <div className="text-center">
              <h1
                style={{
                  fontFamily: "'Merriweather', serif",
                  fontWeight: 900,
                  fontSize: '1.6rem',
                  lineHeight: 1.25,
                  color: p.title,
                }}
              >
                {title}
              </h1>
            </div>
          </div>
        )

      case 'bio':
        if (!bio) return null
        return (
          <div key="bio">
            <p
              className="mt-3"
              style={{
                fontSize: '0.95rem',
                lineHeight: 1.65,
                color: p.muted,
                maxWidth: 420,
                margin: '12px auto 0',
                textAlign: 'center',
              }}
            >
              {bio}
            </p>
          </div>
        )

      case 'socials': {
        const socialEntries = getSocialEntries(social_links)
        if (socialEntries.length === 0) return null
        return (
          <div key="socials" className="mt-4 flex flex-wrap items-center justify-center gap-3">
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
                    fontSize: '0.82rem',
                    color: p.muted,
                    textDecoration: 'none',
                  }}
                >
                  <IconComponent size={15} />
                  <span>{config.label}</span>
                </a>
              )
            })}
          </div>
        )
      }

      case 'skills':
        if (skills.length === 0) return null
        return (
          <div key="skills" className="mt-5">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: primary_color,
                    backgroundColor: `${primary_color}0A`,
                    padding: '4px 10px',
                    borderRadius: 3,
                    border: `1px solid ${primary_color}18`,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )

      case 'contact': {
        // Mobile header: hide the email if the full form renders below in main.
        if (isPremium && !!slug && !!contact_form_enabled) return null
        if (!contact_email) return null
        return (
          <div key="contact" className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <a
              href={`mailto:${contact_email}`}
              aria-label="Envoyer un email"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.82rem',
                color: primary_color,
                textDecoration: 'none',
              }}
            >
              <Mail size={14} />
              <span>{contact_email}</span>
            </a>
          </div>
        )
      }

      case 'kpis':
        if (kpis.length === 0) return null
        return (
          <div key="kpis" className="mt-5">
            <h2
              style={{
                fontFamily: "'Merriweather', serif",
                fontWeight: 700,
                fontSize: '1rem',
                color: p.title,
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              Chiffres cles
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {kpis.map((kpi) => (
                <KpiRenderer key={kpi.id} kpi={kpi} primaryColor={primary_color} />
              ))}
            </div>
          </div>
        )

      case 'projects':
        return null

      default: {
        // Layout blocks in mobile view
        if (section.id.startsWith('layout-')) {
          const blockId = section.id.replace('layout-', '')
          const block = layoutBlocks.find((b) => b.id === blockId)
          if (!block) return null
          return (
            <div key={section.id} className="mt-5">
              <LayoutBlockRenderer block={block} primaryColor={primary_color} />
            </div>
          )
        }

        // Custom blocks in mobile view
        if (section.id.startsWith('custom-')) {
          const blockId = section.id.replace('custom-', '')
          const block = customBlocks.find((b) => b.id === blockId)
          if (!block) return null
          return (
            <div key={section.id} className="mt-5">
              {block.title && (
                <h2
                  style={{
                    fontFamily: "'Merriweather', serif",
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: p.title,
                    textAlign: 'center',
                    marginBottom: 8,
                  }}
                >
                  {block.title}
                </h2>
              )}
              {block.subtitle && (
                <p style={{ fontSize: '0.88rem', color: p.meta, textAlign: 'center', marginBottom: 8 }}>{block.subtitle}</p>
              )}
              {block.content && (
                <div
                  style={{ fontSize: '0.88rem', lineHeight: 1.65, color: p.muted, maxWidth: 420, margin: '0 auto', textAlign: 'center' }}
                  className="[&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:text-left [&_p]:my-1 [&_b]:font-bold [&_i]:italic"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
                />
              )}
            </div>
          )
        }
        return null
      }
    }
  }

  // Check if projects section is visible
  const projectsVisible = visibleSections.some((s) => s.id === 'projects')
  const contactVisible = visibleSections.some((s) => s.id === 'contact')
  const showContactForm = contactVisible && isPremium && !!slug && !!contact_form_enabled
  const mainVisible = projectsVisible || showContactForm

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Merriweather:wght@400;700;900&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          fontFamily: "'Lato', sans-serif",
          backgroundColor: bgColor,
          color: textColor,
          minHeight: '100vh',
        }}
      >
        {/* Mobile header (visible only on small screens) */}
        <div className="block lg:hidden">
          <header
            className="px-6 py-10"
            style={{
              backgroundColor: p.surface,
              borderBottom: `3px solid ${primary_color}`,
            }}
          >
            <div className="mx-auto max-w-2xl">
              {visibleSections.filter((s) => s.id !== 'projects').map(renderMobileSection)}
            </div>
          </header>
        </div>

        {/* Desktop layout: sidebar + main */}
        <div className="lg:flex lg:min-h-screen">
          {/* Sidebar (desktop only) */}
          <aside
            className="hidden lg:block lg:w-[300px] lg:shrink-0"
            style={{
              backgroundColor: p.surface,
              borderRight: `1px solid #E5E5E0`,
              alignSelf: 'stretch',
            }}
          >
            <div className="px-7 py-10">
              {visibleSections.filter((s) => s.id !== 'projects').map(renderSidebarSection)}

              {/* Badge in sidebar */}
              {!isPremium ? (
                <div style={{ marginTop: 40, paddingTop: 16, borderTop: `1px solid ${p.borderLight}` }}>
                  <a
                    href="https://vizly.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.72rem',
                      color: p.meta,
                      textDecoration: 'none',
                    }}
                  >
                    Fait avec{' '}
                    <span style={{ fontWeight: 700, color: primary_color }}>
                      Vizly
                    </span>
                  </a>
                </div>
              ) : null}
            </div>
          </aside>

          {/* Main content */}
          {mainVisible ? (
            <main className="flex-1 px-6 py-10 lg:px-12 lg:py-14">
              <div className="mx-auto max-w-3xl">
                {projectsVisible ? (
                  <>
                <h2
                  style={{
                    fontFamily: "'Merriweather', serif",
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    color: p.title,
                    marginBottom: 32,
                    paddingBottom: 10,
                    borderBottom: `2px solid ${primary_color}`,
                    display: 'inline-block',
                  }}
                >
                  Projets
                </h2>

                {sortedProjects.length > 0 ? (
                  <div className="flex flex-col gap-10">
                    {sortedProjects.map((project, index) => (
                      <ClickableProject key={project.id} project={project} primaryColor={primary_color}>
                        <article
                          className="group"
                          style={{
                            paddingBottom: index < sortedProjects.length - 1 ? 40 : 0,
                            borderBottom:
                              index < sortedProjects.length - 1
                                ? '1px solid #E8E8E3'
                                : 'none',
                          }}
                        >
                          {/* Project image (wide) */}
                          {project.images[0] ? (
                            <div
                              className="relative mb-5 overflow-hidden"
                              style={{
                                aspectRatio: '16/8',
                                borderRadius: 4,
                                border: `1px solid ${p.borderLight}`,
                              }}
                            >
                              <Image
                                src={project.images[0]}
                                alt={project.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                sizes="(max-width: 1024px) 100vw, 700px"
                              />
                              {project.images.length > 1 && (
                                <span style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
                                  +{project.images.length - 1}
                                </span>
                              )}
                            </div>
                          ) : null}

                          {/* Title row */}
                          <h3
                            style={{
                              fontFamily: "'Merriweather', serif",
                              fontWeight: 700,
                              fontSize: '1.1rem',
                              color: p.title,
                              lineHeight: 1.35,
                            }}
                          >
                            {project.title}
                          </h3>

                          {/* Description */}
                          {project.description ? (
                            <p
                              className="mt-3"
                              style={{
                                fontSize: '0.92rem',
                                lineHeight: 1.7,
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
                                    fontSize: '0.73rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    color: primary_color,
                                    backgroundColor: `${primary_color}0A`,
                                    padding: '4px 10px',
                                    borderRadius: 3,
                                    border: `1px solid ${primary_color}18`,
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                              {project.tags.length > 5 && (
                                <span style={{ fontSize: '0.73rem', color: p.meta }}>+{project.tags.length - 5}</span>
                              )}
                            </div>
                          ) : null}

                          <p style={{ marginTop: 12, fontSize: '0.78rem', color: primary_color, fontWeight: 600 }}>
                            Voir le détail &rarr;
                          </p>
                        </article>
                      </ClickableProject>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: p.meta, fontSize: '0.92rem' }}>
                    Aucun projet pour le moment.
                  </p>
                )}
                  </>
                ) : null}

                {showContactForm ? (
                  <div style={{ marginTop: projectsVisible ? 56 : 0 }}>
                    <ContactFormWidget
                      slug={slug as string}
                      primaryColor={primary_color}
                      title={contact_form_title ?? 'Me contacter'}
                      description={contact_form_description ?? ''}
                      isPreview={isPreview}
                      textColor={p.body}
                      headingColor={p.heading}
                      surfaceColor={p.surface}
                      variant="classique"
                    />
                  </div>
                ) : null}
              </div>
            </main>
          ) : null}
        </div>

        {/* Mobile footer badge */}
        <TemplateFooter
          isPremium={isPremium}
          primaryColor={primary_color}
          className="block px-6 py-6 text-center lg:hidden"
          style={{ borderTop: `1px solid ${p.borderLight}` }}
          containerClassName="flex items-center justify-center"
          badgeStyle={{
            fontSize: '0.75rem',
            color: p.meta,
          }}
        >
          {/* No year text in mobile footer — badge only */}
          <span />
        </TemplateFooter>
      </div>
    </>
  )
}
