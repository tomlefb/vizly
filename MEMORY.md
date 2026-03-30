# MEMOIRE DU PROJET

> Ce fichier est la memoire persistante du projet. Il est lu au debut de chaque session et mis a jour a la fin.
> **Derniere mise a jour** : 2026-03-30 11:00
> **Derniere session par** : Lead Orchestrator

---

## Etat actuel du projet

- **Phase en cours** : Phase 0 -- Configuration initiale
- **Progression globale** : 5% (configuration multi-agent terminee, aucun code applicatif)
- **Build status** : N/A (projet pas encore initialise avec npm)
- **Tests status** : N/A (Playwright pas encore configure)
- **Derniere action** : Configuration complete du systeme multi-agent
- **Prochain objectif** : Phase 1 -- Fondations (setup Next.js, Supabase, Auth, Landing, Playwright)

---

## Historique des sessions

### Session 0 -- 2026-03-30
- **Duree** : ~30min
- **Agent(s)** : Lead Orchestrator (configuration initiale)
- **Objectif** : Configurer l'infrastructure multi-agent du projet
- **Realise** :
  - Installation de 7 skills design (frontend-design, theme-factory, brand-guidelines, canvas-design, web-design-guidelines, shadcn-ui, ui-ux-pro-max)
  - Creation de AGENTS.md (482 lignes) -- roles des 6 agents, workflow par phase, regles globales
  - Creation de 6 slash commands (orchestrate, design-review, new-template, qa, status, sprint)
  - Creation de .claude/settings.json avec permissions auto-approve
  - Creation de .env.example (138 lignes) -- toutes les variables documentees
  - Enrichissement de CLAUDE.md (411 -> 1050 lignes) avec structure projet, conventions, design system, performance, commandes
  - Creation des 4 fichiers de status (.claude/status/)
  - Creation du systeme de memoire persistante (MEMORY.md + slash command memory)
- **Problemes rencontres** : Skill communautaire web-accessibility (supercent-io) echouee -- repo inexistant. Sans impact, les 4 skills Anthropic couvrent le besoin.
- **Decisions prises** :
  - D1 : Direction artistique "Refined Modern" pour l'app elle-meme
  - D2 : Chaque template a une paire de fonts unique (pas de doublon)
  - D3 : Anti-patterns AI slop formellement definis et interdits
  - D4 : Workflow en 5 phases avec dependances documentees
- **Fichiers crees/modifies** :
  - `CLAUDE.md` -- Enrichi avec 5 nouvelles sections (structure, conventions, design system, performance, commandes)
  - `AGENTS.md` -- Nouveau fichier, architecture multi-agent complete
  - `MEMORY.md` -- Nouveau fichier, memoire persistante
  - `.claude/settings.json` -- Permissions agents
  - `.claude/commands/orchestrate.md` -- Slash command orchestrateur
  - `.claude/commands/design-review.md` -- Slash command review design
  - `.claude/commands/new-template.md` -- Slash command creation template
  - `.claude/commands/qa.md` -- Slash command audit QA
  - `.claude/commands/status.md` -- Slash command status projet
  - `.claude/commands/sprint.md` -- Slash command sprint autonome
  - `.claude/commands/memory.md` -- Slash command gestion memoire
  - `.claude/status/current-sprint.md` -- Taches en cours
  - `.claude/status/blockers.md` -- Blocages
  - `.claude/status/completed.md` -- Historique taches
  - `.claude/status/design-decisions.md` -- Decisions design
  - `.env.example` -- Variables d'environnement
- **A faire ensuite** :
  - Lancer `/sprint 1` pour demarrer la Phase 1 (Fondations)
  - DevOps : setup Next.js 15, Supabase, Vercel, GitHub Actions
  - Senior Dev : schema DB, migrations, RLS, auth flow
  - Designer : landing page, design system, choix des fonts
  - QA : setup Playwright, premiers tests auth

---

## Registre des decisions

| # | Date | Decision | Contexte | Impact |
|---|------|----------|----------|--------|
| D1 | 2026-03-30 | Direction artistique "Refined Modern" pour l'app | Differentiation vs SaaS generiques | Toutes les pages de l'app (hors templates portfolio) |
| D2 | 2026-03-30 | Chaque template a une paire de fonts unique | Eviter l'uniformite entre templates | Designer doit verifier design-decisions.md avant chaque template |
| D3 | 2026-03-30 | Anti-patterns AI slop formellement interdits | Qualite visuelle = priorite #1 du projet | Review design obligatoire, rejection si AI slop detecte |
| D4 | 2026-03-30 | Workflow en 5 phases avec dependances | Organisation multi-agent autonome | Chaque sprint suit le plan de phase defini dans AGENTS.md |
| D5 | 2026-03-30 | 7 skills design installees pour les agents | Garantir la qualite du design | Agents Designer ont acces aux guidelines frontend-design, shadcn-ui, etc. |
| D6 | 2026-03-30 | Nom de l'app : Vizly, domaine : vizly.fr | Choix du nom definitif et du domaine principal | Toutes les references a tonapp/TonApp remplacees par vizly/Vizly dans tout le projet |

---

## Bugs connus

| # | Severite | Description | Fichier | Status |
|---|----------|-------------|---------|--------|
| -- | -- | Aucun bug connu | -- | -- |

---

## Dependances installees

| Package | Version | Pourquoi |
|---------|---------|----------|
| -- | -- | Aucune dependance npm installee (projet pas encore initialise) |

Note : les skills sont installees dans `.agents/skills/` mais ne sont pas des dependances npm.

---

## Variables d'environnement configurees

| Variable | Configuree | Notes |
|----------|-----------|-------|
| NEXT_PUBLIC_APP_URL | Non | A configurer au setup |
| NEXT_PUBLIC_ROOT_DOMAIN | Non | vizly.fr |
| NEXT_PUBLIC_SUPABASE_URL | Non | Creer le projet Supabase d'abord |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Non | Disponible apres creation projet |
| SUPABASE_SERVICE_ROLE_KEY | Non | Disponible apres creation projet |
| SUPABASE_DB_URL | Non | Disponible apres creation projet |
| GOOGLE_CLIENT_ID | Non | Configurer dans Google Cloud Console |
| GOOGLE_CLIENT_SECRET | Non | Configurer dans Google Cloud Console |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Non | Creer le compte Stripe d'abord |
| STRIPE_SECRET_KEY | Non | Creer le compte Stripe d'abord |
| STRIPE_WEBHOOK_SECRET | Non | Genere apres creation du webhook |
| STRIPE_PRICE_STARTER_MONTHLY | Non | Creer les produits Stripe |
| STRIPE_PRICE_PRO_MONTHLY | Non | Creer les produits Stripe |
| STRIPE_PRICE_TEMPLATE_CREATIVE | Non | Creer les produits Stripe |
| STRIPE_PRICE_TEMPLATE_BRUTALIST | Non | Creer les produits Stripe |
| STRIPE_PRICE_TEMPLATE_ELEGANT | Non | Creer les produits Stripe |
| STRIPE_PRICE_TEMPLATE_BENTO | Non | Creer les produits Stripe |
| RESEND_API_KEY | Non | Creer le compte Resend |
| RESEND_FROM_EMAIL | Non | Verifier le domaine dans Resend |
| VERCEL_API_TOKEN | Non | Pour les domaines custom (Phase 4) |
| VERCEL_PROJECT_ID | Non | Disponible apres deploy Vercel |

---

## Structure des skills installees

| Skill | Source | Usage principal |
|-------|--------|----------------|
| frontend-design | Anthropic | Design Thinking Process, anti-AI-slop, production-grade UI |
| theme-factory | Anthropic | 10 themes pre-configures avec palettes et font pairings |
| brand-guidelines | Anthropic | Couleurs et typo de marque (reference, pas applique directement) |
| canvas-design | Anthropic | Creation d'art visuel et compositions (pour assets marketing) |
| web-design-guidelines | Vercel Labs | Review UI contre les Web Interface Guidelines |
| shadcn-ui | giuseppe-trisciuoglio | Guide complet shadcn/ui : install, config, composants, patterns |
| ui-ux-pro-max | nextlevelbuilder | 50+ styles, 161 palettes, 57 font pairings, 99 regles UX |
