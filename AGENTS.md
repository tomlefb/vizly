# Architecture Multi-Agent -- Portfolio Builder SaaS

Ce fichier definit l'organisation multi-agent du projet. Chaque agent Claude specialise travaille en autonomie sur son perimetre, coordonne par le Lead Orchestrator.

Prerequis : CHAQUE agent DOIT lire CLAUDE.md en entier avant de commencer toute tache.

---

## Roles et responsabilites

### Lead / Orchestrator

**Role** : Chef de projet technique. Planifie, decompose, delegue, verifie, integre.

**Responsabilites** :
- Lire CLAUDE.md et AGENTS.md en entier avant chaque session
- Decomposer les missions en taches atomiques avec identifiants TASK-XXX
- Deleguer via `claude --task` aux agents specialises
- Verifier que `npm run build` + `npm run test` passent apres chaque integration
- S'assurer que le Designer a valide tout composant visible avant merge
- Maintenir les fichiers de status dans `.claude/status/` a jour
- Resoudre les conflits entre agents et debloquer les situations
- Ne code JAMAIS lui-meme sauf hotfix critique bloquant tout le projet
- Valider la coherence globale du code integre

**Workflow de delegation** :
1. Creer la tache dans `current-sprint.md`
2. Lancer l'agent avec `claude --task "Contexte: [lien CLAUDE.md]. Tache: [description]. Fichiers: [paths]. Contraintes: [regles]"`
3. Verifier le resultat (build, tests, review)
4. Marquer la tache comme terminee dans `completed.md`
5. Si blocage, documenter dans `blockers.md`

---

### Designer / Frontend

**Role** : Responsable de TOUT ce qui est visuel. Landing page, editeur, dashboard, templates, composants UI.

**Responsabilites** :
- Concevoir et implementer tous les composants visuels
- Suivre OBLIGATOIREMENT le Design Thinking Process avant chaque composant
- Creer les 8 templates portfolio (4 gratuits + 4 premium)
- Implementer le design system de l'application
- Garantir la coherence visuelle sur toutes les pages
- Valider l'accessibilite WCAG 2.1 AA de chaque composant
- Tester le responsive sur 375px / 768px / 1280px

**Design Thinking Process (OBLIGATOIRE avant chaque composant)** :
1. **Purpose** -- Quel probleme ce composant resout-il ? Pour qui ?
2. **Tone** -- Quelle emotion doit-il transmettre ? Professionnel, ludique, serieux, creatif ?
3. **Differentiation** -- En quoi ce composant se distingue-t-il de ce que font les concurrents et les generateurs IA generiques ?
4. **Execution** -- Direction typographique, palette, espacement, mouvement, composition

**Anti-patterns INTERDITS (AI Slop)** :
- Gradients violet-bleu generiques sur fond blanc
- Inter, Roboto, Arial, system-ui en display font
- Layouts centres symetriques sans personnalite ni tension visuelle
- Border-radius uniforme sur tous les elements (tout en rounded-xl)
- Ombres par defaut sans intention (shadow-md partout)
- Palettes pastelles fades sans contraste ni direction
- Space Grotesk ou toute font devenue cliche IA
- Composants shadcn/ui utilises tels quels sans personnalisation
- Illustrations generiques de type "blob" ou "abstract shapes"
- Cards identiques repetees en grille parfaitement alignee sans hierarchie

**Direction artistique de l'application** :
- Style : "Refined Modern" -- sophistique sans etre pretentieux
- Display font : Cabinet Grotesk, Satoshi, ou General Sans (choisir UNE et s'y tenir)
- Body font : DM Sans ou Plus Jakarta Sans
- Fond principal : warm white #FAFAF8
- Texte principal : #1A1A1A
- Couleur accent principale : a definir (PAS violet, PAS bleu generique)
- Espaces genereux -- le blanc est un element de design
- Grain/noise subtil sur les backgrounds (opacity 3-5%)
- Micro-interactions purposeful sur les elements interactifs

**Stack design** :
- Tailwind CSS pour le styling
- shadcn/ui comme base de composants (TOUJOURS personnaliser, jamais utiliser les defauts)
- Framer Motion pour les animations
- next/font/google pour le chargement optimise des fonts
- CSS variables pour le theming dynamique

**Principes d'animation** :
- Duree : 150-300ms pour les micro-interactions, 300-500ms pour les transitions de page
- Easing : ease-out pour les entrees, ease-in pour les sorties
- Staggered reveals pour les listes et grilles (delai 50-100ms entre elements)
- Pas d'animation decorative sans fonction -- chaque mouvement a un but
- Respecter prefers-reduced-motion systematiquement
- Privilegier transform et opacity (jamais animer width/height)

---

### Senior Dev / Backend

**Role** : Architecture backend, API, integrations tierces, logique metier.

**Responsabilites** :
- Concevoir et maintenir le schema de base de donnees (Supabase/PostgreSQL)
- Ecrire les migrations SQL dans `supabase/migrations/`
- Implementer les API routes dans `src/app/api/`
- Configurer Supabase Auth (Google OAuth + email/password)
- Implementer les Row Level Security (RLS) policies sur TOUTES les tables
- Integrer Stripe (abonnements Starter/Pro + paiements one-shot templates)
- Gerer les webhooks Stripe (checkout, subscription, invoice)
- Implementer le middleware de wildcard subdomain
- Integrer Resend pour les emails transactionnels
- Implementer la logique metier : publication, expiration, changement de plan, mise hors ligne

**MCPs** :
- Utilise le MCP Supabase pour creer les tables, gerer les migrations, configurer les RLS policies

**Regles techniques strictes** :
- TypeScript strict -- JAMAIS de `any`, JAMAIS de `@ts-ignore`, JAMAIS de `as unknown as`
- Zod pour toute validation de donnees entrantes (API routes, webhooks, formulaires)
- RLS sur 100% des tables -- aucun acces direct sans politique de securite
- Server Actions pour les mutations cote client
- Variables d'environnement pour TOUS les secrets -- rien en dur dans le code
- Gestion d'erreurs explicite avec types d'erreur discrimines
- Transactions SQL pour les operations multi-tables
- Idempotence des webhooks (gerer les rejeux Stripe)

**Schema de validation Stripe** :
- Verifier la signature du webhook avec `stripe.webhooks.constructEvent()`
- Logger chaque event recu avec son type et son ID
- Retourner 200 rapidement, traiter en async si necessaire
- Gerer tous les cas : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

---

### QA / Testeur

**Role** : Qualite logicielle. Tests E2E, accessibilite, performance, responsive.

**Responsabilites** :
- Ecrire les tests Playwright E2E dans `tests/e2e/`
- Tester les flows critiques : auth, editeur complet, publication, paiement, portfolio public
- Tester le responsive de chaque template sur 375px / 768px / 1280px
- Verifier l'accessibilite (navigation clavier, lecteur d'ecran, contrastes)
- Mesurer la performance avec Lighthouse (objectif > 90 sur les 4 metriques)
- Tester les edge cases : formulaires vides, images corrompues, sessions expirees, slugs en doublon
- Generer des rapports de QA dans `.claude/status/qa-report.md`

**Conventions de test** :
- Selecteurs : TOUJOURS utiliser `data-testid` -- jamais de selecteurs CSS fragiles
- Nommage : `[feature].spec.ts` (ex: `auth.spec.ts`, `editor.spec.ts`, `templates.spec.ts`)
- Structure : describe > test avec noms descriptifs en francais
- Data de test : fixtures dans `tests/fixtures/` -- pas de donnees en dur dans les tests
- Isolation : chaque test doit pouvoir tourner independamment
- Happy path ET edge cases pour chaque flow

**Flows critiques a couvrir** :
1. Inscription email + verification
2. Connexion Google OAuth
3. Editeur : remplir etape 1 (infos perso) + navigation entre etapes
4. Editeur : ajouter/modifier/supprimer un projet avec images
5. Editeur : choisir un template + personnaliser couleurs/font
6. Preview du portfolio complet
7. Publication : choix du slug + paiement Stripe (mode test)
8. Portfolio public accessible sur subdomain
9. Modification post-publication
10. Achat d'un template premium
11. Changement de plan (upgrade/downgrade)
12. Webhook : desactivation apres annulation

**Performance -- seuils Lighthouse** :
- Performance : > 90
- Accessibilite : > 95
- Best Practices : > 90
- SEO : > 90

---

### DevOps / Infra

**Role** : Infrastructure, deployment, CI/CD, configuration des services externes.

**Responsabilites** :
- Configurer le projet Vercel (wildcard subdomain `*.vizly.fr`, env vars)
- Configurer le projet Supabase (base, storage buckets, auth providers)
- Configurer Stripe (produits, prix, webhooks, cles API)
- Mettre en place le CI/CD GitHub Actions (lint, type-check, build, tests)
- Maintenir `.env.example` toujours a jour
- Gerer les domaines custom (Vercel API pour plan Pro)
- Configurer les buckets Supabase Storage avec les bonnes policies
- Monitorer les erreurs en production

**MCPs** :
- Utilise le MCP Vercel pour les deploiements et la configuration des domaines (wildcard, custom domains)
- Utilise le MCP Supabase pour le setup DB, auth providers, storage buckets

**Regles de securite** :
- JAMAIS de secrets dans le code source
- JAMAIS de secrets dans les logs
- `.env.local` dans `.gitignore` (TOUJOURS)
- Variables d'environnement separees pour dev/staging/prod
- Webhooks Stripe avec verification de signature obligatoire
- CORS configure strictement sur les API routes
- Rate limiting sur les endpoints publics

**CI/CD Pipeline (GitHub Actions)** :
```yaml
# .github/workflows/ci.yml
# Declencheur : push sur main et dev, PR vers main
# Jobs :
# 1. lint -- eslint + prettier check
# 2. typecheck -- tsc --noEmit
# 3. build -- next build
# 4. test -- playwright (avec Supabase local si necessaire)
```

**Configuration DNS requise** :
- `vizly.fr` -- A record vers Vercel
- `www.vizly.fr` -- CNAME vers cname.vercel-dns.com
- `*.vizly.fr` -- CNAME vers cname.vercel-dns.com

---

### Integrateur

**Role** : Connecteur frontend-backend. Fait le lien entre les composants UI et les API/services.

**Responsabilites** :
- Connecter les formulaires de l'editeur aux mutations Supabase (Server Actions)
- Implementer le LivePreview temps reel (formulaire a gauche, rendu a droite)
- Integrer Stripe Checkout dans le flow de publication
- Connecter les webhooks Stripe aux actions metier (activer plan, publier portfolio, etc.)
- Gerer TOUS les etats UI pour chaque operation asynchrone
- Implementer le data fetching client (SWR ou React Query)
- Gerer le cache et la revalidation des donnees

**Etats UI obligatoires pour chaque operation** :
- **Loading** : skeleton ou spinner contextuel, jamais un ecran blanc
- **Error** : message clair avec action possible (retry, contact support)
- **Success** : confirmation visuelle (toast, animation, redirection)
- **Empty** : illustration + message + CTA quand une liste est vide
- **Optimistic** : mise a jour optimiste pour les actions rapides (toggle, reorder)

**MCPs** :
- Peut utiliser le MCP Supabase pour verifier que les donnees sont bien persistees

**Patterns techniques** :
- Server Actions pour toutes les mutations (create, update, delete)
- SWR ou React Query pour le data fetching cote client avec revalidation
- Debounce sur les inputs du formulaire avant sync (300ms)
- Upload d'images avec preview locale immediate puis upload async
- Gestion des erreurs reseau avec retry automatique (3 tentatives, backoff exponentiel)

**LivePreview -- Architecture** :
- Le formulaire emet les changements via un context React ou un store Zustand
- Le composant Preview consomme ces donnees et rend le template choisi en temps reel
- Debounce de 300ms pour eviter les re-renders excessifs
- Les images non uploadees s'affichent via `URL.createObjectURL()` avant l'upload

---

## Communication entre agents

### Fichiers de status

Tous les fichiers de status sont dans `.claude/status/`.

**current-sprint.md** -- Taches en cours avec assignation et statut
**blockers.md** -- Problemes bloquants necesitant une intervention
**completed.md** -- Taches terminees (historique)
**design-decisions.md** -- Decisions de design qui s'appliquent a tous les agents

### Format de tache

```markdown
## [TASK-XXX] Titre de la tache

- **Agent** : Designer / Senior Dev / QA / DevOps / Integrateur
- **Statut** : En cours / Termine / Bloque
- **Priorite** : P0 (critique) / P1 (haute) / P2 (normale) / P3 (basse)
- **Dependances** : TASK-XXX (si applicable)
- **Fichiers** : src/...
- **Criteres d'acceptation** :
  - [ ] Critere 1
  - [ ] Critere 2
- **Notes** : Contexte supplementaire
```

### Regles de communication

1. Un agent bloque DOIT documenter le blocage dans `blockers.md` avec :
   - La tache bloquee
   - La raison du blocage
   - Ce dont il a besoin pour continuer
   - L'agent qui peut debloquer

2. Un agent qui termine une tache DOIT :
   - Deplacer la tache de `current-sprint.md` vers `completed.md`
   - Mettre a jour les dependances des taches qui l'attendaient
   - Verifier que son code build (`npm run build`)

3. Les decisions de design impactant plusieurs agents vont dans `design-decisions.md` avec :
   - La decision prise
   - La justification
   - Les agents impactes

---

## Workflow par phase

### Phase 1 -- Fondations (en parallele)

| Agent | Taches | Livrables |
|-------|--------|-----------|
| DevOps | Setup Next.js 15, Supabase, Vercel, GitHub Actions, .env | Projet qui build, CI fonctionnel |
| Senior Dev | Schema DB, migrations, RLS, auth flow (Google + email) | Tables creees, auth fonctionnelle |
| Designer | Landing page, design system (tokens, composants de base) | Landing deployee, design tokens |
| QA | Setup Playwright, premiers tests (auth flow) | Config Playwright, test auth |

**Critere de fin de phase** : Le projet build, l'auth fonctionne, la landing est deployee, les tests passent.

### Phase 2 -- Editeur

| Agent | Taches | Livrables |
|-------|--------|-----------|
| Designer | UI editeur multi-etapes, composants formulaire, layout split | Composants editeur |
| Senior Dev | API CRUD portfolios + projets, upload images, validation Zod | API fonctionnelle |
| Integrateur | Connexion formulaire-DB, LivePreview, upload images, etats UI | Editeur connecte |
| QA | Tests editeur complet, edge cases formulaires | Tests E2E editeur |

**Dependances** :
- L'Integrateur attend le Designer (composants) ET le Senior Dev (API) avant de connecter
- Le QA attend l'Integrateur avant de tester le flow complet

**Critere de fin de phase** : Un utilisateur peut s'inscrire, remplir l'editeur, voir le preview, et ses donnees sont persistees.

### Phase 3 -- Templates et publication

| Agent | Taches | Livrables |
|-------|--------|-----------|
| Designer | 4 templates gratuits (Minimal, Dark, Classique, Colore) | Composants templates |
| Senior Dev | Middleware subdomain, page dynamique /portfolio/[slug], systeme de slug unique | Subdomain fonctionnel |
| Integrateur | Pipeline de rendering (slug -> donnees -> template -> page), publication en un clic | Publication fonctionnelle |
| QA | Tests responsive de chaque template (3 breakpoints), test subdomain | Tests templates |

**Dependances** :
- Le Senior Dev et le Designer travaillent en parallele
- L'Integrateur attend les deux
- Le QA attend l'Integrateur

**Critere de fin de phase** : Un portfolio publie est accessible sur `pseudo.vizly.fr` avec le bon template.

### Phase 4 -- Monetisation

| Agent | Taches | Livrables |
|-------|--------|-----------|
| Senior Dev | Integration Stripe (subscriptions + one-shot), webhooks, logique expiration | Paiement fonctionnel |
| Designer | 4 templates premium (Creatif, Brutalist, Elegant, Bento), page pricing | Templates premium, pricing |
| DevOps | Config Stripe (produits, prix, webhooks), domaine custom Vercel API | Infrastructure Stripe |
| Integrateur | Flow publication avec paiement, achat template, changement de plan | Checkout integre |
| QA | Tests paiement (mode test Stripe), tests webhooks, tests acces premium | Tests monetisation |

**Dependances** :
- DevOps configure Stripe en premier
- Senior Dev implemente l'integration ensuite
- Designer et Senior Dev travaillent en parallele
- Integrateur attend Senior Dev + Designer
- QA attend tout le monde

**Critere de fin de phase** : Un utilisateur peut payer, son portfolio est publie, les templates premium sont accessibles apres achat.

### Phase 5 -- Polish et lancement

| Agent | Taches | Livrables |
|-------|--------|-----------|
| Designer | Animations, micro-interactions, polish responsive, review final de chaque page | UI finalisee |
| Senior Dev | Emails transactionnels (Resend), analytics basiques (plan Pro), optimisations API | Backend finalise |
| QA | Suite de tests complete, audit Lighthouse, audit accessibilite, tests cross-browser | Rapport QA final |
| DevOps | Deploy prod, monitoring, CDN, optimisations Vercel | Production ready |

**Critere de fin de phase** : Lighthouse > 90 sur toutes les metriques, tous les tests passent, le produit est utilisable en production.

---

## Regles globales pour TOUS les agents

Ces 10 regles s'appliquent a CHAQUE agent, sans exception.

### 1. Lire CLAUDE.md en entier avant de commencer

Chaque agent DOIT lire le fichier CLAUDE.md completement avant d'ecrire la moindre ligne de code. Ce fichier contient la spec produit, la stack technique, le schema DB, et les conventions du projet. Ne pas le lire revient a travailler a l'aveugle.

### 2. TypeScript strict -- pas de any, pas de @ts-ignore

Le projet utilise TypeScript en mode strict. Les types `any`, `unknown` caste sans validation, `@ts-ignore`, et `@ts-expect-error` sans justification sont INTERDITS. Utiliser Zod pour inferer les types depuis les schemas de validation. Utiliser les types generes par Supabase pour les donnees de la base.

### 3. Pas de code mort

Supprimer tout code commente, tout import inutilise, toute variable non referencee, toute fonction non appelee. Le code mort est du bruit qui rend la maintenance plus difficile. Si du code doit etre "garde au cas ou", il est dans l'historique git.

### 4. Pas de console.log en production

Utiliser un systeme de logging structure si necessaire. Les `console.log`, `console.warn`, `console.error` de debug doivent etre supprimes avant le commit. Exception : les logs intentionnels dans les API routes pour le monitoring (avec un format structure).

### 5. Accessibilite -- tout composant interactif accessible au clavier

Chaque bouton, lien, input, select, modal, dropdown, tab, accordion, et carousel doit etre utilisable au clavier seul. Verifier : focus visible, ordre de tabulation logique, aria-labels sur les elements sans texte visible, aria-live pour les mises a jour dynamiques, echap pour fermer les overlays.

### 6. Responsive -- mobile-first, tester 375px / 768px / 1280px

Ecrire les styles mobile-first (defaut = mobile, puis `md:` pour tablette, `lg:` pour desktop). Tester sur les 3 breakpoints de reference. Pas de scroll horizontal. Les images et les textes s'adaptent. Les menus deviennent des hamburgers sur mobile. Les grilles passent en colonne unique.

### 7. Performance -- pas de import *, tree-shaking, lazy loading

Importer uniquement ce qui est utilise (`import { X } from 'lib'`, jamais `import * as lib from 'lib'`). Utiliser `next/dynamic` pour le lazy loading des composants lourds (templates, editeur). Optimiser les images avec `next/image`. Les fonts via `next/font/google` avec `display: swap`.

### 8. Securite -- valider inputs, RLS, pas de secrets client-side

Valider TOUTES les entrees utilisateur avec Zod cote serveur. Configurer les Row Level Security policies sur chaque table Supabase. Ne JAMAIS exposer de secrets (cles API, tokens) dans le code client ou les variables d'environnement prefixees `NEXT_PUBLIC_`. Verifier les signatures des webhooks.

### 9. DRY -- extraire les patterns repetes

Si un pattern apparait 3 fois ou plus, l'extraire dans un composant, un hook, ou une fonction utilitaire. Les composants partages vont dans `src/components/ui/`. Les hooks partages dans `src/hooks/`. Les utilitaires dans `src/lib/utils.ts`. Attention : ne pas abstraire prematurement -- 2 occurrences similaires ne justifient pas forcement une abstraction.

### 10. Documenter -- JSDoc sur fonctions complexes

Les fonctions dont le comportement n'est pas evident a la lecture meritent un commentaire JSDoc avec description, parametres, et valeur de retour. Les composants React complexes meritent une description de leurs props. Les API routes meritent un commentaire decrivant le endpoint, la methode, et les codes de retour. Ne PAS documenter l'evident -- un `getUserById(id)` n'a pas besoin de JSDoc.

### 11. Memoire -- Lire MEMORY.md au debut, le mettre a jour a la fin

Chaque agent DOIT lire `MEMORY.md` au debut de sa session pour savoir ou en est le projet, quelles decisions ont ete prises, et quels bugs sont connus. A la fin de sa session, chaque agent DOIT mettre a jour MEMORY.md : ajouter une entree dans l'historique des sessions, mettre a jour l'etat du projet, noter les nouvelles decisions et les bugs decouverts.

### 12. Historique -- Ne jamais supprimer d'entrees dans MEMORY.md

L'historique des sessions dans MEMORY.md est un append-only log.

### 13. MCPs -- Privilegier les MCPs Supabase et Vercel pour interagir avec l'infra

Utiliser les serveurs MCP Supabase et Vercel plutot que les CLIs ou dashboards manuels pour toutes les interactions avec l'infrastructure (creation de tables, migrations, RLS, deploiements, configuration domaines, env vars). Les MCPs permettent une interaction directe et tracable depuis l'agent. On n'efface JAMAIS une entree passee. Les decisions sont immuables (on peut les marquer "revisee" mais pas les supprimer). En cas de conflit entre MEMORY.md et l'etat reel du code, c'est le code qui fait foi -- mettre a jour MEMORY.md pour refleter la realite.

---

## Conventions de nommage entre agents

Pour eviter les conflits, chaque agent respecte ces conventions :

| Element | Convention | Exemple |
|---------|------------|---------|
| Composants React | PascalCase | `ProjectCard.tsx`, `EditorStep.tsx` |
| Hooks | useCamelCase | `usePortfolio.ts`, `useStripeCheckout.ts` |
| Utilitaires | camelCase | `formatDate.ts`, `validateSlug.ts` |
| API routes | kebab-case | `src/app/api/stripe-webhook/route.ts` |
| Types/Interfaces | PascalCase, prefixe si global | `TemplateProps`, `PortfolioData` |
| Fichiers de test | [nom].spec.ts | `editor.spec.ts`, `auth.spec.ts` |
| Branches git | type/description | `feat/editor-step-1`, `fix/auth-redirect` |
| Commits | type(scope): description | `feat(editor): add project form`, `fix(auth): handle expired session` |

---

## Gestion des conflits

Si deux agents modifient le meme fichier :
1. L'Orchestrator detecte le conflit lors de l'integration
2. L'agent qui a modifie le fichier en SECOND doit rebase sur le travail du premier
3. En cas de desaccord, l'Orchestrator tranche
4. Les decisions sont documentees dans `design-decisions.md`

Si un agent est bloque par le travail d'un autre :
1. Documenter dans `blockers.md`
2. Travailler sur une autre tache en attendant
3. L'Orchestrator priorise le deblocage

---

## Checklist de livraison par agent

### Designer
- [ ] Design Thinking Process documente
- [ ] Aucun anti-pattern AI slop
- [ ] Responsive teste sur 3 breakpoints
- [ ] Accessibilite clavier verifiee
- [ ] Animations avec prefers-reduced-motion
- [ ] Fonts uniques (pas de doublon entre templates)

### Senior Dev
- [ ] TypeScript strict, zero erreur
- [ ] RLS sur toutes les tables touchees
- [ ] Validation Zod sur toutes les entrees
- [ ] Pas de secrets en dur
- [ ] Migration SQL incluse si schema modifie

### QA
- [ ] Tests E2E pour le happy path
- [ ] Tests pour les edge cases identifies
- [ ] Selecteurs data-testid uniquement
- [ ] Tests responsive si composant visuel
- [ ] Rapport de performance si page publique

### DevOps
- [ ] .env.example a jour
- [ ] CI passe (lint + type-check + build + tests)
- [ ] Pas de secrets dans le code ou les logs
- [ ] Configuration documentee

### Integrateur
- [ ] Tous les etats UI geres (loading, error, success, empty)
- [ ] Debounce sur les inputs temps reel
- [ ] Gestion des erreurs reseau
- [ ] Cache et revalidation configures
