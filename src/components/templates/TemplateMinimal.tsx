import Image from 'next/image'
import type { TemplateProps } from '@/types'
import type { SectionBlock } from '@/types/sections'
import { ClickableProject } from './ClickableProject'
import { KpiRenderer } from './KpiRenderer'
import { LayoutBlockRenderer } from './LayoutBlockRenderer'
import { TemplateFooter } from './TemplateFooter'
import { ContactFormWidget } from './ContactFormWidget'
import {
  SOCIAL_ICONS,
  getVisibleSections,
  getSortedProjects,
  getSocialEntries,
  getTemplatePalette,
} from './shared'
import { Mail } from 'lucide-react'

export function TemplateMinimal({ portfolio, projects, skills, sections, customBlocks, kpis, layoutBlocks, isPremium, isPreview }: TemplateProps) {
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

  const userBg = background_color && background_color.toUpperCase() !== '#FFFFFF'
    ? background_color
    : '#FAFAFA'
  const p = getTemplatePalette(
    primary_color,
    secondary_color ?? '#1A1A1A',
    body_color ?? secondary_color ?? '#1A1A1A',
    userBg,
  )

  const sortedProjects = getSortedProjects(projects)
  const visibleSections = getVisibleSections(sections)

  const h2Style = {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 600,
    fontSize: '1.35rem',
    color: p.title,
    letterSpacing: '-0.01em',
  } as const

  function renderSection(section: SectionBlock) {
    switch (section.id) {
      case 'hero':
        return (
          <header key="hero" style={{ borderBottom: `1px solid ${p.borderLight}` }} className="px-6 pt-16 pb-12 md:pt-24 md:pb-16">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10">
                {photo_url ? (
                  <div className="shrink-0 overflow-hidden" style={{ width: 96, height: 96, borderRadius: '50%', border: `3px solid ${primary_color}` }}>
                    <Image src={photo_url} alt={`Photo de ${title}`} width={96} height={96} className="object-cover" style={{ width: '100%', height: '100%' }} />
                  </div>
                ) : null}
                <div className="text-center md:text-left">
                  <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', lineHeight: 1.15, color: p.title, letterSpacing: '-0.02em' }}>
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
          <section key="bio" className="px-6 py-8">
            <div className="mx-auto max-w-4xl">
              <p style={{ fontSize: '1.05rem', lineHeight: 1.65, color: p.body }}>{bio}</p>
            </div>
          </section>
        )

      case 'socials': {
        const socialEntries = getSocialEntries(social_links)
        if (socialEntries.length === 0 && !contact_email) return null
        const pillStyle = {
          color: p.body,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          borderRadius: 8,
          border: `1px solid ${p.border}`,
          backgroundColor: p.surface,
          fontSize: '0.82rem',
          fontWeight: 500,
          textDecoration: 'none',
        } as const
        return (
          <section key="socials" className="px-6 py-6">
            <div className="mx-auto max-w-4xl flex flex-wrap items-center gap-2">
              {socialEntries.map(([platform, url]) => {
                const entry = SOCIAL_ICONS[platform]
                if (!entry || !url) return null
                const IconComponent = entry.icon
                const content = (
                  <>
                    <IconComponent size={15} />
                    <span>{entry.label}</span>
                  </>
                )
                return isPreview ? (
                  <span key={platform} aria-label={`Profil ${entry.label}`} style={pillStyle}>
                    {content}
                  </span>
                ) : (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Profil ${entry.label}`} style={pillStyle}>
                    {content}
                  </a>
                )
              })}
              {contact_email ? (
                isPreview ? (
                  <span aria-label="Email" style={pillStyle}>
                    <Mail size={15} />
                    <span>Email</span>
                  </span>
                ) : (
                  <a href={`mailto:${contact_email}`} aria-label="Envoyer un email" style={pillStyle}>
                    <Mail size={15} />
                    <span>Email</span>
                  </a>
                )
              ) : null}
            </div>
          </section>
        )
      }

      case 'projects':
        return (
          <section key="projects" className="px-6 py-12 md:py-16">
            <div className="mx-auto max-w-5xl">
              <h2 style={h2Style} className="mb-8">
                Projets
              </h2>
              {sortedProjects.length > 0 ? (
                <div className={`grid grid-cols-1 gap-6 ${sortedProjects.length === 1 ? 'sm:grid-cols-1 max-w-2xl' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {sortedProjects.map((project) => (
                    <ClickableProject key={project.id} project={project} primaryColor={primary_color}>
                      <article className="group overflow-hidden transition-all duration-250 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] h-full" style={{ backgroundColor: p.surface, borderRadius: 12, border: `1px solid ${p.borderLight}` }}>
                        {project.images[0] ? (
                          <div className="relative overflow-hidden" style={{ aspectRatio: '16/10' }}>
                            <Image src={project.images[0]} alt={project.title} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: primary_color, opacity: 0, transition: 'opacity 300ms ease-out' }} className="group-hover:opacity-100" />
                            {project.images.length > 1 && (
                              <span style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
                                +{project.images.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ aspectRatio: '16/10', backgroundColor: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 600, color: `${primary_color}30` }}>{project.title.charAt(0)}</span>
                          </div>
                        )}
                        <div className="p-5">
                          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '1.05rem', color: p.title }}>{project.title}</h3>
                          {project.description ? (
                            <p className="mt-2" style={{ fontSize: '0.9rem', lineHeight: 1.6, color: p.muted, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {project.description}
                            </p>
                          ) : null}
                          {project.tags.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {project.tags.slice(0, 5).map((tag) => (
                                <span key={tag} style={{ fontSize: '0.75rem', fontWeight: 500, color: primary_color, backgroundColor: `${primary_color}0C`, padding: '3px 10px', borderRadius: 6 }}>{tag}</span>
                              ))}
                              {project.tags.length > 5 && (
                                <span style={{ fontSize: '0.75rem', color: p.meta }}>+{project.tags.length - 5}</span>
                              )}
                            </div>
                          ) : null}
                          <p style={{ marginTop: 12, fontSize: '0.78rem', color: primary_color, fontWeight: 500 }}>
                            Voir le detail &rarr;
                          </p>
                        </div>
                      </article>
                    </ClickableProject>
                  ))}
                </div>
              ) : (
                <p style={{ color: p.meta, fontSize: '0.95rem' }}>Aucun projet pour le moment.</p>
              )}
            </div>
          </section>
        )

      case 'skills':
        if (skills.length === 0) return null
        return (
          <section key="skills" className="px-6 py-12" style={{ borderTop: `1px solid ${p.borderLight}` }}>
            <div className="mx-auto max-w-5xl">
              <h2 style={h2Style} className="mb-6">
                Competences
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} style={{ fontSize: '0.85rem', fontWeight: 500, color: p.body, backgroundColor: p.surfaceWarm, padding: '6px 14px', borderRadius: 8 }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )

      case 'contact': {
        const showForm = isPremium && !!slug && !!contact_form_enabled
        if (!showForm && !contact_email) return null
        return (
          <section key="contact" className="px-6 py-12" style={{ borderTop: `1px solid ${p.borderLight}` }}>
            {showForm ? (
              <ContactFormWidget
                slug={slug as string}
                primaryColor={primary_color}
                title={contact_form_title ?? 'Me contacter'}
                description={contact_form_description ?? ''}
                isPreview={isPreview}
                textColor={p.body}
                headingColor={p.heading}
                surfaceColor={p.surface}
                variant="minimal"
              />
            ) : (
              <div className="mx-auto max-w-4xl text-center">
                <h2 style={h2Style} className="mb-3">
                  Me contacter
                </h2>
                <p style={{ color: p.muted, fontSize: '0.95rem' }} className="mb-6">
                  Interesse par mon profil ? N&apos;hesite pas a me contacter.
                </p>
                {isPreview ? (
                  <span aria-label={contact_email ?? ''}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: primary_color, color: '#FFFFFF', padding: '12px 28px', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none' }}>
                    <Mail size={18} />
                    {contact_email}
                  </span>
                ) : (
                  <a href={`mailto:${contact_email}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: primary_color, color: '#FFFFFF', padding: '12px 28px', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none' }}>
                    <Mail size={18} />
                    {contact_email}
                  </a>
                )}
              </div>
            )}
          </section>
        )
      }

      case 'kpis':
        if (kpis.length === 0) return null
        return (
          <section key="kpis" className="px-6 py-12" style={{ borderTop: `1px solid ${p.borderLight}` }}>
            <div className="mx-auto max-w-5xl">
              <h2 style={h2Style} className="mb-6">
                Chiffres cles
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
            <section key={section.id} className="px-6 py-12" style={{ borderTop: `1px solid ${p.borderLight}` }}>
              <div className="mx-auto max-w-5xl">
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
            <section key={section.id} className="px-6 py-12" style={{ borderTop: `1px solid ${p.borderLight}` }}>
              <div className="mx-auto max-w-4xl">
                {block.title && (
                  <h2 style={h2Style} className="mb-2">
                    {block.title}
                  </h2>
                )}
                {block.subtitle && (
                  <p style={{ fontSize: '0.95rem', color: p.meta, marginBottom: 16 }}>{block.subtitle}</p>
                )}
                {block.content && (
                  <div
                    style={{ fontSize: '0.95rem', lineHeight: 1.7, color: p.body }}
                    className="[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_p]:my-1 [&_b]:font-bold [&_i]:italic"
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
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={{ fontFamily: "'Source Sans 3', sans-serif", backgroundColor: p.bg, color: p.body, minHeight: '100vh' }}>
        {visibleSections.map(renderSection)}

        <TemplateFooter isPremium={isPremium} primaryColor={primary_color} />
      </div>
    </>
  )
}
