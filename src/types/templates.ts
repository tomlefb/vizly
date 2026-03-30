import type { TemplateProps } from './index'

export type TemplateName =
  | 'minimal'
  | 'dark'
  | 'classique'
  | 'colore'
  | 'creatif'
  | 'brutalist'
  | 'elegant'
  | 'bento'

export interface TemplateConfig {
  name: TemplateName
  label: string
  description: string
  isPremium: boolean
  previewImage: string
  idealFor: string
}

export const TEMPLATE_CONFIGS: TemplateConfig[] = [
  {
    name: 'minimal',
    label: 'Minimal',
    description: 'Fond blanc, typo clean, grille de projets en cards',
    isPremium: false,
    previewImage: '/images/templates/minimal.png',
    idealFor: 'Développeurs, profils corporate',
  },
  {
    name: 'dark',
    label: 'Dark',
    description: 'Fond sombre, accents néon, ambiance tech/dev',
    isPremium: false,
    previewImage: '/images/templates/dark.png',
    idealFor: 'Développeurs, gamers, créatifs tech',
  },
  {
    name: 'classique',
    label: 'Classique',
    description: 'Structure type CV, sidebar avec infos personnelles',
    isPremium: false,
    previewImage: '/images/templates/classique.png',
    idealFor: 'Étudiants, profils junior, candidatures',
  },
  {
    name: 'colore',
    label: 'Coloré',
    description: 'Couleurs vives, layout dynamique, ambiance fun',
    isPremium: false,
    previewImage: '/images/templates/colore.png',
    idealFor: 'Community managers, marketeurs, créatifs',
  },
  {
    name: 'creatif',
    label: 'Créatif',
    description: 'Layout asymétrique, grandes images, animations au scroll',
    isPremium: true,
    previewImage: '/images/templates/creatif.png',
    idealFor: 'Designers, photographes, directeurs artistiques',
  },
  {
    name: 'brutalist',
    label: 'Brutalist',
    description: 'Typo bold et oversized, layout cassé, tendance 2026',
    isPremium: true,
    previewImage: '/images/templates/brutalist.png',
    idealFor: 'Designers avant-gardistes, artistes',
  },
  {
    name: 'elegant',
    label: 'Élégant',
    description: 'Typo serif, espaces généreux, ambiance luxe',
    isPremium: true,
    previewImage: '/images/templates/elegant.png',
    idealFor: 'Photographes, architectes, profils haut de gamme',
  },
  {
    name: 'bento',
    label: 'Bento',
    description: 'Layout en grid bento, tendance Apple/2026',
    isPremium: true,
    previewImage: '/images/templates/bento.png',
    idealFor: 'Product designers, UI/UX, profils polyvalents',
  },
]

export type { TemplateProps }
