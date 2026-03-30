# Portfolio Builder SaaS — Vizly

> Builder de portfolios en ligne. Le client remplit un formulaire guidé, choisit un template, et son site est live sur `pseudo.vizly.fr`.

## Système de mémoire

**Chaque session** : lire `MEMORY.md` + `.claude/status/current-sprint.md` au début. Mettre à jour `MEMORY.md` (état) + `MEMORY-LOG.md` (append-only, ~5 lignes) à la fin. MEMORY.md < 100 lignes. Code fait foi en cas de conflit.

## Produit

- **Cible** : freelances, étudiants, créatifs non-tech, devs juniors — France d'abord
- **Flow** : formulaire 5 étapes (infos perso → projets → personnalisation → preview → publication payante)
- **Pricing** : Gratuit (création + preview) | Starter 4.99€/mois (live sur pseudo.vizly.fr, badge affiché) | Pro 9.99€/mois (badge retiré, domaine custom, contact, analytics). Templates premium 2.99€ one-shot chacun.
- **Templates** : 4 gratuits (minimal, dark, classique, coloré) + 4 premium (créatif, brutalist, élégant, bento). Chaque template = composant React avec `TemplateProps`, paire de fonts unique.

## Stack

| Couche | Techno |
|--------|--------|
| Frontend + Backend | Next.js 15 (App Router) |
| Base de données | Supabase (PostgreSQL) — schema dans `supabase/migrations/` |
| Auth | Supabase Auth (Google OAuth + email/password) |
| Images | Supabase Storage via `/api/upload` |
| Hosting | Vercel — wildcard `*.vizly.fr` |
| Paiement | Stripe (subscriptions + one-shot) |
| Emails | Resend — 4 types (welcome, contact, expiration, offline) |
| Styling | Tailwind CSS + shadcn/ui (toujours personnalisé) |
| Animations | Framer Motion |
| Tests | Playwright E2E |

## MCPs disponibles

- **Supabase** : tables, migrations, RLS, storage, auth
- **Vercel** : deploy, domaines, env vars
- **Resend** : emails, domaines, contacts

## Structure (résumé)

```
src/app/(marketing)/     — Landing, pricing, blog
src/app/(auth)/          — Login, register, callback
src/app/(dashboard)/     — Dashboard, editor, settings, billing
src/app/portfolio/[slug] — Page portfolio publique (ISR 60s)
src/app/api/             — stripe-webhook, contact, upload, check-slug
src/components/templates/ — 8 templates portfolio
src/components/editor/   — Éditeur multi-étapes + LivePreview
src/components/marketing/ — Hero, Features, Pricing, CTA, Footer, Header
src/lib/supabase/        — client.ts, server.ts, admin.ts
src/lib/stripe/          — client, checkout, webhooks, prices
src/lib/resend/          — client, send (4 emails)
src/actions/             — portfolio, projects, auth, billing
src/hooks/               — usePortfolio, useProjects, useImageUpload, useDebounce
src/middleware.ts         — Wildcard subdomain rewrite
```

## Conventions

### TypeScript strict
- `any` interdit → `unknown` + narrowing ou Zod `.parse()`
- `@ts-ignore` interdit → corriger le type
- `as unknown as X` interdit → validation runtime
- `!` (non-null assertion) interdit → vérifier explicitement

### React / Next.js
- Server Components par défaut. `"use client"` uniquement si hooks/event handlers/browser APIs
- Server Actions pour les mutations, Route Handlers pour les API publiques
- Pas de `useEffect` pour le data fetching
- Un composant = un fichier

### Validation
- Zod pour TOUTES les données entrantes (formulaires, API, webhooks, env vars)
- Schemas partagés dans `src/lib/validations.ts`
- Types dérivés via `z.infer<typeof schema>`

### Base de données
- RLS sur 100% des tables
- Client `server.ts` dans Server Components/Actions, `admin.ts` dans API routes

### Git
- Commits : `type(scope): description` — feat, fix, refactor, style, test, docs, chore
- Branches : feat/xxx, fix/xxx, refactor/xxx

### Nommage
- Composants : PascalCase (`ProjectCard.tsx`) | Hooks : `use` + PascalCase | API routes : kebab-case
- Types : PascalCase | Constantes : UPPER_SNAKE_CASE | Tests : `[nom].spec.ts`

## Design System — Règles essentielles

### Direction artistique
- Style "Refined Modern" — fond #FAFAF8 (warm white, jamais #FFF), texte #1A1A1A (jamais #000), accent #E8553D
- Font display : Satoshi | Font body : DM Sans
- Grain/noise subtil (3-5% opacity) sur les backgrounds
- Espacement généreux — le blanc est un élément de design

### Anti-patterns INTERDITS (AI Slop)
1. Gradients violet-bleu génériques
2. Inter/Roboto/Arial en display font
3. Layouts symétriques sans personnalité
4. Border-radius uniforme partout
5. Ombres par défaut sans intention (shadow-md partout)
6. Palettes pastelles fades
7. Composants shadcn/ui non personnalisés
8. Cards identiques en grille parfaite

### Accessibilité WCAG 2.1 AA
- Contraste 4.5:1 minimum (3:1 grands textes)
- Focus visible, tab order logique, aria-labels
- `prefers-reduced-motion` respecté systématiquement
- Touch targets ≥ 44×44px

### Animations
- 150-300ms micro-interactions, 300-500ms transitions de page
- Easing : ease-out (entrées), ease-in (sorties)
- Uniquement `transform` et `opacity` (GPU-accelerated)

### Performance
- `next/image` systématique, `next/font/google` avec `display: swap`
- Templates lazy-loaded via `next/dynamic`, < 50KB gzipped chacun
- ISR `revalidate: 60` sur les portfolios publics
- Lighthouse cible : Performance > 90, Accessibilité > 95

## Commandes utiles

```bash
npm run dev          # Dev server
npm run build        # Build production
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npx playwright test  # Tests E2E
supabase start/stop  # Supabase local
stripe listen --forward-to localhost:3000/api/stripe-webhook  # Webhooks Stripe local
```
