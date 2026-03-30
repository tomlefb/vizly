# MEMOIRE DU PROJET

> Etat actuel, decisions actives, configuration. Lu au debut de chaque session.
> Pour l'historique complet des sessions : voir `MEMORY-LOG.md`
> **Derniere mise a jour** : 2026-03-30 20:00

---

## Etat actuel

- **Phase** : Post-MVP — features complementaires ajoutees
- **URL prod** : https://vizly.fr (alias *.vizly.fr)
- **Build** : `next build` OK (30 routes, 0 erreurs)
- **Tests** : 129 Playwright (8 fichiers)
- **Derniere action** : 6 blocs post-MVP (legal, templates showcase, blog SEO, SEO technique, FAQ/contact/404, UX onboarding)

## Prochaines etapes

- [ ] Redeploy prod avec tous les changements
- [ ] Configurer Google OAuth (Supabase Dashboard + Google Cloud Console)
- [ ] Premier utilisateur beta
- [ ] Monitoring prod (erreurs, logs)

## Bugs connus

| # | Sev | Description | Status |
|---|-----|-------------|--------|
| B1 | Moy | lucide-react: pas d'icones de marque (Github, Linkedin...) | Resolu — icones generiques |
| B2 | Haut | Images projets disparaissent a la sauvegarde | Resolu — upload immediat dans ProjectForm |
| B3 | Moy | LivePreview ne reagit pas aux changements customisation | Resolu — Google Fonts dynamique + secondary_color |
| B4 | Moy | Emails contiennent URLs localhost:3000 | Resolu — fallback https://vizly.fr |
| B5 | Bas | Trop d'espace entre sections landing page | Resolu — paddings reduits |
| B6 | Bas | Sidebar visible sous les overlays editeur | Resolu — z-index editor 40 > sidebar 30 |
| B7 | Bas | Pas de preview portfolio dans dashboard | Resolu — mini browser chrome card ajoutee |

Aucun bug actif.

## Decisions actives

| # | Decision | Impact |
|---|----------|--------|
| D1 | Direction "Refined Modern", accent #E8553D, fond #FAFAF8 | Toutes les pages app |
| D2 | Chaque template = paire de fonts unique | 8 paires distinctes |
| D7 | Accent par defaut portfolio = #E8553D | Valeur default DB |
| D8 | Template par defaut = minimal, font = DM Sans | Valeur default DB |
| D9 | ISR revalidate = 60s portfolios publics | portfolio/[slug] |
| D11 | State management : hooks custom (pas Zustand/SWR) | EditorClient.tsx |
| D12 | Sync projets en batch (au depart de step 2) | Pas de sync temps reel |
| D14 | Social icons generiques (Code2, Link2, etc.) | Tous templates + LivePreview |
| D17 | Google Fonts via `<link>` preconnect (Server Components) | Tous templates |

## Dependances principales

next 15.5.14, react 19.2.4, @supabase/supabase-js 2.100.1, @supabase/ssr 0.9.0,
stripe 21.0.1, resend 6.9.4, zod 4.3.6 (.issues pas .errors), framer-motion 12.38.0,
lucide-react 1.7.0, tailwindcss 4.2.2, typescript 5.9.3

## Env vars (17 sur Vercel)

| Variable | Status |
|----------|--------|
| NEXT_PUBLIC_SUPABASE_URL / ANON_KEY | OK |
| SUPABASE_SERVICE_ROLE_KEY | OK |
| STRIPE_SECRET_KEY / PUBLIC_KEY | OK |
| STRIPE_WEBHOOK_SECRET | OK (whsec_DajmK0a...) |
| STRIPE_PRICE_* (6 prix) | OK |
| RESEND_API_KEY / FROM_EMAIL | OK |
| NEXT_PUBLIC_APP_URL / DOMAIN / NAME | OK |
| GOOGLE_CLIENT_ID / SECRET | Non configure |

## Architecture (resume)

- 8 templates portfolio (4 gratuits + 4 premium)
- Editeur 5 etapes avec LivePreview + auto-save debounce
- Stripe : subscriptions Starter/Pro + one-shot templates premium + webhook handler
- Resend : 4 types d'emails (welcome, contact, expiration, offline)
- Auth Supabase : email/password + Google OAuth (a configurer)
- Pages : /, /login, /register, /dashboard, /editor, /billing, /settings, /portfolio/[slug], /templates, /blog, /blog/[slug], /legal/cgu, /legal/confidentialite, /legal/mentions, /legal/faq, /legal/contact
- API : /api/upload, /api/check-slug, /api/contact, /api/contact-page, /api/stripe-webhook
- SEO : sitemap.xml, robots.txt, JSON-LD SoftwareApplication, OG/Twitter Cards

## Vercel

- Project ID : prj_bGro8ZRIoZVNFpFtB7yDUGPBpJWX
- Team ID : team_KXAtotuumofy2mSNScxhnLJq
- Framework : nextjs
- Domaines : vizly.fr (redirect www), www.vizly.fr, *.vizly.fr
