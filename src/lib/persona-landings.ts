import type { TemplateName } from '@/types/templates'

// Landing pages SEO long-tail ciblant les requêtes "portfolio {métier}".
// Chaque entrée génère une page statique `/{slug}` avec H1 keyword-targeted,
// contenu éditorial, template reco et CTA vers /register. Données ajoutées
// au sitemap.ts.
//
// Les clés i18n pour les titres/descriptions sont localisées — le slug lui
// reste fr-first puisque le targeting SEO est sur les requêtes françaises.

export interface PersonaLanding {
  slug: string
  persona: string
  headline: string
  headlineAccent: string
  metaTitle: string
  metaDescription: string
  intro: string
  primaryKeyword: string
  secondaryKeywords: string[]
  recommendedTemplate: TemplateName
  benefits: Array<{ title: string; description: string }>
  examples: string[]
}

export const PERSONA_LANDINGS: PersonaLanding[] = [
  {
    slug: 'portfolio-photographe',
    persona: 'photographe',
    headline: 'Crée ton portfolio de',
    headlineAccent: 'photographe',
    metaTitle: 'Portfolio photographe : crée ton site en ligne en 5 min',
    metaDescription:
      'Crée un portfolio photographe professionnel en ligne. Templates visuels, galeries pleine page, domaine personnalisé. Publie en quelques minutes.',
    intro:
      'Un portfolio photographe doit laisser parler tes images. Avec Vizly, choisis un template qui met tes photos au premier plan, personnalise les couleurs à ton univers visuel, et publie ton site sur pseudo.vizly.fr — ou sur ton propre nom de domaine.',
    primaryKeyword: 'portfolio photographe',
    secondaryKeywords: [
      'site portfolio photographe',
      'créer un portfolio photo',
      'book photographe en ligne',
      'portfolio photographe professionnel',
    ],
    recommendedTemplate: 'elegant',
    benefits: [
      {
        title: 'Galeries plein cadre',
        description:
          'Les templates Vizly affichent tes photos en grand format, sans compression inutile. L\'image est le héros de la page.',
      },
      {
        title: 'Upload direct',
        description:
          'Glisse tes photos depuis ton disque, Vizly les optimise automatiquement pour le web (WebP, responsive).',
      },
      {
        title: 'Ton domaine personnalisé',
        description:
          'Avec le plan Pro, branche ton propre nom de domaine (ex: jeandupont-photo.com) en quelques clics.',
      },
      {
        title: 'Formulaire de contact intégré',
        description:
          'Reçois les demandes de shooting directement par email, sans coder ni installer un plugin.',
      },
    ],
    examples: [
      'Book mariage',
      'Portfolio portraits studio',
      'Reportage photojournalisme',
      'Collection photographie de rue',
    ],
  },
  {
    slug: 'portfolio-developpeur',
    persona: 'développeur',
    headline: 'Crée ton portfolio de',
    headlineAccent: 'développeur',
    metaTitle: 'Portfolio développeur : site pro en ligne en 5 min',
    metaDescription:
      'Crée un portfolio développeur qui décroche des entretiens. Projets, stack, GitHub et CV en ligne. Hébergement inclus sur pseudo.vizly.fr.',
    intro:
      'Ton portfolio développeur est ta vitrine technique. Montre tes projets, liste ta stack, renvoie vers tes dépôts GitHub et décroche des entretiens sans passer des jours à coder ton propre site.',
    primaryKeyword: 'portfolio développeur',
    secondaryKeywords: [
      'portfolio developer',
      'portfolio web dev',
      'site portfolio développeur',
      'portfolio front-end',
      'portfolio full stack',
    ],
    recommendedTemplate: 'dark',
    benefits: [
      {
        title: 'Showcase de projets',
        description:
          'Chaque projet a sa carte dédiée avec description, stack technique, captures et liens vers le code ou la démo live.',
      },
      {
        title: 'Liens GitHub, LinkedIn, site',
        description:
          'Ajoute tous tes réseaux pros en un clic. Les recruteurs peuvent te suivre ou te contacter direct.',
      },
      {
        title: 'Responsive mobile-first',
        description:
          'Les recruteurs ouvrent ton lien sur mobile. Ton portfolio Vizly est parfait sur toutes les tailles d\'écran.',
      },
      {
        title: 'Ton subdomain pro',
        description:
          'Partage un lien clean type tonprenom.vizly.fr sur ton CV, LinkedIn ou signature email.',
      },
    ],
    examples: [
      'Portfolio front-end React / Next.js',
      'Portfolio back-end Node / Go',
      'Portfolio full stack',
      'Portfolio data / ML engineer',
    ],
  },
  {
    slug: 'portfolio-designer',
    persona: 'designer',
    headline: 'Crée ton portfolio de',
    headlineAccent: 'designer',
    metaTitle: 'Portfolio designer : site UI/UX en ligne en 5 min',
    metaDescription:
      'Crée un portfolio designer UI/UX ou graphique. Templates soignés, case studies, Dribbble et Behance intégrés. Publie en quelques minutes.',
    intro:
      'Un portfolio designer raconte une histoire. Avec Vizly, structure tes case studies, montre ton process, et laisse ton œil pour le détail parler — sans te battre avec un CMS ou un builder lourd.',
    primaryKeyword: 'portfolio designer',
    secondaryKeywords: [
      'portfolio UI UX',
      'portfolio graphiste',
      'portfolio direction artistique',
      'portfolio design produit',
      'portfolio designer freelance',
    ],
    recommendedTemplate: 'creatif',
    benefits: [
      {
        title: 'Case studies détaillés',
        description:
          'Pour chaque projet : contexte, problème, process, solution, résultats. Tout ce qu\'un recruteur ou client veut voir.',
      },
      {
        title: 'Liens Dribbble, Behance',
        description:
          'Ajoute tes profils en un clic et centralise ton identité design sur une seule URL.',
      },
      {
        title: 'Typo et couleurs sur-mesure',
        description:
          'Choisis ta font Google Font préférée, tes couleurs de marque, et fais du portfolio une extension de ton identité visuelle.',
      },
      {
        title: 'Domaine perso',
        description:
          'Passe sur ton propre domaine avec le plan Pro pour un branding complet.',
      },
    ],
    examples: [
      'Portfolio UX designer',
      'Portfolio UI designer',
      'Portfolio graphiste',
      'Portfolio direction artistique',
      'Portfolio motion designer',
    ],
  },
  {
    slug: 'portfolio-etudiant',
    persona: 'étudiant',
    headline: 'Crée ton portfolio',
    headlineAccent: 'étudiant',
    metaTitle: 'Portfolio étudiant : décroche ton stage ou alternance',
    metaDescription:
      'Crée un portfolio étudiant pour décrocher ton stage ou ton alternance. Projets scolaires, soft skills, expérience associative. Gratuit à créer.',
    intro:
      'Un bon portfolio étudiant fait la différence à l\'entretien. Montre tes projets scolaires, tes expériences associatives, tes compétences — et envoie un lien pro qui sort du lot par rapport au CV PDF classique.',
    primaryKeyword: 'portfolio étudiant',
    secondaryKeywords: [
      'portfolio stage',
      'portfolio alternance',
      'portfolio école',
      'portfolio BTS',
      'portfolio master',
    ],
    recommendedTemplate: 'minimal',
    benefits: [
      {
        title: 'Gratuit à créer',
        description:
          'Crée ton portfolio entièrement gratuitement. Tu ne paies qu\'au moment de le mettre en ligne (4,99 €/mois).',
      },
      {
        title: 'Projets scolaires valorisés',
        description:
          'Structure tes projets de cours ou associatifs avec description, stack ou outils utilisés et visuels.',
      },
      {
        title: 'Simple et rapide',
        description:
          'Pas besoin de coder. Remplis un formulaire, choisis un template, c\'est publié. Idéal si tu veux focus sur tes études.',
      },
      {
        title: 'Link ready pour CV et LinkedIn',
        description:
          'Mets ton lien Vizly sur ton CV, ton LinkedIn et tes candidatures. Les recruteurs cliquent.',
      },
    ],
    examples: [
      'Portfolio étudiant en école d\'ingénieur',
      'Portfolio étudiant design / école d\'art',
      'Portfolio étudiant BTS ou DUT',
      'Portfolio alternance',
    ],
  },
  {
    slug: 'portfolio-freelance',
    persona: 'freelance',
    headline: 'Crée ton portfolio',
    headlineAccent: 'freelance',
    metaTitle: 'Portfolio freelance : site pro qui convertit des clients',
    metaDescription:
      'Crée un portfolio freelance qui convertit. Projets, témoignages, tarifs, contact direct. Hébergé sur ton propre domaine avec le plan Pro.',
    intro:
      'En freelance, ton portfolio est ton meilleur commercial. Il doit inspirer confiance, expliquer ce que tu fais, et rendre le contact évident. Vizly te donne tout ça sans te coûter des journées de setup.',
    primaryKeyword: 'portfolio freelance',
    secondaryKeywords: [
      'site freelance',
      'portfolio indépendant',
      'portfolio consultant',
      'site web freelance',
    ],
    recommendedTemplate: 'elegant',
    benefits: [
      {
        title: 'Formulaire de contact Pro',
        description:
          'Reçois les demandes de mission directement par email. Anti-spam intégré, aucune configuration.',
      },
      {
        title: 'Domaine personnalisé',
        description:
          'Passe sur ton propre domaine pro avec le plan Pro — un gage de sérieux auprès des clients.',
      },
      {
        title: 'Mise à jour rapide',
        description:
          'Ajoute un nouveau projet en 2 minutes depuis n\'importe quel appareil. Ton portfolio reste toujours à jour.',
      },
      {
        title: 'Analytics intégrées',
        description:
          'Vois combien de visiteurs consultent ton portfolio chaque semaine, depuis quel pays, sur quel projet.',
      },
    ],
    examples: [
      'Portfolio freelance développeur',
      'Portfolio freelance designer',
      'Portfolio freelance rédacteur web',
      'Portfolio consultant freelance',
    ],
  },
]

export function getPersonaLanding(slug: string): PersonaLanding | undefined {
  return PERSONA_LANDINGS.find((p) => p.slug === slug)
}
