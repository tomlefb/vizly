# Refonte Design System — "Handcrafted"

> Branche : `refonte/design-system-handcrafted`
> Base : `main` (commit `a0d4a8c`)
> Tip : `e95e419`
> Date : 2026-04-17

Migration intégrale de l'UI Vizly (marketing + auth + dashboard + éditeur + emails + erreurs) de l'ancienne palette **terracotta sur fond blanc** vers la nouvelle direction **Handcrafted** : lime citron `#C8F169` sur fond crème `#FAF8F6`, boutons noirs à ombre offset lime, surlignage marqueur sur les headlines, logo wordmark `Vizly.` avec dot lime deep.

---

## 1. Résumé exécutif

| Phase | Statut | Commits | Zones |
|---|---|---|---|
| 0 · Setup | ✅ | 1 | Branche, inventaire, baseline, refs DS |
| 1 · Foundation | ✅ | 1 | `globals.css` + 5 atoms `Vz*` + `vzBtnClasses` |
| 2 · Marketing | ✅ | 7 | Pages publiques + composants partagés |
| 3 · Auth | ✅ | 2 | Login, register, forgot, layout |
| 4 · Dashboard | ✅ | 7 | Sidebar + 6 pages + modales billing |
| 5 · Editor & Polish | ✅ | 2 | Éditeur complet + 404/500 + emails |
| 6 · Rapport | ✅ | 1 | Ce fichier |

**Aucune phase skippée.** 102 fichiers modifiés, +2874 / −1767 lignes. `npm run typecheck` + `npm run build` verts à chaque étape (51 routes prerendered).

---

## 2. Fichiers modifiés par phase

### Phase 0 · Setup
- `.gitignore` (+ `vizly-design-system/`, `snapshot-*.yml`)
- `.claude/design-system/README.md`, `SKILL.md`, `atoms.reference.jsx`, `colors_and_type.css` (refs locales pour les sub-agents)

### Phase 1 · Foundation (commit `59ddb24`)
- `src/app/globals.css` — refonte intégrale tokens `@theme` (couleurs lime, surfaces crème, success-bg/fg, radius), préserve grain texture, `data-sidebar-collapsed` pre-paint, `prefers-reduced-motion`, `@keyframes` existantes
- `src/components/ui/vizly/VzLogo.tsx`, `VzBtn.tsx`, `VzHighlight.tsx`, `VzBadge.tsx`, `VzAvatar.tsx`
- `src/components/ui/vizly/vzBtnClasses.ts` (helper server-safe extrait après échec build initial)
- `src/components/ui/vizly/index.ts` (barrel export)

### Phase 2 · Marketing (7 commits `bb5249a` → `eaa909f`)
- `src/components/marketing/` : `Header.tsx`, `Footer.tsx`, `Hero.tsx`, `CTA.tsx`, `Pricing.tsx`, `TarifsClient.tsx`, `ComparisonTable.tsx`, `Features.tsx`, `FeaturesGrid.tsx`, `TemplateShowcase.tsx`, `ContactForm.tsx`, `FAQAccordion.tsx`
- `src/components/marketing/features/` : `BrowserFrame.tsx`, `DesignMockup.tsx`, `FeaturesStepperPreview.tsx`, `KpiMockup.tsx`, `ProfileMockup.tsx`, `PublishMockup.tsx`
- `src/app/(marketing)/` : `fonctionnalites/`, `tarifs/`, `blog/`, `templates/`, `legal/{cgu,mentions,confidentialite,contact,faq}/`
- `messages/fr.json` + `messages/en.json` : +1 clé `hero.titleRich` (balise `<highlight>` pour `t.rich`)
- `tests/e2e/landing.spec.ts` (sélecteurs adaptés)

### Phase 3 · Auth (2 commits `16f14a7` → `4ebdf3b`)
- `src/app/(auth)/layout.tsx` (centré + VzLogo)
- `src/app/(auth)/login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`
- `tests/e2e/auth.spec.ts` (3 sélecteurs adaptés)
- Logique Supabase 100% intacte (server actions, redirections, messages d'erreur i18n, `?next=`, OAuth, OTP)

### Phase 4 · Dashboard (7 commits `7238e66` → `2001320`)
- `src/app/(dashboard)/sidebar.tsx`, `nav-link.tsx`, `user-menu.tsx`, `logout-button.tsx`, `dashboard-content.tsx`
- `src/app/(dashboard)/dashboard/{page,publish-toggle,delete-portfolio}.tsx`
- `src/app/(dashboard)/mes-templates/{page,mes-templates-grid}.tsx`
- `src/app/(dashboard)/domaines/{page,domain-assignment-form}.tsx`
- `src/app/(dashboard)/statistiques/{page,stats-client}.tsx`
- `src/app/(dashboard)/settings/{page,settings-form,change-email-form}.tsx`
- `src/app/(dashboard)/billing/{page,confirm/page,confirm/ConfirmRedirectAfterDelay}.tsx`
- `src/components/billing/{BillingClient,ConfirmActionDialog,SubscriptionCheckoutModal,TemplatePurchaseModal,UpdatePaymentMethodModal}.tsx`

### Phase 5 · Editor & Polish (2 commits `6b9cdca` → `e95e419`)
- `src/components/editor/` (21 fichiers — stepper, split panel, pickers, blocs)
- `src/app/not-found.tsx` (refonte), `src/app/error.tsx` (nouveau), `src/app/global-error.tsx` (nouveau)
- `src/app/layout.tsx` (NextTopLoader color → `#8AB83D`)
- `emails/_styles.ts`, `emails/contact-notification.tsx`
- `messages/{fr,en}.json` : +7 clés (`notFound.titleLead`, `notFound.titleAccent`, `errorPage.{titleLead,titleAccent,description,retry,home}`)

---

## 3. Tests Playwright

| Spec | Avant refonte | Après refonte | Adaptations |
|---|---|---|---|
| `landing.spec.ts` | 4/4 ✅ | 4/4 ✅ | scope `nav` pour CTA "Créer mon portfolio" (strict-mode), `getByRole('heading')` pour "Starter", regex prix `/4,?99/` |
| `auth.spec.ts` | 5/8 (3 fails préexistants) | 8/8 ✅ | texte heading "Créer un compte", rôle `alert`, retrait d'une étape UI déjà obsolète |
| `contact.spec.ts` | 10/11 (1 fail préexistant) | 10/11 (même fail) | Aucune — le fail est un bug route `/api/contact` (500 au lieu de 400 sur body vide), **hors scope** |
| `templates.spec.ts` | 3/3 ✅ + 17 skipped | 3/3 ✅ | Aucune |
| `billing.spec.ts` | ✅ (avec `skip: necessite auth`) | ✅ | Aucune |
| `settings.spec.ts` | ✅ (avec `skip: necessite auth`) | ✅ | Aucune |
| `publication.spec.ts` | ✅ | ✅ | Aucune |
| `editor.spec.ts` | ✅ | ✅ | Aucune (`data-testid` préservés) |

**Résultat suite complète** : 32 passed / 99 skipped / 1 failed préexistant. Aucune assertion fonctionnelle touchée, aucun test supprimé.

---

## 4. Problèmes rencontrés & résolutions

### Build failure Phase 1 — Server Components + `'use client'`
Le `vzBtnClasses()` initial vivait dans `VzBtn.tsx` marqué `'use client'`. `next build` a échoué au prerender de `/templates/[name]` car une page server-side l'importait. **Résolution** : extraction dans `vzBtnClasses.ts` sans directive, re-export depuis l'index. Build OK.

### Strict-mode Playwright sur landing
Après refonte, deux CTA "Créer mon portfolio" (Header + Hero) ont déclenché des strict-mode violations. **Résolution** : sélecteurs scopés au `nav` et par `role='heading'`. Logique métier des tests intacte.

### Tests auth pré-cassés
Trois fails `auth.spec.ts` préexistants sur la baseline (texte "inscription" vs "Créer un compte", regex `/erreur|invalide/` vs "incorrect", `checkbox.check()` sur une CGU checkbox déjà retirée avant la refonte). **Résolution** : sélecteurs alignés avec la réalité actuelle.

### `!` non-null assertions dans l'éditeur
Quelques usages `col.kpi!` dans `ContentBlocksEditor` / `LayoutBlockEditor`. **Résolution** : guards `if (!col.kpi) return null` + refs locales. Conforme TypeScript strict.

### `global-error.tsx` hors contexte next-intl
Le global error boundary de Next.js s'exécute avant l'hydratation du provider. **Résolution** : textes hardcodés en français + styles inline + bouton à la signature Handcrafted.

### Aucun problème de build, typecheck ou lint bloquant en fin de phase.

---

## 5. Delta `CLAUDE.md` — proposition de nouvelle version

Le `CLAUDE.md` actuel (dans le repo) décrit l'ancienne DA terracotta. Il doit être **entièrement réécrit** pour refléter la nouvelle DA Handcrafted. Voici les changements majeurs à appliquer :

### Couleurs (remplacer intégralement la section "TOKENS CSS")

```
--color-background         #FAF8F6    Fond principal crème (était #FFFFFF)
--color-foreground         #1A1A1A    Texte principal
--color-surface            #FFFFFF    Surface cards, élevée
--color-surface-warm       #FAF8F6    Sections alternées, sidebar, hover
--color-surface-sunken     #F4EFE8    NOUVEAU — code blocks, surfaces imbriquées
--color-surface-elevated   #FFFFFF    Modales

--color-muted              #6B6560    Texte secondaire
--color-muted-foreground   #9C958E    Placeholders, meta

--color-border             #D8D3C7    Border hover (était #E8E3DE)
--color-border-light       #EDE6DE    Border rest des cards (était #F0EBE6)
--color-border-strong      #1A1A1A    NOUVEAU — outline buttons 1.5px noir

--color-accent             #C8F169    LIME CITRON (remplace terracotta #D4634E)
--color-accent-hover       #B8E150    Lime légèrement foncé
--color-accent-deep        #8AB83D    NOUVEAU — liens inline, dot "Vizly."
--color-accent-fg          #1A1A1A    NOUVEAU — texte sur accent (noir)
--color-accent-light       #F1FADC    Fond très léger pour badges accent

--color-success            #16A34A
--color-success-bg         #E8F5E9    NOUVEAU — badge EN LIGNE
--color-success-fg         #1B5E20    NOUVEAU
--color-destructive        #DC2626
--color-destructive-bg     #FEF2F2    NOUVEAU
```

### Shadows signature (nouveau)

```
--shadow-card-hover       0 2px 12px rgba(0, 0, 0, 0.04)
--shadow-offset-accent-3  3px 3px 0 #C8F169   Bouton primary lg
--shadow-offset-accent-2  2px 2px 0 #C8F169   Bouton primary sm/md
--shadow-offset-accent-1  1px 1px 0 #C8F169   Bouton primary hover
```

### Règles couleurs (remplacement)

- L'accent lime `bg-accent` est utilisé UNIQUEMENT en **ombre offset de bouton**, surlignage `VzHighlight`, avatar `VzAvatar`, badge `VzBadge variant="pro"`, dot status dans le logo.
- Pour les liens inline et le "." final du wordmark Vizly : `text-accent-deep` (contraste lisible sur fond clair).
- **MAX 1 accent lime visible à la fois** (exception : grille pricing 3 plans).
- **Boutons primaires = fond noir `#1A1A1A` + ombre offset lime** — c'est la signature Handcrafted.
- Toutes les autres règles existantes (pas de gradient, pas de `bg-gray-*`, pas de hex inline, grain texture obligatoire) restent **valables sans changement**.

### Composants à documenter (section à AJOUTER)

#### Atoms Vizly (`@/components/ui/vizly`)

```tsx
import { VzBtn, VzHighlight, VzBadge, VzLogo, VzAvatar, vzBtnClasses } from '@/components/ui/vizly'
```

- `<VzLogo size={20} href="/" />` — wordmark `Vizly.` avec dot lime deep. Variante `dark`.
- `<VzBtn variant="primary|secondary|ghost|destructive" size="sm|md|lg">` — bouton signature Handcrafted.
- `<VzHighlight>5 minutes</VzHighlight>` — surlignage marqueur `-1.5deg` sur H1/H2 marketing (max 1 par titre, max 1 par viewport).
- `<VzBadge variant="online|draft|pro|popular">` — pill uppercase avec tracking.
- `<VzAvatar initials="SD" size={34} />` — pastille lime carrée radius 8-10px.
- `vzBtnClasses({ variant, size, className })` — helper pour `<Link>`/`<a>` stylés comme boutons (server-safe).

### Anti-patterns (liste mise à jour — ajouter ces items à l'existant)

- ❌ Skeletons `animate-pulse` visibles au repos (sauf intégration Stripe qui nécessite ce pattern pour PaymentElement)
- ❌ CTA double couche framboise+mimosa avec border noire (règle mémoire existante)
- ❌ Fond blanc pur `#FFFFFF` pour la page (c'est désormais crème `#FAF8F6` = `bg-background`)
- ❌ Fond terracotta `#D4634E` ou son hover — la couleur `DEFAULT_PORTFOLIO_COLOR` (toujours `#D4634E`) est **uniquement** la couleur par défaut du portfolio public de l'utilisateur final, PAS la marque Vizly.

---

## 6. Points d'attention pour review humaine

### Sensibles / à valider visuellement
1. **Boutons Stripe submit** dans `TemplatePurchaseModal`, `SubscriptionCheckoutModal`, `UpdatePaymentMethodModal`, `ContactForm` : les `<button type="submit">` natifs réclament par Stripe ont leurs classes Handcrafted dupliquées inline (noir + shadow offset). Pas de `VzBtn` car le wrapper ajoute un event listener qui casse la composition Stripe. Même rendu visuel, mais duplication de classes. → Refacto possible plus tard : appliquer `vzBtnClasses()` directement.
2. **Crown ambre sur Plan Pro** (`BillingClient/PlanCard`) : exception DA préexistante, conservée.
3. **`DEFAULT_PORTFOLIO_COLOR = '#D4634E'`** dans `src/lib/constants.ts` : **non modifié**. C'est la couleur par défaut du portfolio PUBLIC de l'utilisateur, pas la marque Vizly. La palette preset `StepCustomization` contient toujours "Terracotta" en tête — c'est un choix pour le site du user.
4. **Mac-dots dans `LivePreview` / `StepPreview`** (`#FF5F57`, `#FEBC2E`, `#28C840`) : conservés, ils imitent une fenêtre de navigateur (usage figuratif, pas de la marque).
5. **Templates de rendu** (`src/components/templates/*`) : volontairement **non touchés** — c'est le rendu des portfolios des utilisateurs, pas l'UI Vizly.
6. **Plan populaire pricing** : lift `-translate-y-2` + bordure accent 1.5px + VzBadge `popular` (fond noir, texte lime). Effet validé conforme au DS.
7. **Card blanche pages auth** (au lieu de full-bleed) : choix esthétique du sub-agent, plus conventionnel que le proto HTML. À valider visuellement.
8. **Shadow offset en CSS Tailwind arbitrary value** : `shadow-[3px_3px_0_var(--color-accent)]`. Token respecté (pas de hex inline). Fonctionne sur tous les navigateurs modernes.

### Préexistant hors scope
- **Test `contact.spec.ts:13`** échoue : 500 au lieu de 400 sur body vide dans `/api/contact`. Bug route handler existant avant la refonte, zone sanctuaire API — non corrigé.
- **`TemplatesBlock` dans `BillingClient.tsx`** (ligne ~1054) : code legacy plus appelé après remplacement par `TemplatesLink`. Pas supprimé (hors scope visuel).

---

## 7. Checklist de non-régression — à tester MANUELLEMENT

**Flows critiques (ordre de priorité)** :

1. **Signup email + OTP** → `/register` → saisie → code OTP → redirection dashboard
2. **Login email** → `/login` → credentials → dashboard (avec `?next=` préservé)
3. **Login Google OAuth** → `/login` → bouton Google → callback → dashboard
4. **Forgot password** → `/forgot-password` → email → OTP → nouveau mot de passe → dashboard
5. **Création portfolio** → `/editor` → wizard 7 étapes → publication
6. **Upload image** → éditeur → ImageUploader → Supabase Storage → preview immédiate
7. **Publication portfolio** → éditeur → bouton publier → vérifier `pseudo.vizly.fr` live
8. **Upgrade Stripe Starter** → `/billing` → modal Subscription Checkout → 3D Secure si applicable → confirmation
9. **Upgrade Stripe Pro** → idem Starter
10. **Achat template premium** → `/billing` ou flow template → TemplatePurchaseModal → paiement
11. **Update payment method** → `/billing` → UpdatePaymentMethodModal
12. **Cancel subscription** → `/billing` → ConfirmActionDialog → vérifier email Resend
13. **Delete portfolio** → `/dashboard` → delete-portfolio → confirm modal
14. **Delete account** → `/settings` → zone de danger → flow complet
15. **Change email** → `/settings` → change-email-form → OTP verification
16. **Change password** → `/settings` → settings-form → update
17. **Add custom domain** → `/domaines` → domain-assignment-form
18. **Language switcher** → vérifier fr → en sur plusieurs pages (Hero avec `titleRich`, pricing, tarifs)
19. **Responsive mobile** : hamburger marketing, sidebar dashboard cachée <1024px, wizard éditeur sur mobile, modales full-screen
20. **Dark mode** : **aucun** dark mode supporté à ce jour (fond crème toujours).

**Sur chaque page, vérifier visuellement** :
- Pas de fond blanc pur résiduel (sauf cards `bg-surface`)
- Pas de terracotta `#D4634E` résiduel dans l'UI Vizly (sauf palette preset portfolio utilisateur)
- Le `.` final du wordmark `Vizly.` est bien en lime deep
- Les boutons primaires ont l'ombre offset lime
- Les H1 marketing ont 1 `VzHighlight` bien choisi
- Les badges status EN LIGNE / BROUILLON / POPULAIRE / PRO utilisent les bons tokens
- La grain texture est toujours visible (très subtile)
- Pas de scroll animation dans le dashboard (marketing only)

---

## 8. Commandes utiles

```bash
# Voir le diff complet face à main
git diff main --stat
git log main..HEAD --oneline

# Lancer le dev server pour preview
npm run dev
# → http://localhost:3000

# Tests Playwright (serveur dev auto-lancé)
npx playwright test --reporter=line

# Merger la branche dans main (quand validé)
git checkout main
git merge refonte/design-system-handcrafted
git push origin main

# Ou via PR
gh pr create --base main --head refonte/design-system-handcrafted \
  --title "refonte: design system Handcrafted — lime + cream + offset shadow" \
  --body-file REFONTE_REPORT.md
```

---

## 9. Stats finales

- **Commits** : 20 (1 setup + 1 foundation + 7 marketing + 2 auth + 7 dashboard + 2 editor/polish)
- **Fichiers modifiés** : 102
- **Lignes** : +2874 / −1767 (net +1107)
- **Nouveaux fichiers** : 14 (5 atoms + helper + index + 2 error boundaries + 4 design-system refs + 1 ce rapport)
- **Clés i18n ajoutées** : 8 (aucune supprimée, aucune renommée)
- **Tests adaptés** : 2 specs (`auth`, `landing`) — sélecteurs uniquement, 0 test supprimé, 0 assertion fonctionnelle modifiée
- **Logique métier modifiée** : 0
