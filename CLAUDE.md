# Vizly — Portfolio Builder SaaS

Builder de portfolios en ligne. Formulaire guidé → choix template → site live sur `pseudo.vizly.fr`.

## Stack

- **Next.js 15** (App Router) — frontend + backend
- **Supabase** — PostgreSQL, Auth (email + Google OAuth), Storage (images)
- **Stripe** — subscriptions (Starter 4.99€/Pro 9.99€) + one-shot templates premium (2.99€)
- **Resend** — emails transactionnels (noreply@vizly.fr)
- **Vercel** — hosting, wildcard `*.vizly.fr`
- **Tailwind CSS + shadcn/ui** — styling (toujours personnaliser shadcn)
- **Framer Motion** — animations
- **Playwright** — tests E2E

## MCPs

- **Supabase** : tables, migrations, RLS, storage, auth, SQL
- **Vercel** : deploy, domaines, env vars

## Conventions

- TypeScript strict : pas de `any`, `@ts-ignore`, `as unknown as`, `!`
- Server Components par défaut, `"use client"` uniquement si hooks/events/browser APIs
- Server Actions pour les mutations, Route Handlers pour les API publiques
- Zod pour toute validation (formulaires, API, webhooks)
- RLS sur 100% des tables Supabase
- Commits : `type(scope): description` (feat, fix, refactor, style, test)

## Design

- Style "Refined Modern" — fond #FAFAF8, texte #1A1A1A, accent #E8553D
- Font display : Satoshi | Font body : DM Sans
- 8 templates portfolio (4 gratuits + 4 premium), chacun avec paire de fonts unique
- Accessibilité WCAG AA, responsive mobile-first, Lighthouse > 90
