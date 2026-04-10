'use client'

import { DEMO_COLORS } from '@/lib/demo-data'
import { DEFAULT_SECTIONS } from '@/types/sections'
import { TemplatePreview } from '@/components/shared/TemplatePreview'
import type { TemplateName } from '@/types/templates'
import type { TemplateProps } from '@/types'

/* ------------------------------------------------------------------ */
/*  Helper: build a full TemplateProps from minimal per-template data  */
/* ------------------------------------------------------------------ */

function makeProps(
  template: TemplateName,
  name: string,
  bio: string,
  projects: Array<{ title: string; tags: string[]; imgId: number }>,
  skills: string[],
): TemplateProps {
  const colors = DEMO_COLORS[template] ?? { primary: '#1A1A1A', secondary: '#F5F5F5' }
  return {
    portfolio: {
      title: name,
      bio,
      photo_url: null,
      primary_color: colors.primary,
      secondary_color: colors.secondary,
      font: 'default',
      font_body: 'default',
      social_links: { github: '#', linkedin: '#', dribbble: '#' },
      contact_email: null,
    },
    projects: projects.map((p, i) => ({
      id: `${template}-${i}`,
      title: p.title,
      description: null,
      images: [`https://picsum.photos/id/${p.imgId}/800/600`],
      external_link: null,
      tags: p.tags,
      display_order: i,
    })),
    skills,
    sections: DEFAULT_SECTIONS,
    customBlocks: [],
    kpis: [],
    layoutBlocks: [],
    isPremium: false,
  }
}

/* ------------------------------------------------------------------ */
/*  8 portfolios — one per template, realistic profiles + images      */
/* ------------------------------------------------------------------ */

interface WallEntry {
  template: TemplateName
  url: string
  props: TemplateProps
}

const ENTRIES: WallEntry[] = [
  {
    template: 'minimal',
    url: 'hugo.vizly.fr',
    props: makeProps('minimal', 'Hugo Bernard', 'Developpeur Full-Stack passionne par les architectures clean et les interfaces minimalistes.', [
      { title: 'App Bancaire', tags: ['React', 'Node.js'], imgId: 0 },
      { title: 'Dashboard SaaS', tags: ['TypeScript', 'D3.js'], imgId: 60 },
      { title: 'API Platform', tags: ['Docker', 'AWS'], imgId: 180 },
      { title: 'E-commerce', tags: ['Next.js', 'Stripe'], imgId: 366 },
    ], ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker']),
  },
  {
    template: 'dark',
    url: 'sara.vizly.fr',
    props: makeProps('dark', 'Sara Kovac', 'Creative developer specialisee en experiences web immersives et animations 3D.', [
      { title: 'WebGL Experience', tags: ['Three.js', 'GLSL'], imgId: 1 },
      { title: 'Interactive Portfolio', tags: ['React', 'GSAP'], imgId: 20 },
      { title: 'Audio Visualizer', tags: ['Web Audio', 'Canvas'], imgId: 36 },
      { title: 'Creative Agency', tags: ['Next.js', 'Framer'], imgId: 96 },
    ], ['Three.js', 'WebGL', 'GSAP', 'React', 'Blender']),
  },
  {
    template: 'classique',
    url: 'antoine.vizly.fr',
    props: makeProps('classique', 'Antoine Leroy', 'Etudiant en ecole de commerce, passionne par le marketing digital et la strategie produit.', [
      { title: 'Etude de marche', tags: ['Analyse', 'B2B'], imgId: 3 },
      { title: 'Campagne Social', tags: ['Meta Ads', 'KPI'], imgId: 119 },
      { title: 'Business Plan', tags: ['Startup', 'Finance'], imgId: 160 },
      { title: 'Stage Marketing', tags: ['SEO', 'Growth'], imgId: 177 },
    ], ['Marketing', 'Analyse', 'Excel', 'Canva', 'Google Ads']),
  },
  {
    template: 'colore',
    url: 'julie.vizly.fr',
    props: makeProps('colore', 'Julie Deschamps', 'Community manager freelance, specialisee en strategie de contenu et social media.', [
      { title: 'Campagne Instagram', tags: ['Social Media', 'Contenu'], imgId: 24 },
      { title: 'Refonte Editoriale', tags: ['Copywriting', 'Brand'], imgId: 65 },
      { title: 'Strategie TikTok', tags: ['Video', 'Tendances'], imgId: 137 },
      { title: 'Newsletter', tags: ['Email', 'Automation'], imgId: 169 },
    ], ['Social Media', 'Copywriting', 'Canva', 'Analytics', 'Video']),
  },
  {
    template: 'creatif',
    url: 'lea.vizly.fr',
    props: makeProps('creatif', 'Lea Fontaine', 'Photographe et directrice artistique, basee a Paris. Specialisee portrait et mode.', [
      { title: 'Serie Portrait', tags: ['Portrait', 'Studio'], imgId: 10 },
      { title: 'Campagne Mode', tags: ['Mode', 'Edito'], imgId: 11 },
      { title: 'Edito Magazine', tags: ['Presse', 'Direction'], imgId: 15 },
      { title: 'Expo Galerie', tags: ['Art', 'Tirage'], imgId: 29 },
    ], ['Lightroom', 'Photoshop', 'Direction artistique', 'Retouche']),
  },
  {
    template: 'brutalist',
    url: 'nina.vizly.fr',
    props: makeProps('brutalist', 'Nina Petit', 'Graphic designer pushing boundaries with bold typography and raw aesthetics.', [
      { title: 'Poster Series', tags: ['Typo', 'Print'], imgId: 42 },
      { title: 'Brand Identity', tags: ['Logo', 'Identity'], imgId: 82 },
      { title: 'Zine Design', tags: ['Editorial', 'Indie'], imgId: 106 },
      { title: 'Type Experiment', tags: ['Variable', 'Motion'], imgId: 256 },
    ], ['Typography', 'InDesign', 'Illustration', 'Print', 'Identity']),
  },
  {
    template: 'elegant',
    url: 'alexandre.vizly.fr',
    props: makeProps('elegant', 'Alexandre Morel', 'Architecte d\'interieur, specialise dans les projets residentiels haut de gamme.', [
      { title: 'Loft Marais', tags: ['Residentiel', 'Luxe'], imgId: 164 },
      { title: 'Villa Cote d\'Azur', tags: ['Villa', 'Contemporain'], imgId: 188 },
      { title: 'Penthouse Lyon', tags: ['Renovation', 'Design'], imgId: 238 },
      { title: 'Boutique Hotel', tags: ['Hotellerie', 'Concept'], imgId: 356 },
    ], ['AutoCAD', '3ds Max', 'SketchUp', 'Materiaux', 'Espace']),
  },
  {
    template: 'bento',
    url: 'camille.vizly.fr',
    props: makeProps('bento', 'Camille Sorel', 'Product designer chez une scale-up, focus sur les design systems et l\'experience utilisateur.', [
      { title: 'Design System v2', tags: ['Figma', 'Tokens'], imgId: 26 },
      { title: 'Onboarding Flow', tags: ['UX', 'Mobile'], imgId: 48 },
      { title: 'Dashboard Refonte', tags: ['Data Viz', 'B2B'], imgId: 201 },
      { title: 'App Mobile', tags: ['iOS', 'Android'], imgId: 403 },
    ], ['Figma', 'Design System', 'UX Research', 'Prototypage', 'A/B Testing']),
  },
]

/* ------------------------------------------------------------------ */
/*  Distribute across 3 columns                                       */
/* ------------------------------------------------------------------ */

const COL_1 = [0, 3, 6].flatMap((i) => ENTRIES[i] ? [ENTRIES[i]] : []) // minimal, colore, elegant
const COL_2 = [1, 4, 7].flatMap((i) => ENTRIES[i] ? [ENTRIES[i]] : []) // dark, creatif, bento
const COL_3 = [2, 5].flatMap((i) => ENTRIES[i] ? [ENTRIES[i]] : [])    // classique, brutalist

/* ------------------------------------------------------------------ */
/*  Card: mini browser frame + real template preview                  */
/* ------------------------------------------------------------------ */

const PREVIEW_SCALE = 0.18
const PREVIEW_HEIGHT = '280px'

function Card({ entry }: { entry: WallEntry }) {
  return (
    <div className="w-full rounded-[var(--radius-lg)] border border-border bg-surface overflow-hidden">
      {/* Mini browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-warm px-2.5 py-1.5">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6259]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFBF2F]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#29CE42]" />
        </div>
        <div className="flex-1 flex justify-center">
          <span className="text-[8px] text-muted-foreground font-mono truncate">
            {entry.url}
          </span>
        </div>
      </div>

      {/* Real template preview */}
      <TemplatePreview
        templateName={entry.template}
        templateProps={entry.props}
        scale={PREVIEW_SCALE}
        height={PREVIEW_HEIGHT}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Column: duplicated track for seamless infinite scroll             */
/* ------------------------------------------------------------------ */

interface ColumnProps {
  entries: WallEntry[]
  direction: 'up' | 'down'
  duration: string
  className?: string
}

function Column({ entries, direction, duration, className }: ColumnProps) {
  const doubled = [...entries, ...entries]
  const animClass = direction === 'up' ? 'animate-scroll-up' : 'animate-scroll-down'

  return (
    <div className={`flex-1 min-w-0 overflow-hidden ${className ?? ''}`}>
      <div
        className={`flex flex-col gap-3 ${animClass}`}
        style={{ animationDuration: duration, willChange: 'transform' }}
      >
        {doubled.map((entry, i) => (
          <Card key={`${entry.template}-${i}`} entry={entry} />
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Wall container with mask fade                                     */
/* ------------------------------------------------------------------ */

export function HeroPortfolioWall() {
  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-[54%] overflow-hidden hidden md:flex gap-3 px-2"
      aria-hidden="true"
      style={{
        maskImage:
          'linear-gradient(to right, transparent 0%, black 35%), linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
        maskComposite: 'intersect',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 35%), linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskComposite: 'source-in',
      }}
    >
      <Column entries={COL_1} direction="up" duration="42s" />
      <Column entries={COL_2} direction="down" duration="36s" />
      <Column entries={COL_3} direction="up" duration="52s" className="hidden lg:block" />
    </div>
  )
}
