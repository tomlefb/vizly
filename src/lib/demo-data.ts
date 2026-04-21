import type { TemplateProps } from '@/types'
import { DEFAULT_SECTIONS } from '@/types/sections'
import { DEFAULT_PORTFOLIO_COLOR } from './constants'

/** Realistic demo portfolio used for template previews */
export const DEMO_PORTFOLIO: TemplateProps = {
  portfolio: {
    title: 'Prénom Nom',
    bio: 'Courte description de ton parcours et de ce que tu fais. Ce texte sera remplacé par le tien.',
    photo_url: null,
    primary_color: DEFAULT_PORTFOLIO_COLOR,
    secondary_color: '#1A1A1A',
    body_color: '#1A1A1A',
    background_color: '#FFFFFF',
    font: 'default',
    font_body: 'default',
    social_links: {
      linkedin: '#',
      github: '#',
      website: '#',
    },
    contact_email: null,
  },
  projects: [
    {
      id: 'demo-1',
      title: 'Refonte App Bancaire',
      description: 'Redesign complet de l\'application mobile d\'une néobanque. Recherche utilisateur, wireframes, prototypage et design system.',
      images: [],
      external_link: null,
      tags: ['UI/UX', 'Mobile', 'Fintech'],
      display_order: 0,
    },
    {
      id: 'demo-2',
      title: 'Dashboard Analytics',
      description: 'Interface de data visualization pour une plateforme SaaS. Graphiques interactifs, dark mode, et export PDF.',
      images: [],
      external_link: null,
      tags: ['Dashboard', 'SaaS', 'Data Viz'],
      display_order: 1,
    },
    {
      id: 'demo-3',
      title: 'E-commerce Luxe',
      description: 'Site e-commerce pour une marque de maroquinerie haut de gamme. Focus sur la photographie produit et l\'expérience d\'achat.',
      images: [],
      external_link: null,
      tags: ['E-commerce', 'Luxe', 'Web'],
      display_order: 2,
    },
    {
      id: 'demo-4',
      title: 'Brand Identity Studio',
      description: 'Identité visuelle complète pour un studio de création. Logo, charte graphique, templates sociaux et site vitrine.',
      images: [],
      external_link: null,
      tags: ['Branding', 'Identité', 'Print'],
      display_order: 3,
    },
  ],
  skills: [
    'Figma',
    'React',
    'TypeScript',
    'Tailwind CSS',
    'Next.js',
    'UI/UX Design',
    'Prototypage',
    'Design System',
    'User Research',
    'Adobe Creative Suite',
  ],
  sections: DEFAULT_SECTIONS,
  customBlocks: [],
  kpis: [],
  layoutBlocks: [],
  isPremium: false,
}

/** Per-template identity overrides — one persona per template */
const DEMO_OVERRIDES: Record<string, {
  title: string
  bio: string
  social_links: Record<string, string>
  contact_email: string | null
  skills: string[]
}> = {
  minimal: {
    title: 'Thomas Lefèvre',
    bio: 'Backend engineer, Go & Rust. Trois ans chez Doctolib, maintenant freelance.',
    social_links: { github: '#', website: '#' },
    contact_email: null,
    skills: ['Go', 'Rust', 'PostgreSQL', 'Docker', 'Kubernetes', 'gRPC'],
  },
  dark: {
    title: 'Yacine Kadi',
    bio: 'Creative developer. Three.js, WebGL, tout ce qui brille dans un navigateur.',
    social_links: { github: '#', dribbble: '#', website: '#' },
    contact_email: null,
    skills: ['Three.js', 'WebGL', 'GSAP', 'React', 'Blender', 'Shader'],
  },
  classique: {
    title: 'Jeanne Marchand',
    bio: 'Étudiante en Master à l\'ESSEC, spécialisée marketing digital et stratégie produit. En recherche de stage de fin d\'études.',
    social_links: { linkedin: '#' },
    contact_email: 'jeanne@example.com',
    skills: ['Marketing digital', 'SEO', 'Google Ads', 'Canva', 'Excel', 'Analytics'],
  },
  colore: {
    title: 'Kenza Amrani',
    bio: 'Illustratrice freelance. Éditorial, branding, motion — tant que c\'est en couleur.',
    social_links: { dribbble: '#', website: '#' },
    contact_email: 'kenza@example.com',
    skills: ['Procreate', 'Illustrator', 'After Effects', 'Figma', 'Branding'],
  },
  creatif: {
    title: 'Inès Vieira',
    bio: 'Photographe et directrice artistique. Collaborations presse et mode.',
    social_links: { website: '#', dribbble: '#' },
    contact_email: null,
    skills: ['Lightroom', 'Photoshop', 'Direction artistique', 'Retouche', 'Vidéo'],
  },
  brutalist: {
    title: 'Studio Noir',
    bio: 'Direction artistique, identité visuelle, type design.',
    social_links: { website: '#' },
    contact_email: 'hello@studionoir.fr',
    skills: ['Direction artistique', 'Typographie', 'Identité visuelle', 'Print', 'Web'],
  },
  elegant: {
    title: 'Mehdi Bentahar',
    bio: 'Architecte d\'intérieur. Projets résidentiels haut de gamme, Paris et côte méditerranéenne.',
    social_links: { linkedin: '#', website: '#' },
    contact_email: 'mehdi@example.com',
    skills: ['AutoCAD', '3ds Max', 'SketchUp', 'Matériaux', 'Espace'],
  },
  bento: {
    title: 'Léo Durand',
    bio: 'Product designer chez une scale-up. Design systems le jour, side projects la nuit.',
    social_links: { linkedin: '#', dribbble: '#', github: '#', website: '#' },
    contact_email: null,
    skills: ['Figma', 'Design System', 'UX Research', 'Prototypage', 'A/B Testing'],
  },
}

/** Per-template handle for URL mockups */
export const DEMO_HANDLES: Record<string, string> = {
  minimal: 'thomas-l',
  dark: 'yacine',
  classique: 'jeanne-m',
  colore: 'kenza',
  creatif: 'ines-v',
  brutalist: 'studio-noir',
  elegant: 'mehdi-b',
  bento: 'leo-d',
}

/** Build a complete TemplateProps with per-template identity + colors */
export function getDemoPortfolio(templateName: string, isPremium = false): TemplateProps {
  const colors = DEMO_COLORS[templateName] ?? { primary: DEFAULT_PORTFOLIO_COLOR, secondary: '#1A1A1A' }
  const override = DEMO_OVERRIDES[templateName]

  return {
    ...DEMO_PORTFOLIO,
    portfolio: {
      ...DEMO_PORTFOLIO.portfolio,
      primary_color: colors.primary,
      secondary_color: colors.secondary,
      body_color: colors.secondary,
      ...(override && {
        title: override.title,
        bio: override.bio,
        social_links: override.social_links,
        contact_email: override.contact_email,
      }),
    },
    ...(override && { skills: override.skills }),
    isPremium,
  }
}

/** Per-template color overrides for more realistic previews */
export const DEMO_COLORS: Record<string, { primary: string; secondary: string }> = {
  minimal: { primary: '#1A1A1A', secondary: '#F5F5F5' },
  dark: { primary: '#00D4FF', secondary: '#0A0A0A' },
  classique: { primary: '#2D5A3D', secondary: '#FAFAF8' },
  colore: { primary: '#FF6B6B', secondary: '#FFF5E6' },
  creatif: { primary: '#8B6914', secondary: '#FFFDF5' },
  brutalist: { primary: DEFAULT_PORTFOLIO_COLOR, secondary: '#FFFFFF' },
  elegant: { primary: '#8F6B4A', secondary: '#FDFBF7' },
  bento: { primary: '#4A3D8F', secondary: '#F8F7FF' },
}
