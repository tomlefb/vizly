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
    title: 'Comment creer un portfolio en ligne en 5 minutes',
    description:
      'Guide pas a pas pour creer ton portfolio professionnel avec Vizly. Du formulaire a la mise en ligne.',
    date: '2026-03-28',
    readingTime: '5 min',
    coverColor: '#D4634E',
  },
  {
    slug: 'portfolio-developpeur-erreurs',
    title: 'Portfolio developpeur : les 10 erreurs a eviter en 2026',
    description:
      'Les erreurs les plus frequentes qui plombent ton portfolio de dev. Conseils pratiques pour te demarquer.',
    date: '2026-03-25',
    readingTime: '7 min',
    coverColor: '#2D5A3D',
  },
  {
    slug: 'quel-template-choisir',
    title: 'Quel template de portfolio choisir selon ton metier',
    description:
      'Dev, designer, photographe, etudiant... Guide pour choisir le template qui correspond a ton profil.',
    date: '2026-03-22',
    readingTime: '6 min',
    coverColor: '#4A3D8F',
  },
  {
    slug: 'portfolio-etudiant-stage-alternance',
    title: 'Portfolio etudiant : decrocher ton stage ou alternance',
    description:
      'Pourquoi un portfolio est ton meilleur atout pour decrocher un stage. Tips et exemples concrets.',
    date: '2026-03-20',
    readingTime: '6 min',
    coverColor: '#8B6914',
  },
  {
    slug: 'comparatif-outils-portfolio-2026',
    title: 'Creer un site portfolio gratuit : comparatif des outils 2026',
    description:
      'WordPress, Wix, Squarespace, Canva, Vizly... Comparaison honnete des solutions pour creer son portfolio.',
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
