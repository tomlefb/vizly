# Portfolio Builder SaaS

> Le Carrd.co français, spécialisé portfolio. Un builder de portfolios en ligne où le client remplit un formulaire guidé, choisit un template, et son site portfolio est live instantanément sur `pseudo.vizly.fr` — sans aucune compétence technique.

---

## Systeme de memoire

**OBLIGATOIRE pour CHAQUE session Claude Code (agent ou direct) :**

### Au debut de chaque session :
1. Lire `MEMORY.md` en entier
2. Lire `.claude/status/current-sprint.md`
3. Lire `.claude/status/blockers.md`
4. Identifier ou on en est et ce qu'il reste a faire

### A la fin de chaque session :
1. Mettre a jour `MEMORY.md` :
   - Ajouter une entree dans "Historique des sessions"
   - Mettre a jour "Etat actuel du projet"
   - Ajouter les decisions dans le "Registre des decisions" si applicable
   - Mettre a jour les "Bugs connus" si applicable
   - Mettre a jour les "Dependances installees" si de nouvelles ont ete ajoutees
   - Mettre a jour le timestamp "Derniere mise a jour"
2. Mettre a jour `.claude/status/current-sprint.md` avec l'etat des taches
3. Mettre a jour `.claude/status/completed.md` si des taches sont terminees
4. Si des blockers existent, les noter dans `.claude/status/blockers.md`

### Regles :
- JAMAIS supprimer d'entrees dans l'historique des sessions -- c'est un append-only log
- Les decisions sont immuables une fois prises (on peut les marquer "revisee" mais pas les supprimer)
- Chaque agent qui travaille doit signer son entree (quel role : Designer, Senior Dev, etc.)
- En cas de conflit entre MEMORY.md et l'etat reel du code, c'est le code qui fait foi -- mettre a jour MEMORY.md

---

## Le problème

Les freelances, créatifs, développeurs, designers, photographes, architectes, étudiants ont tous besoin d'un portfolio en ligne. Aujourd'hui leurs options : WordPress (trop complexe), Wix/Squarespace (cher, usine à gaz), coder soi-même (90% ne savent pas), Canva (exporte un PDF, pas un site web). Il n'existe rien de simple, beau et spécialisé portfolio qui donne un vrai site live en 5 minutes.

## La cible

- Freelances et auto-entrepreneurs qui veulent une vitrine pro
- Étudiants et alternants qui cherchent un job ou un stage
- Créatifs non-tech (photographes, illustrateurs, architectes)
- Développeurs juniors qui veulent montrer leurs projets
- Marché France d'abord, puis international

---

## Le produit — Expérience utilisateur

Un formulaire guidé en étapes avec aperçu live en temps réel à côté. Pas un éditeur drag-and-drop. Le client remplit, il voit le résultat, il publie.

### Étape 1 — Infos personnelles
- Nom / prénom
- Titre / métier
- Photo de profil
- Bio courte
- Liens réseaux sociaux (LinkedIn, GitHub, Dribbble, Instagram, etc.)
- Email de contact

### Étape 2 — Projets
Pour chaque projet :
- Titre
- Description
- Images (jusqu'à 5 par projet)
- Lien externe optionnel
- Technos / compétences utilisées (tags)

### Étape 3 — Personnalisation
- Choix du template (4 gratuits + 4 premium à 2.99€)
- Choix des couleurs principales (2-3 couleurs)
- Choix de la typo (sélection de Google Fonts)

### Étape 4 — Preview
- Le client voit son portfolio en rendu final complet
- Il peut revenir modifier n'importe quelle étape
- À ce stade, il n'a pas encore payé

### Étape 5 — Publication (payant)
- Le client choisit son pseudo (slug pour l'URL)
- Il passe au paiement Stripe
- Son portfolio est live sur `pseudo.vizly.fr` instantanément
- Il peut revenir modifier à tout moment en se reconnectant

---

## Monétisation

### Plan gratuit (0€)
- Création complète du portfolio dans l'éditeur
- Preview du rendu final
- Projets illimités
- Accès aux 4 templates gratuits
- Pas de mise en ligne — le portfolio n'est pas publié

### Plan Starter (4.99€/mois)
- Portfolio live sur `pseudo.vizly.fr`
- Modification illimitée
- Projets illimités
- Accès aux 4 templates gratuits
- Badge "Fait avec [Vizly]" en footer
- Le site reste en ligne tant que l'utilisateur paie. S'il arrête → portfolio hors ligne sous 24h avec email d'avertissement.

### Plan Pro (9.99€/mois)
- Tout le plan Starter +
- Badge retiré
- Domaine custom (monnom.fr)
- Formulaire de contact intégré avec notifications email
- Analytics (nombre de vues du portfolio)

### Templates premium (2.99€ one-shot chacun)
- 4 templates premium achetables individuellement
- Achetés une fois, gardés pour toujours
- Disponibles pour les plans Starter et Pro (pas en gratuit car pas de mise en ligne)
- Nouveaux templates ajoutés régulièrement

### Résumé du pricing

| | Gratuit | Starter (4.99€/mois) | Pro (9.99€/mois) |
|---|---|---|---|
| Création + preview | ✅ | ✅ | ✅ |
| Mise en ligne | ❌ | pseudo.vizly.fr | pseudo.vizly.fr |
| Projets illimités | ✅ | ✅ | ✅ |
| 4 templates gratuits | ✅ | ✅ | ✅ |
| Templates premium (2.99€/unité) | ❌ | ✅ | ✅ |
| Badge "Fait avec" | — | affiché | retiré |
| Domaine custom | ❌ | ❌ | ✅ |
| Formulaire de contact | ❌ | ❌ | ✅ |
| Analytics | ❌ | ❌ | ✅ |

### Sources de revenus
1. Abonnements récurrents (Starter + Pro) — revenu principal
2. Vente de templates premium (2.99€ one-shot) — revenu complémentaire

### Objectif revenus
1 000 utilisateurs payants × panier moyen ~7€/mois = ~7 000€/mois récurrent

---

## Stack technique

| Couche | Techno | Notes |
|--------|--------|-------|
| Frontend + Backend | **Next.js 15** (App Router) | Formulaire éditeur + pages portfolio publiques dans le même projet |
| Base de données | **Supabase** (PostgreSQL) | Tables : users, portfolios, projects, purchased_templates |
| Authentification | **Supabase Auth** | Google OAuth + email/password |
| Stockage images | **Supabase Storage** ou **Cloudflare R2** | Images optimisées via `next/image` |
| Hosting | **Vercel** | Wildcard subdomain `*.vizly.fr` |
| Paiement | **Stripe** | Checkout pour abonnements (Starter/Pro) + achats one-shot (templates premium) |
| Emails transactionnels | **Resend** | Confirmation inscription, contact reçu, rappel expiration, avertissement hors ligne |
| Styling | **Tailwind CSS** + **shadcn/ui** | Design system cohérent |
| Tests | **Playwright** | E2E sur tous les flows critiques |

---

## MCP disponibles

Les agents disposent de serveurs MCP (Model Context Protocol) pour interagir directement avec l'infrastructure sans passer par les CLIs ou dashboards manuels.

| MCP | Identifiant | Capacites |
|-----|-------------|-----------|
| **Supabase** | `supabase` | Creer/modifier des tables, gerer les migrations, configurer les RLS policies, gerer les storage buckets, configurer l'auth (providers OAuth, email). Utiliser le MCP plutot que le CLI ou le dashboard quand c'est possible. |
| **Vercel** | `vercel` | Deployer, gerer les domaines (y compris le wildcard `*.vizly.fr`), configurer les env vars sur Vercel, monitorer les deploiements. Utiliser le MCP plutot que le dashboard quand c'est possible. |

---

## Architecture de la base de données

### Table `users`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| email | text | Email de l'utilisateur |
| name | text | Nom complet |
| plan | enum | free / starter / pro |
| stripe_customer_id | text | ID client Stripe |
| stripe_subscription_id | text | ID abonnement Stripe |
| created_at | timestamp | Date de création |

### Table `portfolios`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| user_id | uuid (FK → users) | Propriétaire |
| slug | text (unique) | Pseudo pour l'URL (pseudo.vizly.fr) |
| title | text | Titre / métier affiché |
| bio | text | Biographie |
| photo_url | text | URL de la photo de profil |
| template | text | Nom du template choisi |
| primary_color | text | Couleur principale (hex) |
| secondary_color | text | Couleur secondaire (hex) |
| font | text | Police Google Fonts choisie |
| social_links | jsonb | { linkedin, github, dribbble, instagram, twitter, website } |
| contact_email | text | Email affiché pour le contact |
| published | boolean | Mis en ligne ou non |
| custom_domain | text | Domaine custom (plan Pro) |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Dernière modification |

### Table `projects`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| portfolio_id | uuid (FK → portfolios) | Portfolio parent |
| title | text | Titre du projet |
| description | text | Description du projet |
| images | jsonb | Array d'URLs d'images |
| external_link | text | Lien vers le projet |
| tags | jsonb | Array de tags (technos, compétences) |
| display_order | integer | Ordre d'affichage |
| created_at | timestamp | Date de création |

### Table `purchased_templates`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| user_id | uuid (FK → users) | Acheteur |
| template_id | text | Identifiant du template acheté |
| stripe_payment_id | text | ID du paiement Stripe |
| purchased_at | timestamp | Date d'achat |

---

## Les templates

Chaque template est un composant React qui reçoit les mêmes données (infos perso, projets, couleurs, typo) et les affiche différemment. Ajouter un template = créer un nouveau composant, zéro modification au reste du code.

### Interface commune

```typescript
interface TemplateProps {
  portfolio: {
    title: string
    bio: string
    photo_url: string
    primary_color: string
    secondary_color: string
    font: string
    social_links: Record<string, string>
    contact_email: string
  }
  projects: Array<{
    title: string
    description: string
    images: string[]
    external_link?: string
    tags: string[]
  }>
  isPremium: boolean
}
```

### Templates gratuits (4)

**Template 1 — Minimal**
- Fond blanc, typo clean
- Grille de projets en cards
- Hover effects subtils
- Idéal pour : développeurs, profils corporate

**Template 2 — Dark**
- Fond sombre, accents néon
- Ambiance tech/dev
- Cards avec bordures lumineuses
- Idéal pour : développeurs, gamers, créatifs tech

**Template 3 — Classique**
- Structure type CV
- Sidebar avec infos personnelles
- Projets en liste à droite
- Idéal pour : étudiants, profils junior, candidatures

**Template 4 — Coloré**
- Couleurs vives, layout dynamique
- Ambiance fun et moderne
- Cards arrondies, ombres douces
- Idéal pour : community managers, marketeurs, profils créatifs

### Templates premium (4 × 2.99€ chacun)

**Template 5 — Créatif**
- Layout asymétrique
- Grandes images plein écran
- Animations au scroll
- Idéal pour : designers, photographes, directeurs artistiques

**Template 6 — Brutalist**
- Typo bold et oversized
- Layout cassé, grille déconstruite
- Tendance 2026
- Idéal pour : designers avant-gardistes, artistes

**Template 7 — Élégant**
- Typo serif, espaces généreux
- Ambiance luxe et raffinée
- Transitions douces
- Idéal pour : photographes, architectes, profils haut de gamme

**Template 8 — Bento**
- Layout en grid bento (blocs de tailles variées)
- Tendance Apple/2026
- Mix texte, images et stats dans une grille
- Idéal pour : product designers, UI/UX, profils polyvalents

**Tous les templates sont responsive mobile-first.**

---

## Wildcard subdomain (technique)

### Configuration DNS
Ajouter un enregistrement DNS : `*.vizly.fr` → CNAME vers `cname.vercel-dns.com`

### Middleware Next.js

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]

  if (subdomain === 'www' || hostname === 'vizly.fr') {
    return NextResponse.next()
  }

  return NextResponse.rewrite(
    new URL(`/portfolio/${subdomain}`, request.url)
  )
}
```

### Page portfolio dynamique
`/app/portfolio/[slug]/page.tsx` récupère les données du portfolio depuis Supabase via le slug et rend le template correspondant.

---

## Stripe Integration

### Webhooks à gérer

| Event | Action |
|-------|--------|
| `checkout.session.completed` (mode subscription) | Activer le plan, publier le portfolio |
| `checkout.session.completed` (mode payment) | Ajouter le template à `purchased_templates` |
| `customer.subscription.updated` | Mettre à jour le plan |
| `customer.subscription.deleted` | Marquer portfolio hors ligne, envoyer email |
| `invoice.payment_failed` | Envoyer email de rappel |

### Domaine custom (plan Pro)
- Vercel API pour ajouter un domaine custom au projet
- Le client achète son domaine ailleurs et pointe son DNS vers Vercel
- Doc/tuto intégré dans l'app pour guider le client

---

## Emails transactionnels (Resend)

1. Confirmation d'inscription
2. Formulaire de contact reçu (Pro)
3. Rappel avant expiration du plan
4. Avertissement de mise hors ligne

---

## Marketing (0€ budget)

### SEO (canal principal long terme)
Blog intégré avec articles ciblés : "comment créer un portfolio en ligne", "portfolio développeur exemple 2026", "portfolio photographe template", "créer un site portfolio gratuit", "portfolio alternance étudiant".

### TikTok / Instagram (sans visage)
Screen recordings de l'éditeur en accéléré avec musique. Carrousels Instagram avec des exemples de portfolios générés.

### Le hack viral
Le badge "Fait avec [Vizly]" sur chaque portfolio gratuit et Starter. Chaque portfolio partagé = publicité gratuite pour l'app.

---

## Roadmap MVP

### Semaine 1
- Setup projet Next.js + Supabase + Auth (Google OAuth + email)
- Landing page du site principal
- Formulaire éditeur : infos personnelles + gestion des projets
- Upload d'images vers Supabase Storage
- Aperçu live à côté du formulaire

### Semaine 2
- 4 templates gratuits (Minimal, Dark, Classique, Coloré)
- Wildcard subdomain + middleware Next.js
- Page portfolio publique fonctionnelle
- Publication en un clic
- Système de slug unique

### Semaine 3
- Intégration Stripe : abonnements (Starter + Pro) + paiements one-shot (templates premium)
- Webhooks Stripe pour activation/désactivation des plans
- Logique de mise hors ligne si paiement expiré
- 4 templates premium (Créatif, Brutalist, Élégant, Bento)
- Domaine custom (plan Pro) via Vercel API
- Emails transactionnels via Resend

### Semaine 4
- Polishing UI/UX
- Tests responsive (mobile, tablet, desktop)
- Premiers utilisateurs beta
- Itération sur les feedbacks
- Lancement soft

---

## Métriques de succès

| Période | Objectif |
|---------|----------|
| Mois 1 | 50-100 portfolios créés, valider que les gens finissent le flow |
| Mois 3 | 500 portfolios créés, 20-30 clients payants, ~150-200€ MRR |
| Mois 6 | 2 000+ portfolios, 100+ clients payants, ~700-800€ MRR |
| Mois 12 | 5 000+ portfolios, 500+ clients payants, ~3 500€ MRR |

---

## Coûts de fonctionnement

| Service | Coût |
|---------|------|
| Nom de domaine | ~10€/an |
| Vercel (free tier puis Pro) | 0€ → 20$/mois si >100k visites |
| Supabase (free tier puis Pro) | 0€ → 25$/mois si >50k users |
| Stripe | 1.4% + 0.25€ par transaction (UE) |
| Resend (free tier) | 0€ → 20$/mois si >3k emails/mois |
| **Total au démarrage** | **~10€/an** |

---

## Avantages compétitifs

- Tom maîtrise Next.js, React, Supabase — toute la stack du projet
- Tom a son propre portfolio (tomlfb.com) donc il connaît les besoins réels
- Claude Code pour un développement 3-5x plus rapide
- Tom est lui-même la cible (étudiant alternant avec portfolio)
- Son portfolio perso peut devenir le premier "exemple" showcase
- Marché français sous-servi par les outils anglophones existants
- Modèle de monétisation récurrent et anti-churn (le client ne veut pas que son site disparaisse)

---

## Structure du projet

```
appPortfolio/
|
|-- src/
|   |-- app/
|   |   |-- (marketing)/              # Route group -- pages publiques du site principal
|   |   |   |-- page.tsx              # Landing page
|   |   |   |-- pricing/
|   |   |   |   |-- page.tsx          # Page tarifs
|   |   |   |-- blog/
|   |   |   |   |-- page.tsx          # Liste des articles
|   |   |   |   |-- [slug]/
|   |   |   |       |-- page.tsx      # Article individuel
|   |   |   |-- layout.tsx            # Layout marketing (header + footer public)
|   |   |
|   |   |-- (auth)/                   # Route group -- authentification
|   |   |   |-- login/
|   |   |   |   |-- page.tsx          # Page de connexion
|   |   |   |-- register/
|   |   |   |   |-- page.tsx          # Page d'inscription
|   |   |   |-- auth/
|   |   |   |   |-- callback/
|   |   |   |       |-- route.ts      # Callback OAuth (Supabase Auth)
|   |   |   |-- layout.tsx            # Layout auth (centre, minimal)
|   |   |
|   |   |-- (dashboard)/              # Route group -- espace utilisateur connecte
|   |   |   |-- dashboard/
|   |   |   |   |-- page.tsx          # Dashboard principal (mon portfolio)
|   |   |   |-- editor/
|   |   |   |   |-- page.tsx          # Editeur multi-etapes avec preview live
|   |   |   |-- settings/
|   |   |   |   |-- page.tsx          # Parametres du compte
|   |   |   |-- billing/
|   |   |   |   |-- page.tsx          # Gestion abonnement et achats
|   |   |   |-- layout.tsx            # Layout dashboard (sidebar + auth guard)
|   |   |
|   |   |-- portfolio/
|   |   |   |-- [slug]/
|   |   |       |-- page.tsx          # Page portfolio publique (rendu du template)
|   |   |
|   |   |-- api/
|   |   |   |-- stripe-webhook/
|   |   |   |   |-- route.ts          # Webhook Stripe (POST)
|   |   |   |-- contact/
|   |   |   |   |-- route.ts          # Formulaire de contact (plan Pro)
|   |   |   |-- portfolio/
|   |   |   |   |-- route.ts          # CRUD portfolio
|   |   |   |-- projects/
|   |   |   |   |-- route.ts          # CRUD projets
|   |   |   |-- upload/
|   |   |   |   |-- route.ts          # Upload d'images
|   |   |   |-- check-slug/
|   |   |   |   |-- route.ts          # Verification disponibilite d'un slug
|   |   |   |-- domains/
|   |   |       |-- route.ts          # Gestion domaines custom (Vercel API)
|   |   |
|   |   |-- layout.tsx                # Root layout (fonts, metadata, providers)
|   |   |-- globals.css               # CSS global (Tailwind base, tokens, grain texture)
|   |   |-- not-found.tsx             # Page 404
|   |
|   |-- components/
|   |   |-- ui/                       # Composants shadcn/ui personnalises
|   |   |   |-- button.tsx
|   |   |   |-- input.tsx
|   |   |   |-- card.tsx
|   |   |   |-- dialog.tsx
|   |   |   |-- select.tsx
|   |   |   |-- toast.tsx
|   |   |   |-- skeleton.tsx
|   |   |   |-- badge.tsx
|   |   |   |-- ...
|   |   |
|   |   |-- templates/                # Les 8 templates portfolio
|   |   |   |-- TemplateMinimal.tsx    # Template 1 -- Gratuit
|   |   |   |-- TemplateDark.tsx       # Template 2 -- Gratuit
|   |   |   |-- TemplateClassique.tsx  # Template 3 -- Gratuit
|   |   |   |-- TemplateColore.tsx     # Template 4 -- Gratuit
|   |   |   |-- TemplateCreatif.tsx    # Template 5 -- Premium
|   |   |   |-- TemplateBrutalist.tsx  # Template 6 -- Premium
|   |   |   |-- TemplateElegant.tsx    # Template 7 -- Premium
|   |   |   |-- TemplateBento.tsx      # Template 8 -- Premium
|   |   |   |-- index.ts              # Export centralise + map template name -> component
|   |   |
|   |   |-- editor/                   # Composants de l'editeur multi-etapes
|   |   |   |-- EditorLayout.tsx      # Layout split (formulaire | preview)
|   |   |   |-- StepPersonalInfo.tsx   # Etape 1 -- Infos personnelles
|   |   |   |-- StepProjects.tsx       # Etape 2 -- Projets
|   |   |   |-- StepCustomization.tsx  # Etape 3 -- Personnalisation
|   |   |   |-- StepPreview.tsx        # Etape 4 -- Preview
|   |   |   |-- StepPublish.tsx        # Etape 5 -- Publication
|   |   |   |-- LivePreview.tsx        # Composant preview temps reel
|   |   |   |-- ProjectForm.tsx        # Formulaire d'un projet individuel
|   |   |   |-- ImageUploader.tsx      # Upload d'images avec preview
|   |   |   |-- StepNavigation.tsx     # Navigation entre etapes
|   |   |   |-- TemplateSelector.tsx   # Grille de selection des templates
|   |   |   |-- ColorPicker.tsx        # Selecteur de couleur
|   |   |   |-- FontSelector.tsx       # Selecteur de police
|   |   |
|   |   |-- marketing/               # Composants de la landing et pages publiques
|   |   |   |-- Hero.tsx              # Section hero de la landing
|   |   |   |-- Features.tsx          # Section features
|   |   |   |-- Pricing.tsx           # Tableau de prix
|   |   |   |-- Testimonials.tsx      # Temoignages
|   |   |   |-- Footer.tsx            # Footer global
|   |   |   |-- Header.tsx            # Header/navigation
|   |   |   |-- CTA.tsx               # Call-to-action
|   |   |
|   |   |-- shared/                   # Composants partages
|   |   |   |-- Logo.tsx              # Logo de l'application
|   |   |   |-- Badge.tsx             # Badge "Fait avec [Vizly]"
|   |   |   |-- SocialLinks.tsx       # Icones reseaux sociaux
|   |   |   |-- EmptyState.tsx        # Etat vide (aucun projet, etc.)
|   |   |   |-- ErrorBoundary.tsx     # Gestion d'erreurs React
|   |   |   |-- LoadingSkeleton.tsx   # Squelette de chargement
|   |
|   |-- lib/
|   |   |-- supabase/
|   |   |   |-- client.ts            # Client Supabase cote navigateur
|   |   |   |-- server.ts            # Client Supabase cote serveur (cookies)
|   |   |   |-- admin.ts             # Client Supabase service role (API routes)
|   |   |   |-- types.ts             # Types generes depuis le schema Supabase
|   |   |
|   |   |-- stripe/
|   |   |   |-- client.ts            # Instance Stripe cote serveur
|   |   |   |-- checkout.ts          # Creation de sessions Checkout
|   |   |   |-- webhooks.ts          # Handlers de webhooks par type d'event
|   |   |   |-- prices.ts            # Constantes des price IDs
|   |   |
|   |   |-- resend/
|   |   |   |-- client.ts            # Instance Resend
|   |   |   |-- templates.ts         # Templates d'emails (React Email)
|   |   |   |-- send.ts              # Fonctions d'envoi par type
|   |   |
|   |   |-- utils.ts                 # Utilitaires generaux (cn, formatDate, etc.)
|   |   |-- validations.ts           # Schemas Zod partages
|   |   |-- constants.ts             # Constantes du projet (plans, limites, etc.)
|   |
|   |-- hooks/
|   |   |-- usePortfolio.ts          # Hook de gestion du portfolio en cours d'edition
|   |   |-- useProjects.ts           # Hook CRUD projets
|   |   |-- useAuth.ts               # Hook d'authentification
|   |   |-- useImageUpload.ts        # Hook d'upload d'images
|   |   |-- useStripeCheckout.ts     # Hook pour lancer le checkout Stripe
|   |   |-- useDebounce.ts           # Hook de debounce generique
|   |
|   |-- types/
|   |   |-- index.ts                 # Types globaux du projet
|   |   |-- templates.ts             # TemplateProps et types associes
|   |   |-- database.ts              # Types de la base de donnees (generes)
|   |
|   |-- actions/
|   |   |-- portfolio.ts             # Server Actions pour le portfolio
|   |   |-- projects.ts              # Server Actions pour les projets
|   |   |-- auth.ts                  # Server Actions pour l'auth
|   |   |-- billing.ts              # Server Actions pour le billing
|   |
|   |-- middleware.ts                # Middleware wildcard subdomain
|
|-- supabase/
|   |-- migrations/                  # Migrations SQL (ordre chronologique)
|   |   |-- 001_create_users.sql
|   |   |-- 002_create_portfolios.sql
|   |   |-- 003_create_projects.sql
|   |   |-- 004_create_purchased_templates.sql
|   |   |-- 005_rls_policies.sql
|   |-- seed.sql                     # Donnees de test
|
|-- tests/
|   |-- e2e/
|   |   |-- auth.spec.ts            # Tests inscription/connexion
|   |   |-- editor.spec.ts          # Tests editeur complet
|   |   |-- templates.spec.ts       # Tests responsive des templates
|   |   |-- publication.spec.ts     # Tests publication + subdomain
|   |   |-- billing.spec.ts         # Tests paiement Stripe
|   |   |-- portfolio-public.spec.ts # Tests portfolio public
|   |-- fixtures/
|   |   |-- test-portfolio.ts       # Donnees de test portfolio
|   |   |-- test-user.ts            # Donnees de test utilisateur
|   |-- playwright.config.ts        # Config Playwright
|
|-- public/
|   |-- images/                     # Assets statiques
|   |-- fonts/                      # Fonts locales si necessaire
|
|-- .claude/
|   |-- commands/                   # Slash commands pour les agents
|   |-- status/                     # Fichiers de communication inter-agents
|   |-- settings.json               # Permissions Claude Code
|
|-- .agents/
|   |-- skills/                     # Skills installees (frontend-design, etc.)
|
|-- CLAUDE.md                       # Spec produit et conventions (ce fichier)
|-- AGENTS.md                       # Architecture multi-agent
|-- .env.example                    # Template des variables d'environnement
|-- .env.local                      # Variables d'environnement locales (gitignore)
|-- .gitignore
|-- next.config.ts                  # Config Next.js (images, domaines)
|-- tailwind.config.ts              # Config Tailwind (theme, fonts, couleurs)
|-- tsconfig.json                   # Config TypeScript strict
|-- package.json
|-- playwright.config.ts            # Config Playwright (ou dans tests/)
```

---

## Conventions de code

### TypeScript strict

Le projet utilise TypeScript en mode strict. Configuration requise dans `tsconfig.json` :
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Interdictions :
- `any` -- utiliser `unknown` avec narrowing ou Zod `.parse()`
- `@ts-ignore` -- corriger le type a la source
- `@ts-expect-error` -- sauf avec commentaire justificatif
- `as unknown as X` -- utiliser une validation runtime
- `!` (non-null assertion) -- verifier la valeur explicitement

### Nommage

| Element | Convention | Exemple |
|---------|------------|---------|
| Composants React | PascalCase, un composant par fichier | `ProjectCard.tsx` |
| Hooks | `use` + PascalCase | `usePortfolio.ts` |
| Utilitaires | camelCase | `formatDate.ts` |
| Types/Interfaces | PascalCase | `TemplateProps` |
| Constantes | UPPER_SNAKE_CASE | `MAX_IMAGE_SIZE` |
| Variables CSS | kebab-case avec prefix | `--color-primary` |
| API routes | kebab-case | `stripe-webhook/route.ts` |
| Fichiers de test | `[nom].spec.ts` | `editor.spec.ts` |

### React / Next.js

- Server Components par defaut. Ajouter `"use client"` UNIQUEMENT quand le composant utilise des hooks React (useState, useEffect, etc.), des event handlers, ou des API navigateur.
- Pas de `useEffect` pour du data fetching -- utiliser les Server Components ou SWR/React Query.
- Les formulaires utilisent Server Actions pour les mutations.
- Les props sont destructurees dans la signature de la fonction.
- Un composant = un fichier. Pas de multi-export de composants depuis un meme fichier (sauf index.ts de barrel).

### Validation

- Zod pour TOUTES les validations de donnees entrantes :
  - Inputs utilisateur dans les formulaires
  - Corps des requetes API
  - Payloads des webhooks (apres verification de signature)
  - Variables d'environnement (au demarrage)
- Les schemas Zod partages sont dans `src/lib/validations.ts`.
- Utiliser `z.infer<typeof schema>` pour deriver les types TypeScript des schemas.

### Base de donnees

- Row Level Security (RLS) sur 100% des tables. Aucune table sans politique de securite.
- Les migrations SQL sont numerotees sequentiellement dans `supabase/migrations/`.
- Les types de la base sont generes automatiquement et places dans `src/lib/supabase/types.ts`.
- Utiliser le client `server.ts` dans les Server Components et Server Actions.
- Utiliser le client `admin.ts` (service role) uniquement dans les API routes pour les operations privilegiees (webhooks, admin).

### Git

- Branches : `main` (production), `dev` (developpement), `feat/xxx`, `fix/xxx`, `refactor/xxx`
- Commits : `type(scope): description` en anglais
  - `feat(editor): add project image upload`
  - `fix(auth): handle expired session redirect`
  - `refactor(templates): extract shared layout component`
  - `style(landing): adjust hero spacing`
  - `test(billing): add stripe checkout e2e test`
  - `docs(readme): update setup instructions`
  - `chore(deps): update next.js to 15.x`
- Une PR par feature/fix. Pas de PR geantes multi-features.
- Rebase sur `dev` avant merge.

---

## Design System

### Principes fondamentaux

Le design de cette application suit la philosophie "Refined Modern". Chaque decision visuelle est intentionnelle. Le but est de creer une experience qui inspire confiance et donne envie de l'utiliser -- pas un enieme SaaS generique.

**Principes issus de la skill frontend-design (Anthropic)** :
1. **Design Thinking Process** -- Avant de coder, comprendre le contexte et s'engager dans une direction esthetique AUDACIEUSE (purpose, tone, contraintes, differenciation).
2. **Intention** -- Choisir une direction conceptuelle claire et l'executer avec precision. Le maximalisme audacieux et le minimalisme raffine fonctionnent tous les deux. L'intentionnalite est la cle.
3. **Production-grade** -- Le code produit doit etre visuellement frappant, memorable, cohesif, et pret pour la production.

**Principes issus de la skill web-design-guidelines (Vercel)** :
- Avant chaque review UI, recuperer les guidelines fraiches et verifier la conformite.
- Appliquer toutes les regles dans un format concis `fichier:ligne`.

**Principes issus de la skill ui-ux-pro-max** :
- Accessibilite (CRITIQUE) : contraste 4.5:1 minimum, alt text, navigation clavier, aria-labels
- Touch et interaction (CRITIQUE) : taille minimum 44x44pt, espacement 8px+, feedback de chargement
- Performance (HAUTE) : WebP/AVIF, lazy loading, CLS < 0.1
- Layout et responsive (HAUTE) : mobile-first, pas de scroll horizontal, viewport meta
- Typographie et couleur (MOYENNE) : base 16px, line-height 1.5, tokens semantiques
- Animation (MOYENNE) : 150-300ms, mouvement avec sens, continuite spatiale
- Formulaires et feedback (MOYENNE) : labels visibles, erreurs pres du champ, disclosure progressive
- Navigation (HAUTE) : retour previsible, bottom nav <= 5 items, deep linking

### Anti-patterns interdits (AI Slop)

Ces patterns sont INTERDITS dans tout le projet. Leur presence dans un composant entraine un rejet systematique en design review.

1. **Gradients generiques** -- Pas de gradient violet-bleu sur fond blanc. Pas de gradient lineaire generique. Si gradient il y a, il doit avoir une direction artistique et un but.
2. **Fonts generiques en display** -- Inter, Roboto, Arial, system-ui, et Space Grotesk sont interdits comme font d'affichage. Chaque template utilise une font display distinctive et unique.
3. **Layouts symetriques sans personnalite** -- Les compositions doivent avoir de la tension, de l'asymetrie, de la hierarchie. Un layout parfaitement centre sans element distinctif est rejete.
4. **Border-radius uniforme** -- Pas de `rounded-xl` sur absolument tout. Varier les rayons en fonction du contexte : cartes, boutons, avatars, badges ont des rayons differents.
5. **Ombres sans intention** -- `shadow-md` par defaut sur chaque card est interdit. Les ombres servent a creer de la profondeur et de la hierarchie, pas a decorer.
6. **Palettes pastelles fades** -- Les couleurs doivent avoir du contraste et de la personnalite. Pas de bleu-gris-pastel generique.
7. **Composants shadcn/ui par defaut** -- TOUJOURS personnaliser les composants shadcn/ui. Les styles par defaut sont un point de depart, pas un livrable.
8. **Cards identiques en grille parfaite** -- Varier les tailles, les emphases, la hierarchie dans les grilles. Toutes les cards ne se valent pas.

### Direction artistique de l'application

**App elle-meme (landing, editeur, dashboard)** :
- Style : Refined Modern
- Font display : Cabinet Grotesk OU Satoshi OU General Sans (decider en Phase 1, s'y tenir)
- Font body : DM Sans OU Plus Jakarta Sans (decider en Phase 1, s'y tenir)
- Fond : #FAFAF8 (warm white) -- pas de blanc pur (#FFFFFF)
- Texte : #1A1A1A -- pas de noir pur (#000000)
- Accent : a definir en Phase 1 (PAS violet, PAS bleu generique)
- Espacement : genereux. Le blanc est un element de design.
- Texture : grain/noise subtil sur les backgrounds (opacity 3-5%)
- Bordures : fines, subtiles, #E8E6DC ou similaire
- Ombres : legeres et chaudes, jamais grises froides

**Templates portfolio (les 8)** :
Chaque template a sa propre identite visuelle COMPLETEMENT distincte. Les fonts, les palettes, les layouts, les animations sont uniques a chaque template. Voir le tableau des fonts dans `.claude/status/design-decisions.md`.

### Fonts par template

Tableau de reference. CHAQUE template utilise une paire de fonts UNIQUE. Les fonts de l'application elle-meme (Cabinet Grotesk/DM Sans ou equivalent) ne sont PAS reutilisees dans les templates.

| Template | Display font (candidates) | Body font (candidates) | Style visuel |
|----------|--------------------------|----------------------|-------------|
| Minimal | Outfit, Manrope | Source Sans 3, Nunito Sans | Clean, epure, corporate |
| Dark | JetBrains Mono, Fira Code | IBM Plex Sans, Barlow | Tech, neon, futuriste |
| Classique | Merriweather, Playfair Display | Lato, Open Sans | Structuree, CV, serieuse |
| Colore | Fredoka, Quicksand | Nunito, Rubik | Fun, arrondi, dynamique |
| Creatif | Syne, Space Grotesk | Work Sans, Karla | Asymetrique, bold, artistique |
| Brutalist | Bebas Neue, Oswald | Roboto Mono, Inconsolata | Brut, oversized, casse |
| Elegant | Cormorant Garamond, Libre Baskerville | Raleway, Jost | Serif, luxe, raffine |
| Bento | Inter Tight, Geist Sans | Geist Mono, Red Hat Display | Grid, moderne, Apple-like |

Note : Ces sont des candidats. Le Designer fait le choix final et le documente dans `design-decisions.md`. La seule regle absolue : PAS DE DOUBLON entre templates.

### Composants shadcn/ui -- personnalisation obligatoire

Les composants shadcn/ui (issus de la skill shadcn-ui) sont utilises comme base. Guide d'installation :
```bash
npx shadcn@latest init
npx shadcn@latest add button input form card dialog select toast skeleton badge
```

**Apres installation, personnaliser obligatoirement** :
- Les CSS variables dans `globals.css` pour matcher le design system
- Les variants de bouton pour correspondre a la direction artistique
- Les border-radius par composant (pas d'uniformite)
- Les couleurs de focus ring
- Les transitions (duree et easing coherents avec le design system)

**Best practices shadcn/ui** :
- Accessibilite : les primitives Radix UI gerent les ARIA attributes
- `"use client"` sur les composants interactifs
- Type safety avec TypeScript et Zod pour les formulaires
- Theming via CSS variables dans `globals.css`
- Modifier les fichiers directement (ce ne sont pas des dependances npm)
- Dark mode via CSS variables strategy et `next-themes`
- Formulaires : toujours utiliser Form, FormField, FormItem, FormLabel, FormMessage ensemble
- Ajouter `<Toaster />` une seule fois dans le root layout

### Accessibilite WCAG 2.1 AA

Niveau minimum exige : AA. Checklist pour chaque composant :

- Contraste texte/fond : 4.5:1 minimum (3:1 pour les grands textes >= 18px bold ou >= 24px)
- Tout element interactif focusable avec un indicateur de focus visible
- Ordre de tabulation logique et coherent
- aria-label sur les elements sans texte visible (icones, boutons icon-only)
- aria-live="polite" sur les zones de mise a jour dynamique (toasts, erreurs de formulaire)
- Images avec alt text descriptif (pas "image", pas vide sauf decoratif avec role="presentation")
- Structure heading hierarchique (h1 > h2 > h3, pas de saut)
- Formulaires avec labels associes via htmlFor/id
- Echap pour fermer les modales et overlays
- Pas de dependance au hover -- alternatives pour mobile et clavier
- Support de prefers-reduced-motion (desactiver ou reduire les animations)
- Support de prefers-color-scheme si dark mode implemente

### Animations

**Principes** :
- Chaque animation a un but fonctionnel (indiquer un changement d'etat, guider l'attention, creer de la continuite)
- Pas d'animation purement decorative
- Durees : 150-300ms pour les micro-interactions, 300-500ms pour les transitions de page
- Easing : `ease-out` (cubic-bezier(0, 0, 0.2, 1)) pour les entrees, `ease-in` pour les sorties
- Proprietes animees : uniquement `transform` et `opacity` pour la performance (GPU-accelerated)
- Staggered reveals : delai de 50-100ms entre les elements d'une liste
- prefers-reduced-motion : TOUJOURS respecter. Si l'utilisateur a cette preference, les animations sont reduites ou supprimees.

**Implementation** :
- Framer Motion pour les animations complexes (page transitions, scroll-triggered, staggered)
- CSS transitions pour les micro-interactions simples (hover, focus, active)
- Pas de CSS keyframes sauf cas tres simple
- Pas de librairie d'animation supplementaire (pas de GSAP, pas de Anime.js)

### Backgrounds et textures

- Fond principal de l'app : #FAFAF8 (warm white)
- Texture grain/noise : appliquee en overlay CSS avec un SVG ou une image PNG, opacity 3-5%
- Les fonds ne sont JAMAIS blanc pur (#FFFFFF) ni gris froid
- Les templates portfolio peuvent utiliser des fonds radicalement differents (dark, colore, texture lourde) selon leur direction artistique
- Gradient mesh ou gradient doux autorises UNIQUEMENT s'ils sont subtils et coherents avec la direction artistique du template

---

## Performance

### Images

- Utiliser `next/image` SYSTEMATIQUEMENT pour toutes les images
- Format : WebP ou AVIF en priorite (Next.js gere la conversion automatique)
- Lazy loading par defaut (attribut `loading="lazy"` ou priorite `priority` uniquement pour les images above-the-fold)
- Dimensions explicites (`width` et `height`) pour eviter le CLS
- Placeholder blur pour les images de portfolio (`placeholder="blur"`)
- Taille max upload : 5 Mo (configurable via env var)
- Les images uploadees sont stockees dans Supabase Storage et servies via le CDN Supabase

### Fonts

- Chargement via `next/font/google` avec `display: "swap"`
- Preload automatique par Next.js
- Subset `latin` pour reduire la taille
- Les fonts sont declarees dans le root layout et appliquees via CSS variables
- Exemple :
```typescript
import { Cabinet_Grotesk, DM_Sans } from 'next/font/google'

const displayFont = Cabinet_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

const bodyFont = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})
```

### Code splitting et lazy loading

- Les templates portfolio sont charges en lazy avec `next/dynamic` :
```typescript
import dynamic from 'next/dynamic'

const templateMap = {
  minimal: dynamic(() => import('@/components/templates/TemplateMinimal')),
  dark: dynamic(() => import('@/components/templates/TemplateDark')),
  // ...
}
```
- Chaque template doit peser < 50KB gzipped
- Pas de `import *` -- importer uniquement ce qui est utilise
- Les composants lourds de l'editeur (ColorPicker, ImageUploader) sont lazy-loaded

### Rendu des portfolios publics

- ISR (Incremental Static Regeneration) avec `revalidate: 60` (1 minute)
- Les portfolios publics sont pre-rendus cote serveur et mis en cache
- La revalidation se declenche automatiquement apres modification via le dashboard
- Metadata dynamique pour le SEO de chaque portfolio (title, description, og:image)

### Metriques cibles

| Metrique | Seuil | Mesure |
|----------|-------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse |
| FID (First Input Delay) | < 100ms | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| Score Performance Lighthouse | > 90 | Lighthouse |
| Score Accessibilite Lighthouse | > 95 | Lighthouse |
| Taille bundle template | < 50KB gzipped | next build analyze |
| Temps de build portfolio | < 3s | Vercel logs |

---

## Commandes utiles

### Developpement

```bash
# Demarrer le serveur de dev
npm run dev

# Build de production
npm run build

# Lancer le build de production en local
npm run start

# Verification des types TypeScript
npm run typecheck
# (commande package.json : "typecheck": "tsc --noEmit")

# Linting
npm run lint

# Formattage
npm run format
# (commande package.json : "format": "prettier --write .")
```

### Supabase

```bash
# Demarrer Supabase en local
supabase start

# Arreter Supabase local
supabase stop

# Creer une nouvelle migration
supabase migration new [nom_migration]

# Appliquer les migrations
supabase db push

# Generer les types TypeScript depuis le schema
supabase gen types typescript --local > src/lib/supabase/types.ts

# Reset la base locale (supprime toutes les donnees)
supabase db reset

# Voir le status Supabase local
supabase status
```

### Tests Playwright

```bash
# Installer les navigateurs Playwright
npx playwright install

# Lancer tous les tests
npx playwright test

# Lancer un fichier de test specifique
npx playwright test tests/e2e/editor.spec.ts

# Lancer les tests en mode UI (debug visuel)
npx playwright test --ui

# Lancer les tests avec le navigateur visible
npx playwright test --headed

# Generer un rapport HTML
npx playwright show-report
```

### Stripe (mode test)

```bash
# Ecouter les webhooks en local (redirige vers localhost:3000)
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Declencher un event de test
stripe trigger checkout.session.completed

# Lister les produits
stripe products list

# Lister les prix
stripe prices list

# Voir les logs des webhooks
stripe logs tail
```

### Git

```bash
# Creer une branche feature
git checkout -b feat/nom-de-la-feature

# Commit avec convention
git commit -m "feat(scope): description"

# Rebase sur dev avant PR
git fetch origin && git rebase origin/dev

# Push et creer la PR
git push -u origin feat/nom-de-la-feature
```

### Claude Code (agents)

```bash
# Lancer un sprint
/sprint 1

# Review design d'un composant
/design-review src/components/templates/TemplateMinimal.tsx

# Creer un nouveau template
/new-template Brutalist

# Session QA
/qa editor

# Voir le status du projet
/status

# Orchestrer une mission
/orchestrate "Implementer le flow d'inscription Google OAuth"
```
