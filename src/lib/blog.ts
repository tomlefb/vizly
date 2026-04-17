import { DEFAULT_PORTFOLIO_COLOR } from './constants'

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  readingTime: string
  coverColor: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'creer-portfolio-en-ligne-5-minutes',
    title: 'Comment créer un portfolio en ligne en 5 minutes',
    description:
      'Guide pas à pas pour créer ton portfolio professionnel avec Vizly. Du formulaire à la mise en ligne.',
    date: '2026-03-28',
    readingTime: '5 min',
    coverColor: DEFAULT_PORTFOLIO_COLOR,
  },
  {
    slug: 'portfolio-developpeur-erreurs',
    title: 'Portfolio développeur : les 10 erreurs à éviter en 2026',
    description:
      'Les erreurs les plus fréquentes qui plombent ton portfolio de dev. Conseils pratiques pour te démarquer.',
    date: '2026-03-25',
    readingTime: '7 min',
    coverColor: '#2D5A3D',
  },
  {
    slug: 'quel-template-choisir',
    title: 'Quel template de portfolio choisir selon ton métier',
    description:
      'Dev, designer, photographe, étudiant... Guide pour choisir le template qui correspond à ton profil.',
    date: '2026-03-22',
    readingTime: '6 min',
    coverColor: '#4A3D8F',
  },
  {
    slug: 'portfolio-etudiant-stage-alternance',
    title: 'Portfolio étudiant : décrocher ton stage ou alternance',
    description:
      'Pourquoi un portfolio est ton meilleur atout pour décrocher un stage. Tips et exemples concrets.',
    date: '2026-03-20',
    readingTime: '6 min',
    coverColor: '#8B6914',
  },
  {
    slug: 'comparatif-outils-portfolio-2026',
    title: 'Créer un site portfolio gratuit : comparatif des outils 2026',
    description:
      'WordPress, Wix, Squarespace, Canva, Vizly... Comparaison honnête des solutions pour créer son portfolio.',
    date: '2026-03-18',
    readingTime: '8 min',
    coverColor: '#8F3D6B',
  },
]

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}

export function formatBlogDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}
