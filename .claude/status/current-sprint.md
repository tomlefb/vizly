# Sprint en cours

TOUTES LES PHASES TERMINEES (Phase 1 → 5). Le MVP est complet.

---

## Etat du produit

- [x] Phase 1 : Fondations (Next.js 15, Supabase, auth, landing, Playwright)
- [x] Phase 2 : Editeur multi-etapes (13 composants UI, Server Actions, LivePreview)
- [x] Phase 3 : Templates et publication (4 templates gratuits, publish flow, subdomain)
- [x] Phase 4 : Monetisation (Stripe subscriptions + templates premium, billing page)
- [x] Phase 5 : Polish et lancement (Resend emails, contact form, settings page, tests)

## Pour le deploy prod

- [ ] Configurer Google OAuth dans Supabase Dashboard + Google Cloud Console
- [ ] Configurer STRIPE_WEBHOOK_SECRET en production (creer le webhook endpoint dans Stripe Dashboard)
- [ ] DNS : A record vizly.fr → Vercel, CNAME *.vizly.fr → cname.vercel-dns.com
- [ ] Verifier les env vars sur Vercel (toutes les NEXT_PUBLIC_* + secrets)
- [ ] `vercel deploy --prod`
