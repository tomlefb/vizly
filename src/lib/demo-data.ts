import type { TemplateProps } from '@/types'
import { DEFAULT_SECTIONS } from '@/types/sections'

/** Realistic demo portfolio used for template previews */
export const DEMO_PORTFOLIO: TemplateProps = {
  portfolio: {
    title: 'Marie Dupont',
    bio: 'Designer UI/UX passionnée par les interfaces élégantes et les expériences utilisateur intuitives. 5 ans d\'expérience en design produit, freelance basée à Lyon.',
    photo_url: null,
    primary_color: '#E8553D',
    secondary_color: '#1A1A1A',
    font: 'default',
    social_links: {
      linkedin: 'https://linkedin.com/in/mariedupont',
      dribbble: 'https://dribbble.com/mariedupont',
      github: 'https://github.com/mariedupont',
      website: 'https://mariedupont.fr',
    },
    contact_email: 'marie@example.com',
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
  isPremium: false,
}

/** Per-template color overrides for more realistic previews */
export const DEMO_COLORS: Record<string, { primary: string; secondary: string }> = {
  minimal: { primary: '#1A1A1A', secondary: '#F5F5F5' },
  dark: { primary: '#00D4FF', secondary: '#0A0A0A' },
  classique: { primary: '#2D5A3D', secondary: '#FAFAF8' },
  colore: { primary: '#FF6B6B', secondary: '#FFF5E6' },
  creatif: { primary: '#8B6914', secondary: '#FFFDF5' },
  brutalist: { primary: '#E8553D', secondary: '#FFFFFF' },
  elegant: { primary: '#8F6B4A', secondary: '#FDFBF7' },
  bento: { primary: '#4A3D8F', secondary: '#F8F7FF' },
}
