'use client'

import { useState, useEffect, useRef, type ComponentType } from 'react'
import { DEMO_COLORS } from '@/lib/demo-data'
import type { TemplateName } from '@/types/templates'
import type { TemplateProps } from '@/types'
import type { KpiItem } from '@/types/kpis'
import type { LayoutBlock } from '@/types/layout-blocks'
import type { CustomBlock } from '@/types/custom-blocks'
import type { SectionBlock } from '@/types/sections'

/* ------------------------------------------------------------------ */
/*  Helper: build a full TemplateProps from per-template data          */
/* ------------------------------------------------------------------ */

interface PortfolioInput {
  template: TemplateName
  name: string
  bio: string
  projects: Array<{ title: string; desc?: string; tags: string[]; imgId: number }>
  skills: string[]
  kpis?: KpiItem[]
  layoutBlocks?: LayoutBlock[]
  customBlocks?: CustomBlock[]
  premium?: boolean
}

function makeProps(input: PortfolioInput): TemplateProps {
  const colors = DEMO_COLORS[input.template] ?? { primary: '#1A1A1A', secondary: '#F5F5F5' }

  // Build sections: always hero, bio, socials, projects, skills
  const sections: SectionBlock[] = [
    { id: 'hero', visible: true, order: 0 },
    { id: 'bio', visible: true, order: 1 },
    { id: 'socials', visible: true, order: 2 },
    { id: 'projects', visible: true, order: 3 },
    { id: 'skills', visible: true, order: 4 },
  ]

  let order = 5

  // Add KPIs section if present
  if (input.kpis && input.kpis.length > 0) {
    sections.push({ id: 'kpis', visible: true, order: order++ })
  }

  // Add layout block sections
  if (input.layoutBlocks) {
    for (const block of input.layoutBlocks) {
      sections.push({ id: `layout-${block.id}`, visible: true, order: order++ })
    }
  }

  // Add custom block sections
  if (input.customBlocks) {
    for (const block of input.customBlocks) {
      sections.push({ id: `custom-${block.id}`, visible: true, order: order++ })
    }
  }

  sections.push({ id: 'contact', visible: false, order: order })

  return {
    portfolio: {
      title: input.name,
      bio: input.bio,
      photo_url: null,
      primary_color: colors.primary,
      secondary_color: colors.secondary,
      font: 'default',
      font_body: 'default',
      social_links: { github: '#', linkedin: '#', dribbble: '#' },
      contact_email: null,
    },
    projects: input.projects.map((p, i) => ({
      id: `${input.template}-${i}`,
      title: p.title,
      description: p.desc ?? null,
      images: [`https://picsum.photos/id/${p.imgId}/800/600`],
      external_link: null,
      tags: p.tags,
      display_order: i,
    })),
    skills: input.skills,
    sections,
    customBlocks: input.customBlocks ?? [],
    kpis: input.kpis ?? [],
    layoutBlocks: input.layoutBlocks ?? [],
    isPremium: input.premium ?? false,
  }
}

/* ------------------------------------------------------------------ */
/*  8 portfolios — one per template, with KPIs / layouts / custom     */
/* ------------------------------------------------------------------ */

interface WallEntry {
  template: TemplateName
  url: string
  props: TemplateProps
}

const ENTRIES: WallEntry[] = [
  /* ── Minimal — dev fullstack, KPIs chiffres clés ─────────────────── */
  {
    template: 'minimal',
    url: 'hugo.vizly.fr',
    props: makeProps({
      template: 'minimal',
      name: 'Hugo Bernard',
      bio: 'Developpeur Full-Stack passionne par les architectures clean et les interfaces minimalistes.',
      projects: [
        { title: 'App Bancaire', tags: ['React', 'Node.js'], imgId: 0 },
        { title: 'Dashboard SaaS', tags: ['TypeScript', 'D3.js'], imgId: 60 },
        { title: 'API Platform', tags: ['Docker', 'AWS'], imgId: 180 },
        { title: 'E-commerce', tags: ['Next.js', 'Stripe'], imgId: 366 },
      ],
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
      kpis: [
        { id: 'k1', type: 'number', label: 'Projets livres', value: 47, maxValue: 100, unit: '' },
        { id: 'k2', type: 'percentage', label: 'Satisfaction client', value: 98, maxValue: 100, unit: '%' },
        { id: 'k3', type: 'trend', label: 'CA annuel', value: 85, maxValue: 100, unit: 'k€', secondaryValue: 12, secondaryLabel: 'vs. annee precedente' },
      ],
    }),
  },

  /* ── Dark — creative dev, layout block image + texte ─────────────── */
  {
    template: 'dark',
    url: 'sara.vizly.fr',
    props: makeProps({
      template: 'dark',
      name: 'Sara Kovac',
      bio: 'Creative developer specialisee en experiences web immersives et animations 3D.',
      projects: [
        { title: 'WebGL Experience', tags: ['Three.js', 'GLSL'], imgId: 1 },
        { title: 'Interactive Portfolio', tags: ['React', 'GSAP'], imgId: 20 },
        { title: 'Audio Visualizer', tags: ['Web Audio', 'Canvas'], imgId: 36 },
        { title: 'Creative Agency', tags: ['Next.js', 'Framer'], imgId: 96 },
      ],
      skills: ['Three.js', 'WebGL', 'GSAP', 'React', 'Blender'],
      layoutBlocks: [
        {
          id: 'dark-layout-1',
          columnCount: 2,
          columns: [
            { type: 'text', title: 'Approche creative', content: '<p>Je fusionne design et code pour creer des experiences web memorables. Chaque projet est une exploration artistique et technique.</p>' },
            { type: 'image', imageUrl: 'https://picsum.photos/id/399/800/600', imageAlt: 'Creative setup' },
          ],
        },
      ],
    }),
  },

  /* ── Classique — etudiant, KPIs parcours + custom bloc ───────────── */
  {
    template: 'classique',
    url: 'antoine.vizly.fr',
    props: makeProps({
      template: 'classique',
      name: 'Antoine Leroy',
      bio: 'Etudiant en ecole de commerce, passionne par le marketing digital et la strategie produit.',
      projects: [
        { title: 'Etude de marche', desc: 'Analyse concurrentielle pour une startup EdTech.', tags: ['Analyse', 'B2B'], imgId: 3 },
        { title: 'Campagne Social', desc: 'Strategie Meta Ads avec +200% de conversions.', tags: ['Meta Ads', 'KPI'], imgId: 119 },
        { title: 'Business Plan', tags: ['Startup', 'Finance'], imgId: 160 },
        { title: 'Stage Marketing', tags: ['SEO', 'Growth'], imgId: 177 },
      ],
      skills: ['Marketing', 'Analyse', 'Excel', 'Canva', 'Google Ads'],
      kpis: [
        { id: 'k4', type: 'bars', label: 'Competences cles', value: 0, maxValue: 100, unit: '%', dataPoints: [{ label: 'SEO', value: 85 }, { label: 'Ads', value: 70 }, { label: 'Analytics', value: 90 }, { label: 'CRM', value: 60 }] },
        { id: 'k5', type: 'number', label: 'Stages realises', value: 3, maxValue: 10, unit: '' },
      ],
      customBlocks: [
        { id: 'classique-cb-1', title: 'Formation', subtitle: 'Parcours academique', content: '<p><strong>ESSEC Business School</strong> — Master Grande Ecole (2024-2026)</p><p><strong>Universite Paris-Dauphine</strong> — Licence Economie-Gestion (2021-2024)</p>', order: 0 },
      ],
    }),
  },

  /* ── Colore — community manager, KPIs engagement ─────────────────── */
  {
    template: 'colore',
    url: 'julie.vizly.fr',
    props: makeProps({
      template: 'colore',
      name: 'Julie Deschamps',
      bio: 'Community manager freelance, specialisee en strategie de contenu et social media.',
      projects: [
        { title: 'Campagne Instagram', tags: ['Social Media', 'Contenu'], imgId: 24 },
        { title: 'Refonte Editoriale', tags: ['Copywriting', 'Brand'], imgId: 65 },
        { title: 'Strategie TikTok', tags: ['Video', 'Tendances'], imgId: 137 },
        { title: 'Newsletter', tags: ['Email', 'Automation'], imgId: 169 },
      ],
      skills: ['Social Media', 'Copywriting', 'Canva', 'Analytics', 'Video'],
      kpis: [
        { id: 'k6', type: 'number', label: 'Comptes geres', value: 12, maxValue: 50, unit: '' },
        { id: 'k7', type: 'percentage', label: 'Taux engagement moyen', value: 6, maxValue: 10, unit: '%' },
        { id: 'k8', type: 'comparison', label: 'Abonnes apres', value: 45000, maxValue: 100000, unit: '', secondaryValue: 8000, secondaryLabel: 'Avant' },
        { id: 'k9', type: 'stars', label: 'Note Malt', value: 4.9, maxValue: 5, unit: '' },
      ],
    }),
  },

  /* ── Creatif — photographe, layout 2 cols image+image ────────────── */
  {
    template: 'creatif',
    url: 'lea.vizly.fr',
    props: makeProps({
      template: 'creatif',
      name: 'Lea Fontaine',
      bio: 'Photographe et directrice artistique, basee a Paris. Specialisee portrait et mode.',
      projects: [
        { title: 'Serie Portrait', tags: ['Portrait', 'Studio'], imgId: 10 },
        { title: 'Campagne Mode', tags: ['Mode', 'Edito'], imgId: 11 },
        { title: 'Edito Magazine', tags: ['Presse', 'Direction'], imgId: 15 },
        { title: 'Expo Galerie', tags: ['Art', 'Tirage'], imgId: 29 },
      ],
      skills: ['Lightroom', 'Photoshop', 'Direction artistique', 'Retouche'],
      premium: true,
      layoutBlocks: [
        {
          id: 'creatif-layout-1',
          columnCount: 2,
          columns: [
            { type: 'image', imageUrl: 'https://picsum.photos/id/1027/800/600', imageAlt: 'Portrait studio' },
            { type: 'image', imageUrl: 'https://picsum.photos/id/1062/800/600', imageAlt: 'Mode editorial' },
          ],
        },
      ],
      customBlocks: [
        { id: 'creatif-cb-1', title: 'Clients notables', subtitle: 'Collaborations recentes', content: '<p>Vogue France — Elle Magazine — Chanel Beauty — Hermes — Galeries Lafayette</p>', order: 0 },
      ],
    }),
  },

  /* ── Brutalist — graphic designer, KPIs bold + layout ────────────── */
  {
    template: 'brutalist',
    url: 'nina.vizly.fr',
    props: makeProps({
      template: 'brutalist',
      name: 'Nina Petit',
      bio: 'Graphic designer pushing boundaries with bold typography and raw aesthetics.',
      projects: [
        { title: 'Poster Series', tags: ['Typo', 'Print'], imgId: 42 },
        { title: 'Brand Identity', tags: ['Logo', 'Identity'], imgId: 82 },
        { title: 'Zine Design', tags: ['Editorial', 'Indie'], imgId: 106 },
        { title: 'Type Experiment', tags: ['Variable', 'Motion'], imgId: 256 },
      ],
      skills: ['Typography', 'InDesign', 'Illustration', 'Print', 'Identity'],
      premium: true,
      kpis: [
        { id: 'k10', type: 'number', label: 'Awards', value: 7, maxValue: 50, unit: '' },
        { id: 'k11', type: 'number', label: 'Expositions', value: 14, maxValue: 50, unit: '' },
        { id: 'k12', type: 'stars', label: 'Note Behance', value: 4.8, maxValue: 5, unit: '' },
      ],
      layoutBlocks: [
        {
          id: 'brutalist-layout-1',
          columnCount: 3,
          columns: [
            { type: 'text', title: 'Print', content: '<p>Affiches, zines, editions limitees</p>' },
            { type: 'text', title: 'Digital', content: '<p>Identites web, motion, UI experimentale</p>' },
            { type: 'text', title: 'Type', content: '<p>Fontes custom, lettering, variable fonts</p>' },
          ],
        },
      ],
    }),
  },

  /* ── Elegant — architecte, layout image+texte + KPIs ─────────────── */
  {
    template: 'elegant',
    url: 'alexandre.vizly.fr',
    props: makeProps({
      template: 'elegant',
      name: 'Alexandre Morel',
      bio: 'Architecte d\'interieur, specialise dans les projets residentiels haut de gamme.',
      projects: [
        { title: 'Loft Marais', desc: 'Renovation complete d\'un loft de 180m2 dans le Marais.', tags: ['Residentiel', 'Luxe'], imgId: 164 },
        { title: 'Villa Cote d\'Azur', desc: 'Villa contemporaine face mer, materiaux nobles.', tags: ['Villa', 'Contemporain'], imgId: 188 },
        { title: 'Penthouse Lyon', tags: ['Renovation', 'Design'], imgId: 238 },
        { title: 'Boutique Hotel', tags: ['Hotellerie', 'Concept'], imgId: 356 },
      ],
      skills: ['AutoCAD', '3ds Max', 'SketchUp', 'Materiaux', 'Espace'],
      premium: true,
      kpis: [
        { id: 'k13', type: 'number', label: 'Projets realises', value: 34, maxValue: 100, unit: '' },
        { id: 'k14', type: 'percentage', label: 'Clients fideles', value: 72, maxValue: 100, unit: '%' },
      ],
      layoutBlocks: [
        {
          id: 'elegant-layout-1',
          columnCount: 2,
          columns: [
            { type: 'image', imageUrl: 'https://picsum.photos/id/349/800/600', imageAlt: 'Interieur luxe' },
            { type: 'text', title: 'Philosophie', content: '<p>Chaque espace raconte une histoire. Je concois des interieurs ou le luxe se vit dans la subtilite des details et la noblesse des materiaux.</p>' },
          ],
        },
      ],
    }),
  },

  /* ── Bento — product designer, KPIs + layout 3 cols ──────────────── */
  {
    template: 'bento',
    url: 'camille.vizly.fr',
    props: makeProps({
      template: 'bento',
      name: 'Camille Sorel',
      bio: 'Product designer chez une scale-up, focus sur les design systems et l\'experience utilisateur.',
      projects: [
        { title: 'Design System v2', tags: ['Figma', 'Tokens'], imgId: 26 },
        { title: 'Onboarding Flow', tags: ['UX', 'Mobile'], imgId: 48 },
        { title: 'Dashboard Refonte', tags: ['Data Viz', 'B2B'], imgId: 201 },
        { title: 'App Mobile', tags: ['iOS', 'Android'], imgId: 403 },
      ],
      skills: ['Figma', 'Design System', 'UX Research', 'Prototypage', 'A/B Testing'],
      premium: true,
      kpis: [
        { id: 'k15', type: 'percentage', label: 'Adoption design system', value: 94, maxValue: 100, unit: '%' },
        { id: 'k16', type: 'trend', label: 'NPS produit', value: 72, maxValue: 100, unit: '', secondaryValue: 18, secondaryLabel: 'vs. Q1' },
        { id: 'k17', type: 'bars', label: 'Sprints par trimestre', value: 0, maxValue: 100, unit: '', dataPoints: [{ label: 'Q1', value: 6 }, { label: 'Q2', value: 8 }, { label: 'Q3', value: 7 }, { label: 'Q4', value: 9 }] },
      ],
      layoutBlocks: [
        {
          id: 'bento-layout-1',
          columnCount: 2,
          columns: [
            { type: 'kpi', kpi: { id: 'k18', type: 'number', label: 'Composants', value: 126, maxValue: 500, unit: '' } },
            { type: 'kpi', kpi: { id: 'k19', type: 'percentage', label: 'Couverture tests', value: 89, maxValue: 100, unit: '%' } },
          ],
        },
      ],
    }),
  },
]

/* ------------------------------------------------------------------ */
/*  Distribute across 3 columns                                       */
/* ------------------------------------------------------------------ */

const COL_1 = [0, 3, 6].flatMap((i) => ENTRIES[i] ? [ENTRIES[i]] : []) // minimal, colore, elegant
const COL_2 = [1, 4, 7].flatMap((i) => ENTRIES[i] ? [ENTRIES[i]] : []) // dark, creatif, bento
const COL_3 = [2, 5].flatMap((i) => ENTRIES[i] ? [ENTRIES[i]] : [])    // classique, brutalist

/* ------------------------------------------------------------------ */
/*  Auto-height template preview (measures real content)              */
/* ------------------------------------------------------------------ */

const PREVIEW_SCALE = 0.18

function AutoHeightPreview({ templateName, templateProps }: { templateName: string; templateProps: TemplateProps }) {
  const [Component, setComponent] = useState<ComponentType<TemplateProps> | null>(null)
  const [height, setHeight] = useState(320)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const mod = await import('@/components/templates')
        const map = mod.templateMap as Record<string, ComponentType<TemplateProps>>
        const comp = map[templateName as TemplateName]
        if (!cancelled && comp) setComponent(() => comp)
      } catch { /* template not found */ }
    }
    void load()
    return () => { cancelled = true }
  }, [templateName])

  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setHeight(entry.contentRect.height * PREVIEW_SCALE)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [Component])

  if (!Component) {
    return <div className="h-[320px] bg-surface-warm/50" />
  }

  return (
    <div className="relative overflow-hidden" style={{ height }}>
      <div
        ref={innerRef}
        className="absolute top-0 left-0 origin-top-left pointer-events-none"
        style={{ width: '1280px', transform: `scale(${PREVIEW_SCALE})` }}
      >
        <Component {...templateProps} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Card: mini browser frame + auto-height template preview           */
/* ------------------------------------------------------------------ */

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

      {/* Real template preview — auto-height */}
      <AutoHeightPreview templateName={entry.template} templateProps={entry.props} />
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
