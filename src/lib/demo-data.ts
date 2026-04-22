import type { TemplateProps } from '@/types'
import type { TemplateName } from '@/types/templates'
import type { SectionBlock } from '@/types/sections'
import type { KpiItem } from '@/types/kpis'
import type { LayoutBlock } from '@/types/layout-blocks'
import type { CustomBlock } from '@/types/custom-blocks'
import { DEFAULT_PORTFOLIO_COLOR } from './constants'

/** Per-template color palette used for demo previews. */
export const DEMO_COLORS: Record<TemplateName, { primary: string; secondary: string }> = {
  minimal: { primary: '#1A1A1A', secondary: '#F5F5F5' },
  dark: { primary: '#00D4FF', secondary: '#0A0A0A' },
  classique: { primary: '#2D5A3D', secondary: '#FAFAF8' },
  colore: { primary: '#FF6B6B', secondary: '#FFF5E6' },
  creatif: { primary: '#8B6914', secondary: '#FFFDF5' },
  brutalist: { primary: DEFAULT_PORTFOLIO_COLOR, secondary: '#FFFFFF' },
  elegant: { primary: '#8F6B4A', secondary: '#FDFBF7' },
  bento: { primary: '#4A3D8F', secondary: '#F8F7FF' },
}

/** Per-template handle for URL mockups. */
export const DEMO_HANDLES: Record<TemplateName, string> = {
  minimal: 'thomas-l',
  dark: 'nora',
  classique: 'jeanne-m',
  colore: 'yacine',
  creatif: 'kenza',
  brutalist: 'studio-noir',
  elegant: 'ines-v',
  bento: 'axl-studio',
}

interface DemoEntry {
  name: string
  bio: string
  contactEmail: string | null
  socialLinks: Record<string, string>
  projects: Array<{ title: string; desc?: string; tags: string[]; imgId: number; extraImgIds?: number[] }>
  skills: string[]
  kpis?: KpiItem[]
  layoutBlocks?: LayoutBlock[]
  customBlocks?: CustomBlock[]
}

const DEMO_ENTRIES: Record<TemplateName, DemoEntry> = {
  /* ── Minimal — backend engineer, KPIs chiffres clés ────────────────── */
  minimal: {
    name: 'Thomas Lefèvre',
    bio: 'Backend engineer, Go & Rust. Trois ans chez Doctolib, maintenant freelance sur des projets data-intensive.',
    contactEmail: 'thomas@example.com',
    socialLinks: { github: '#', linkedin: '#', website: '#' },
    projects: [
      { title: 'App Bancaire', desc: 'Backend Go pour une néobanque, 2M de requêtes/jour. Architecture event-driven avec Kafka.', tags: ['Go', 'Kafka', 'gRPC'], imgId: 0, extraImgIds: [60, 180] },
      { title: 'Dashboard SaaS', desc: 'Plateforme data-viz B2B, backend temps réel et API GraphQL.', tags: ['TypeScript', 'GraphQL'], imgId: 60 },
      { title: 'API Platform', desc: 'API interne multi-tenant, 99.99% uptime sur 18 mois.', tags: ['Docker', 'Kubernetes'], imgId: 180 },
      { title: 'E-commerce', desc: 'Refonte du backend e-commerce, -60% sur le temps de réponse.', tags: ['Rust', 'PostgreSQL'], imgId: 366 },
    ],
    skills: ['Go', 'Rust', 'PostgreSQL', 'Docker', 'Kubernetes', 'gRPC', 'Kafka'],
    kpis: [
      { id: 'm-k1', type: 'number', label: 'Projets livrés', value: 47, maxValue: 100, unit: '' },
      { id: 'm-k2', type: 'percentage', label: 'Satisfaction client', value: 98, maxValue: 100, unit: '%' },
      { id: 'm-k3', type: 'trend', label: 'CA annuel', value: 85, maxValue: 100, unit: 'k€', secondaryValue: 12, secondaryLabel: 'vs. année précédente' },
    ],
  },

  /* ── Dark — creative dev, layout image + texte ─────────────────────── */
  dark: {
    name: 'Nora Belhaj',
    bio: 'Creative developer spécialisée en expériences web immersives, animations 3D et shaders.',
    contactEmail: 'hello@nora.studio',
    socialLinks: { github: '#', dribbble: '#', website: '#' },
    projects: [
      { title: 'WebGL Experience', desc: 'Expérience 3D interactive pour une marque lifestyle, sélectionnée Awwwards.', tags: ['Three.js', 'GLSL'], imgId: 1 },
      { title: 'Interactive Portfolio', desc: 'Portfolio studio avec transitions GSAP et smooth scroll.', tags: ['React', 'GSAP'], imgId: 20 },
      { title: 'Audio Visualizer', desc: 'Visualizer temps réel Web Audio API + Canvas.', tags: ['Web Audio', 'Canvas'], imgId: 36 },
      { title: 'Creative Agency', desc: 'Site agency avec animations orchestrées et micro-interactions.', tags: ['Next.js', 'Framer'], imgId: 96 },
    ],
    skills: ['Three.js', 'WebGL', 'GSAP', 'React', 'Blender', 'GLSL'],
    kpis: [
      { id: 'd-k1', type: 'number', label: 'Awwwards SOTD', value: 3, maxValue: 10, unit: '' },
      { id: 'd-k2', type: 'stars', label: 'Note clients', value: 4.9, maxValue: 5, unit: '' },
    ],
    layoutBlocks: [
      {
        id: 'dark-layout-1',
        columnCount: 2,
        columns: [
          { type: 'text', title: 'Approche créative', content: '<p>Je fusionne design et code pour créer des expériences web mémorables. Chaque projet est une exploration artistique et technique.</p>' },
          { type: 'image', imageUrl: 'https://picsum.photos/id/399/800/600', imageAlt: 'Creative setup' },
        ],
      },
    ],
  },

  /* ── Classique — étudiante, KPIs parcours + custom bloc formation ──── */
  classique: {
    name: 'Jeanne Marchand',
    bio: 'Étudiante en Master à l\'ESSEC, spécialisée marketing digital et stratégie produit. En recherche de stage de fin d\'études.',
    contactEmail: 'jeanne@example.com',
    socialLinks: { linkedin: '#' },
    projects: [
      { title: 'Étude de marché', desc: 'Analyse concurrentielle pour une startup EdTech, 40 interviews utilisateurs.', tags: ['Analyse', 'B2B'], imgId: 3 },
      { title: 'Campagne Social', desc: 'Stratégie Meta Ads avec +200% de conversions sur 3 mois.', tags: ['Meta Ads', 'KPI'], imgId: 119 },
      { title: 'Business Plan', desc: 'Business plan complet pour un projet de food-tech, primé concours étudiant.', tags: ['Startup', 'Finance'], imgId: 160 },
      { title: 'Stage Marketing', desc: 'Stage de 6 mois en growth marketing chez une scale-up FR.', tags: ['SEO', 'Growth'], imgId: 177 },
    ],
    skills: ['Marketing digital', 'SEO', 'Google Ads', 'Canva', 'Excel', 'Analytics'],
    kpis: [
      { id: 'c-k1', type: 'bars', label: 'Compétences clés', value: 0, maxValue: 100, unit: '%', dataPoints: [{ label: 'SEO', value: 85 }, { label: 'Ads', value: 70 }, { label: 'Analytics', value: 90 }, { label: 'CRM', value: 60 }] },
      { id: 'c-k2', type: 'number', label: 'Stages réalisés', value: 3, maxValue: 10, unit: '' },
    ],
    customBlocks: [
      { id: 'classique-cb-1', title: 'Formation', subtitle: 'Parcours académique', content: '<p><strong>ESSEC Business School</strong> — Master Grande École (2024-2026)</p><p><strong>Université Paris-Dauphine</strong> — Licence Économie-Gestion (2021-2024)</p>', order: 0 },
    ],
  },

  /* ── Coloré — community manager, KPIs engagement ───────────────────── */
  colore: {
    name: 'Yacine Kadi',
    bio: 'Community manager freelance, spécialisé stratégie de contenu et social media. Mes clients passent de invisibles à incontournables.',
    contactEmail: 'yacine@example.com',
    socialLinks: { dribbble: '#', website: '#', linkedin: '#' },
    projects: [
      { title: 'Campagne Instagram', desc: 'Campagne multi-formats pour une marque DNVB, +58% de followers en 3 mois.', tags: ['Social Media', 'Contenu'], imgId: 24 },
      { title: 'Refonte Éditoriale', desc: 'Nouvelle ligne éditoriale et brand voice pour une startup SaaS.', tags: ['Copywriting', 'Brand'], imgId: 65 },
      { title: 'Stratégie TikTok', desc: 'Stratégie TikTok organique avec 4M de vues cumulées.', tags: ['Video', 'Tendances'], imgId: 137 },
      { title: 'Newsletter', desc: 'Newsletter hebdomadaire, 12k abonnés, taux d\'ouverture 42%.', tags: ['Email', 'Automation'], imgId: 169 },
    ],
    skills: ['Social Media', 'Copywriting', 'Canva', 'Analytics', 'Video', 'Branding'],
    kpis: [
      { id: 'co-k1', type: 'number', label: 'Comptes gérés', value: 12, maxValue: 50, unit: '' },
      { id: 'co-k2', type: 'percentage', label: 'Taux engagement moyen', value: 6, maxValue: 10, unit: '%' },
      { id: 'co-k3', type: 'comparison', label: 'Abonnés après', value: 45000, maxValue: 100000, unit: '', secondaryValue: 8000, secondaryLabel: 'Avant' },
      { id: 'co-k4', type: 'stars', label: 'Note Malt', value: 4.9, maxValue: 5, unit: '' },
    ],
  },

  /* ── Créatif — photographe, layout image+image + clients ───────────── */
  creatif: {
    name: 'Kenza Amrani',
    bio: 'Photographe et directrice artistique, basée à Paris. Spécialisée portrait, mode et éditorial.',
    contactEmail: 'kenza@example.com',
    socialLinks: { dribbble: '#', website: '#' },
    projects: [
      { title: 'Série Portrait', desc: 'Série de portraits en lumière naturelle, exposée aux Rencontres d\'Arles 2025.', tags: ['Portrait', 'Studio'], imgId: 10 },
      { title: 'Campagne Mode', desc: 'Campagne printemps/été pour une marque de prêt-à-porter féminin.', tags: ['Mode', 'Édito'], imgId: 11 },
      { title: 'Édito Magazine', desc: 'Éditorial 8 pages pour un magazine mode trimestriel.', tags: ['Presse', 'Direction'], imgId: 15 },
      { title: 'Expo Galerie', desc: 'Première exposition solo dans une galerie du Marais, 40 tirages grand format.', tags: ['Art', 'Tirage'], imgId: 29 },
    ],
    skills: ['Lightroom', 'Photoshop', 'Direction artistique', 'Retouche', 'Vidéo'],
    layoutBlocks: [
      {
        id: 'creatif-layout-1',
        columnCount: 2,
        columns: [
          { type: 'image', imageUrl: 'https://picsum.photos/id/1027/800/600', imageAlt: 'Portrait studio' },
          { type: 'image', imageUrl: 'https://picsum.photos/id/1062/800/600', imageAlt: 'Mode éditorial' },
        ],
      },
    ],
    customBlocks: [
      { id: 'creatif-cb-1', title: 'Clients notables', subtitle: 'Collaborations récentes', content: '<p>Vogue France — Elle Magazine — Chanel Beauty — Hermès — Galeries Lafayette</p>', order: 0 },
    ],
  },

  /* ── Brutalist — studio de création, KPIs bold + layout 3 cols ─────── */
  brutalist: {
    name: 'Studio Noir',
    bio: 'Direction artistique, identité visuelle, type design. On pousse la typo et l\'esthétique brute.',
    contactEmail: 'hello@studionoir.fr',
    socialLinks: { website: '#', dribbble: '#' },
    projects: [
      { title: 'Poster Series', desc: 'Série de 12 affiches typographiques éditées en sérigraphie.', tags: ['Typo', 'Print'], imgId: 42 },
      { title: 'Brand Identity', desc: 'Identité complète pour une maison de disques indépendante.', tags: ['Logo', 'Identity'], imgId: 82 },
      { title: 'Zine Design', desc: 'Direction artistique d\'un zine trimestriel, 4 numéros sortis.', tags: ['Editorial', 'Indie'], imgId: 106 },
      { title: 'Type Experiment', desc: 'Fonte variable expérimentale, open source et utilisée sur 500+ projets.', tags: ['Variable', 'Motion'], imgId: 256 },
    ],
    skills: ['Direction artistique', 'Typographie', 'Identité visuelle', 'Print', 'Web'],
    kpis: [
      { id: 'b-k1', type: 'number', label: 'Awards', value: 7, maxValue: 50, unit: '' },
      { id: 'b-k2', type: 'number', label: 'Expositions', value: 14, maxValue: 50, unit: '' },
      { id: 'b-k3', type: 'stars', label: 'Note Behance', value: 4.8, maxValue: 5, unit: '' },
    ],
    layoutBlocks: [
      {
        id: 'brutalist-layout-1',
        columnCount: 3,
        columns: [
          { type: 'text', title: 'Print', content: '<p>Affiches, zines, éditions limitées</p>' },
          { type: 'text', title: 'Digital', content: '<p>Identités web, motion, UI expérimentale</p>' },
          { type: 'text', title: 'Type', content: '<p>Fontes custom, lettering, variable fonts</p>' },
        ],
      },
    ],
  },

  /* ── Élégant — architecte d'intérieur, layout image+texte + KPIs ───── */
  elegant: {
    name: 'Inès Vieira',
    bio: 'Architecte d\'intérieur, spécialisée dans les projets résidentiels haut de gamme, Paris et côte méditerranéenne.',
    contactEmail: 'ines@example.com',
    socialLinks: { linkedin: '#', website: '#' },
    projects: [
      { title: 'Loft Marais', desc: 'Rénovation complète d\'un loft de 180m² dans le Marais, matériaux nobles et lumière naturelle.', tags: ['Résidentiel', 'Luxe'], imgId: 164 },
      { title: 'Villa Côte d\'Azur', desc: 'Villa contemporaine face mer, travertin et chêne massif.', tags: ['Villa', 'Contemporain'], imgId: 188 },
      { title: 'Penthouse Lyon', desc: 'Penthouse de 220m² en plein centre, design sur-mesure.', tags: ['Rénovation', 'Design'], imgId: 238 },
      { title: 'Boutique Hotel', desc: 'Concept d\'un boutique hotel 18 chambres en Provence.', tags: ['Hôtellerie', 'Concept'], imgId: 356 },
    ],
    skills: ['AutoCAD', '3ds Max', 'SketchUp', 'Matériaux', 'Espace'],
    kpis: [
      { id: 'e-k1', type: 'number', label: 'Projets réalisés', value: 34, maxValue: 100, unit: '' },
      { id: 'e-k2', type: 'percentage', label: 'Clients fidèles', value: 72, maxValue: 100, unit: '%' },
    ],
    layoutBlocks: [
      {
        id: 'elegant-layout-1',
        columnCount: 2,
        columns: [
          { type: 'image', imageUrl: 'https://picsum.photos/id/349/800/600', imageAlt: 'Intérieur luxe' },
          { type: 'text', title: 'Philosophie', content: '<p>Chaque espace raconte une histoire. Je conçois des intérieurs où le luxe se vit dans la subtilité des détails et la noblesse des matériaux.</p>' },
        ],
      },
    ],
  },

  /* ── Bento — product designer, KPIs + layout kpi+kpi ───────────────── */
  bento: {
    name: 'Axel Moreau',
    bio: 'Product designer chez une scale-up, focus sur les design systems et l\'expérience utilisateur.',
    contactEmail: 'axel@example.com',
    socialLinks: { linkedin: '#', dribbble: '#', github: '#', website: '#' },
    projects: [
      { title: 'Design System v2', desc: 'Refonte complète du design system, 126 composants documentés.', tags: ['Figma', 'Tokens'], imgId: 26 },
      { title: 'Onboarding Flow', desc: 'Onboarding mobile repensé, +34% de complétion.', tags: ['UX', 'Mobile'], imgId: 48 },
      { title: 'Dashboard Refonte', desc: 'Refonte dashboard B2B, data-viz et information architecture.', tags: ['Data Viz', 'B2B'], imgId: 201 },
      { title: 'App Mobile', desc: 'Design d\'une app mobile cross-platform (iOS + Android).', tags: ['iOS', 'Android'], imgId: 403 },
    ],
    skills: ['Figma', 'Design System', 'UX Research', 'Prototypage', 'A/B Testing'],
    kpis: [
      { id: 'be-k1', type: 'percentage', label: 'Adoption design system', value: 94, maxValue: 100, unit: '%' },
      { id: 'be-k2', type: 'trend', label: 'NPS produit', value: 72, maxValue: 100, unit: '', secondaryValue: 18, secondaryLabel: 'vs. Q1' },
      { id: 'be-k3', type: 'bars', label: 'Sprints par trimestre', value: 0, maxValue: 100, unit: '', dataPoints: [{ label: 'Q1', value: 6 }, { label: 'Q2', value: 8 }, { label: 'Q3', value: 7 }, { label: 'Q4', value: 9 }] },
    ],
    layoutBlocks: [
      {
        id: 'bento-layout-1',
        columnCount: 2,
        columns: [
          { type: 'kpi', kpi: { id: 'be-lk1', type: 'number', label: 'Composants', value: 126, maxValue: 500, unit: '' } },
          { type: 'kpi', kpi: { id: 'be-lk2', type: 'percentage', label: 'Couverture tests', value: 89, maxValue: 100, unit: '%' } },
        ],
      },
    ],
  },
}

/** Build a complete TemplateProps with rich demo content for the given template. */
export function getDemoPortfolio(templateName: string, isPremium = false): TemplateProps {
  const tName = (templateName in DEMO_ENTRIES ? templateName : 'minimal') as TemplateName
  const entry = DEMO_ENTRIES[tName]
  const colors = DEMO_COLORS[tName]
  const slug = DEMO_HANDLES[tName]

  const sections: SectionBlock[] = [
    { id: 'hero', visible: true, order: 0 },
    { id: 'bio', visible: true, order: 1 },
    { id: 'socials', visible: true, order: 2 },
    { id: 'projects', visible: true, order: 3 },
    { id: 'skills', visible: true, order: 4 },
  ]
  let order = 5

  if (entry.kpis && entry.kpis.length > 0) {
    sections.push({ id: 'kpis', visible: true, order: order++ })
  }
  for (const block of entry.layoutBlocks ?? []) {
    sections.push({ id: `layout-${block.id}`, visible: true, order: order++ })
  }
  for (const block of entry.customBlocks ?? []) {
    sections.push({ id: `custom-${block.id}`, visible: true, order: order++ })
  }
  if (entry.contactEmail || isPremium) {
    sections.push({ id: 'contact', visible: true, order: order++ })
  }

  return {
    portfolio: {
      title: entry.name,
      bio: entry.bio,
      photo_url: null,
      primary_color: colors.primary,
      secondary_color: colors.secondary,
      body_color: colors.secondary,
      background_color: '#FFFFFF',
      font: 'default',
      font_body: 'default',
      social_links: entry.socialLinks,
      contact_email: entry.contactEmail,
      contact_form_enabled: isPremium,
      contact_form_title: 'Me contacter',
      contact_form_description: 'Pour un projet, une collaboration ou une simple prise de contact.',
      slug,
    },
    projects: entry.projects.map((p, i) => ({
      id: `${tName}-p-${i}`,
      title: p.title,
      description: p.desc ?? null,
      images: [
        `https://picsum.photos/id/${p.imgId}/800/600`,
        ...(p.extraImgIds?.map((id) => `https://picsum.photos/id/${id}/800/600`) ?? []),
      ],
      external_link: null,
      tags: p.tags,
      display_order: i,
    })),
    skills: entry.skills,
    sections,
    customBlocks: entry.customBlocks ?? [],
    kpis: entry.kpis ?? [],
    layoutBlocks: entry.layoutBlocks ?? [],
    isPremium,
  }
}
