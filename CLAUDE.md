# Vizly — Portfolio Builder SaaS

Builder de portfolios en ligne. Formulaire guidé → choix template → site live sur `pseudo.vizly.fr`.

## Stack

- **Next.js 15** (App Router) — frontend + backend
- **Supabase** — PostgreSQL, Auth (email + Google OAuth), Storage (images)
- **Stripe** — subscriptions (Starter 4.99€/Pro 9.99€) + one-shot templates premium (2.99€)
- **Resend** — emails transactionnels (noreply@vizly.fr)
- **Railway** — hosting, wildcard `*.vizly.fr`
- **Tailwind CSS + shadcn/ui** — styling (toujours personnaliser shadcn)
- **Framer Motion** — animations
- **Playwright** — tests E2E

## MCPs

- **Supabase** : tables, migrations, RLS, storage, auth, SQL
- **Railway** : deploy, services, variables, logs

## Conventions

- TypeScript strict : pas de `any`, `@ts-ignore`, `as unknown as`, `!`
- Server Components par défaut, `"use client"` uniquement si hooks/events/browser APIs
- Server Actions pour les mutations, Route Handlers pour les API publiques
- Zod pour toute validation (formulaires, API, webhooks)
- RLS sur 100% des tables Supabase
- Commits : `type(scope): description` (feat, fix, refactor, style, test)

---

# DESIGN-SYSTEM — Vizly

> Ce fichier est la source de vérité pour tout le design de Vizly.
> Claude Code DOIT le lire avant de toucher à n'importe quel composant UI.
> En cas de doute, la règle est : **MOINS > PLUS**.
>
> La source de vérité tokenisée est `src/app/globals.css`. Toujours utiliser
> les tokens (`bg-accent`, `text-muted`, `border-border`, `rounded-[var(--radius-md)]`).
> **Jamais** de hex hardcodé (`bg-[#D4634E]`, `border-[#E5E7EB]`) dans le code.

---

## PHILOSOPHIE

Vizly doit ressembler à un SaaS conçu par une vraie équipe produit, pas à un side project vibe-coded.
Références visuelles : Apollo, Maze, Neon, Remote, Sprig, Linear, Framer.

ADN Vizly :
- Fond blanc + surfaces crème chaleureuses (terracotta-compatible, pas gris froid)
- Une seule couleur vive : le terracotta `#D4634E`
- Typographie à deux familles : Satoshi (display) + DM Sans (body)
- Beaucoup de whitespace, hiérarchie typo claire
- Zéro effet superflu : pas de gradients, pas de shadows lourdes, pas de bounce
- Grain texture subtle sur tout le site (opacity 0.035) → matière
- Animations Framer Motion discrètes à l'apparition (fade-up 16px, ScrollReveal)

Mantra : **"Si tu hésites à ajouter quelque chose, ne l'ajoute pas."**

---

## TOKENS CSS (source : `src/app/globals.css`)

Les couleurs, fonts et radius sont déclarées en CSS variables consommées par Tailwind v4 via `@theme`. **Ne jamais dupliquer ces valeurs en hex dans le code** — toujours passer par les classes (`bg-accent`, `text-muted`, `rounded-[var(--radius-md)]`).

### Couleurs

```
--color-background         #FFFFFF    Fond principal (pages, app)
--color-foreground         #1A1A1A    Texte principal (presque noir)

--color-surface            #FFFFFF    Surface neutre (cards, inputs)
--color-surface-warm       #FAF8F6    Surface crème chaleureuse (hover, sections alternées, sidebar dashboard)
--color-surface-elevated   #FFFFFF    Surfaces surélevées (modales)

--color-muted              #6B6560    Texte secondaire (descriptions, labels, nav inactive)
--color-muted-foreground   #9C958E    Texte tertiaire (placeholders, meta, captions)

--color-border             #E8E3DE    Bordure par défaut (cards, inputs, dividers)
--color-border-light       #F0EBE6    Bordure discrète (cards au repos, avant hover)

--color-accent             #D4634E    Terracotta — UNIQUE couleur vive (CTA, focus, badges actifs, stepper)
--color-accent-hover       #C05640    Terracotta hover
--color-accent-light       #FDF2EF    Fond très léger pour badges/tags accent

--color-success            #16A34A    Vert validation (checkmarks pricing, toasts OK)
--color-destructive        #DC2626    Rouge erreur (UNIQUEMENT pour erreurs / destructive actions)
```

### Règles couleurs

- L'accent terracotta (`bg-accent`) est utilisé UNIQUEMENT pour : CTA primaire, stepper actif, dot badges "Popular/Pro", focus-visible ring, liens d'action importants.
- **Max 1 élément accent visible à la fois** (hors stepper multi-step).
- **Pas de gradients.** Jamais. Nulle part. (`bg-gradient-to-*` interdit.)
- **Pas de backgrounds Tailwind gris froids** (`bg-gray-50/100`, `bg-slate-*`, `bg-zinc-*`). Utiliser `bg-surface-warm` ou `bg-surface`.
- **Pas de hex inline** : `bg-[#E5E7EB]` → `border-border`. `bg-[#F3F4F6]` → `bg-surface-warm`.
- Icônes Lucide : couleur `text-muted` par défaut, `text-foreground` si actif, `text-accent` UNIQUEMENT dans CTA avec label.
- Tags catégoriels : autorisés en tons sourdis à 8% opacity (`bg-[#8B6914]/8 text-[#8B6914]`) mais limités aux cartes de features marketing — **jamais dans le dashboard**.

---

## TYPOGRAPHIE

```
--font-display    Satoshi  (variable, headlines)
--font-body       DM Sans  (Google Font, corps de texte)
```

### Règle d'usage

- **Tous les headings (`h1`-`h3`)** : `font-[family-name:var(--font-satoshi)]` avec `font-bold` ou `font-extrabold`.
- **Corps de texte, labels, boutons** : DM Sans (hérité du `body`, pas besoin de le préciser).
- Pas de serif. Pas de monospace sauf code inline/blocks.

### Échelle typographique (marketing + dashboard)

| Usage                         | Classes Tailwind                                      | Weight         |
|-------------------------------|--------------------------------------------------------|----------------|
| H1 Hero marketing             | `text-4xl sm:text-5xl lg:text-6xl tracking-tight`      | extrabold (800) |
| H1 Page dashboard             | `text-2xl sm:text-3xl tracking-tight`                  | bold (700)     |
| H2 Section                    | `text-3xl sm:text-4xl lg:text-5xl tracking-tight`      | bold (700)     |
| H3 Card / sous-section        | `text-lg`                                              | semibold (600) |
| H4 Label de champ / subtitle  | `text-sm`                                              | semibold (600) |
| Body                          | `text-sm` ou `text-base`                               | normal (400)   |
| Body secondaire / description | `text-sm text-muted` ou `text-base text-muted`         | normal (400)   |
| Meta / caption                | `text-xs text-muted-foreground`                        | medium (500)   |
| Badge statut (PRO, LIVE)      | `text-xs font-semibold uppercase tracking-wider`       | semibold (600) |

### Pattern headline distinctif

```tsx
<h2 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl">
  {t('title')} <span className="text-accent">{t('titleAccent')}</span>
</h2>
```

### Règles typo

- `leading-[1.08]` sur H1 hero, `leading-relaxed` sur paragraphes, `leading-snug` sur subtitles.
- Pas d'italique.
- Pas d'uppercase sauf badges de statut (PRO, BROUILLON, LIVE).
- Pas de text-decoration sauf `:hover` sur liens inline.
- Labels de champ : `text-sm font-medium text-foreground` (PAS en bold).

---

## RADIUS

```
--radius-sm    6px    Boutons hamburger, focus ring, petits tags
--radius-md    10px   Boutons CTA, inputs, secondary buttons, icon containers
--radius-lg    14px   Cards (features, pricing, dashboard)
--radius-xl    20px   Sections CTA pleine largeur, blobs décoratifs
--radius-full  9999px Badges pill ("Popular"), toggles monthly/yearly
```

### Règles radius

- Toujours via token : `rounded-[var(--radius-md)]`, jamais `rounded-lg`/`rounded-xl` brut.
- Exception acceptée : `rounded-full` (pill) pour badges/avatars/toggles.
- **Pas de `rounded-2xl`, `rounded-3xl`** hardcodé sur une card.

---

## SPACING & RYTHME

Tailwind par défaut (multiples de 4px).

### Rythme standard (marketing + landing)

- Sections : `py-16 lg:py-24` (64px / 96px)
- Header section (titre + sous-titre) : `mb-10 lg:mb-14`
- Card padding : `p-7 lg:p-8` (28px / 32px)
- Gaps dans grids : `gap-4 lg:gap-5`
- Padding horizontal page : `px-6 lg:px-8`
- Container : `max-w-7xl mx-auto`

### Rythme dashboard

- Padding de page : `p-6 lg:p-8` (24px / 32px)
- Gap entre sections d'une page : `space-y-8` ou `space-y-10`
- Gap entre champs d'un form : `space-y-4` ou `gap-4`
- Padding interne card : `p-5 lg:p-6` (20px / 24px)
- Entre label et input : `mb-1.5` (6px)
- Entre input et helper : `mt-1` (4px)

---

## COMPOSANTS

### Boutons

**Primaire (CTA terracotta) :**
```tsx
className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
```
Variante large (hero, billing) : `px-7 py-3.5`.

**Secondaire (border) :**
```tsx
className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-surface-warm"
```

**Ghost / tertiary (nav, cancel) :**
```tsx
className="text-sm font-medium text-muted transition-colors hover:text-foreground"
```

**Destructive (delete, cancel subscription) :**
```tsx
className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-destructive/20 bg-transparent px-5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/5"
```

Règles :
- Max 1 bouton primaire par écran (hors cards pricing où 3 plans côte à côte).
- "Précédent" = ghost button, à gauche du bouton principal.
- Icône de fin autorisée pour forward motion : `<ArrowRight className="h-4 w-4" />` avec `group-hover:translate-x-0.5`.
- Icône de début autorisée pour création : `<Plus />`.
- Pas de full-width sauf mobile (sidebar menu).

### Cards

```tsx
className="rounded-[var(--radius-lg)] border border-border-light bg-surface p-7 lg:p-8 transition-all duration-300 hover:border-border hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
```

- `border-border-light` au repos (discret), `border-border` au hover.
- Shadow ultra-subtle au hover seulement : `shadow-[0_2px_12px_rgba(0,0,0,0.04)]`. **Jamais au repos.**
- Cards featured (pricing plan populaire) : `border-[1.5px] border-accent md:-translate-y-2`.
- Pas de `bg-*-50` (pas de fond coloré).
- Pas de `border-l-4` (pas de bordure accent latérale).

### Inputs (texte, textarea, select)

```tsx
className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
```

- Height 40px (`h-10`), textarea auto-height avec min `min-h-[88px]`.
- Radius `var(--radius-md)` (10px).
- **Focus ring terracotta très léger** : `ring-2 ring-accent/10` + `border-accent/40`. (Marketing utilise cette approche chaleureuse, pas un gris neutre.)
- Placeholder `text-muted-foreground`.
- **Pas d'icône dans le champ** (sauf search `<Search />` à gauche avec `pl-10`).

### Labels de champ

```tsx
<label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor={id}>
  {label}
</label>
```

Helper text sous l'input : `mt-1 text-xs text-muted`.
Message d'erreur : `mt-1 text-xs text-destructive`.

### Tags / Chips

```tsx
className="inline-flex h-7 items-center gap-1.5 rounded-[var(--radius-sm)] bg-surface-warm px-2.5 text-xs font-medium text-foreground"
```

- Pas de bordure.
- Pas de couleurs différentes par tag (uniformité).
- Bouton × pour delete : `text-muted-foreground hover:text-foreground`.

### Badges de statut

```tsx
// Pill shape distinctive Vizly
className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
```

Variantes :
- `PRO` / `POPULAIRE` : `bg-accent text-white` + dot blanc `<span className="h-1.5 w-1.5 rounded-full bg-white" />`
- `LIVE` : `bg-success/10 text-success`
- `BROUILLON` : `bg-surface-warm text-muted`
- `EN ATTENTE` : `bg-accent-light text-accent`

### Upload zone (drag & drop)

```tsx
className="rounded-[var(--radius-lg)] border-[1.5px] border-dashed border-border bg-surface-warm p-8 text-center transition-colors hover:border-muted-foreground"
```

- Border dashed GRIS (jamais accent).
- Background `bg-surface-warm` (crème, pas blanc).
- Icône upload : `h-6 w-6 text-muted-foreground`.
- Texte : "Glisse ou clique pour ajouter" en `text-sm text-muted`.
- Helper : "JPG, PNG, WebP — max 5 Mo" en `text-xs text-muted-foreground`.

### Toggle segmented (monthly/yearly billing)

Pattern pill bicolore :
```tsx
<div className="inline-flex items-center rounded-full bg-[#f4f4f4] p-1 text-sm font-medium">
  <button className={cn(
    'rounded-full px-4 py-2 transition-colors',
    active ? 'bg-white border border-border text-foreground' : 'text-muted hover:text-foreground'
  )}>{label}</button>
</div>
```

---

## LAYOUT

### Header marketing

```tsx
<header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
```

- Sticky + backdrop-blur semi-transparent.
- Nav desktop : `gap-8`, links en `text-sm font-medium text-muted hover:text-foreground`.
- Mobile : menu slide-down avec `transition-all duration-300 ease-out` sur `max-h`.

### Sidebar dashboard

- Largeur : **220px desktop** (expanded), **56px** (collapsed icons-only).
- Background : `bg-surface-warm` (crème, pas gris froid).
- Border-right : `border-r border-border`.
- Toggle : **chevron button**, PAS au hover (règle mémoire).
- Pre-paint : l'inline script pose `data-sidebar-collapsed` sur `<html>` avant le premier paint pour éviter le flash (cf. `globals.css` ligne 57-62).
- Items de nav :
  - Height `h-9` (36px), padding-left `pl-3`, radius `rounded-[var(--radius-sm)]`.
  - Inactive : `text-muted hover:bg-surface hover:text-foreground`.
  - Active : `bg-surface text-foreground font-medium` (PAS de fond accent).
  - Icônes 18px stroke-1.5, `text-muted` (inactive), `text-foreground` (active).

### Stepper (création portfolio)

- Ligne horizontale avec dots numérotés.
- Dot complété : `bg-accent` rempli, ligne entre steps `bg-accent`.
- Dot actif : `border-2 border-accent bg-background` + numéro `text-accent`.
- Dot futur : `border-2 border-border bg-background` + numéro `text-muted-foreground`.
- Labels sous les dots : `text-xs text-muted`.
- Label de l'étape active : `text-foreground font-medium`.

### Split panel (éditeur + preview)

- Panel gauche (form) : `flex-1 max-w-[520px] overflow-y-auto p-8`.
- Panel droit (preview) : `flex-1 bg-surface-warm border-l border-border`.
- Pas de gap entre les deux.

### Sections de formulaire

**Ne PAS wrapper chaque section dans une card.** Pattern léger :

```
<h3 font-satoshi text-lg font-semibold>Titre de section</h3>
<p text-sm text-muted>Description de la section</p>
                                            ← mb-6 (24px)
<champ 1>
                                            ← mb-4 (16px)
<champ 2>
                                            ← pb-10 (40px)
<hr border-border />
                                            ← pt-10 (40px)
<h3>Section suivante</h3>
```

Cards réservées aux items (card de projet dashboard, card de template).

---

## ANIMATIONS & TRANSITIONS

Deux systèmes qui cohabitent :

### 1. Transitions CSS (interactions locales)

Toujours 150ms ou 200ms, `ease` par défaut :
```css
transition: [property] 150ms ease;    /* hovers, colors */
transition: [property] 200ms ease;    /* buttons, backgrounds */
transition: [property] 300ms ease-out; /* menu mobile, accordions */
```

Transitionable :
- `border-color` au focus/hover
- `background-color` au hover
- `color` au hover
- `opacity` (apparitions)
- `translate` (subtil : `translate-x-0.5` sur icônes boutons)
- `max-height` (accordions, mobile menus)

### 2. Framer Motion (entrées de page / scroll)

**ScrollReveal** (composant partagé `src/components/shared/ScrollReveal.tsx`) :
- Ease : `[0.16, 1, 0.3, 1]` (custom EASE_OUT_EXPO)
- Duration : `0.5s`
- Initial : `{ opacity: 0, y: 24 }`
- Viewport : `{ once: true, margin: '-15% 0px' }`

**StaggerItem** (enfant de ScrollReveal) :
- Duration : `0.4s`
- Delay : `0.15 + index * 0.08` (cascade 120ms entre items)
- Initial : `{ opacity: 0, y: 16 }`

**Hero fadeUp (entrée initiale) :**
- Ease : `[0, 0, 0.2, 1]` (easeOut)
- Duration : `0.3s`
- Delays cascade : 0ms, 50ms, 100ms, 150ms

### Règle finale

- Marketing : ScrollReveal + StaggerItem OK partout (c'est ce qui donne vie aux landing).
- Dashboard : **animations minimales** — seulement fade-in initial sur les pages (fadeUp 0.3s), PAS de scroll animations. Le dashboard doit être rapide et fonctionnel, pas théâtral.
- `prefers-reduced-motion` respecté automatiquement par `globals.css`.

### Interdits

- Transitions > 300ms (sauf mobile menu).
- Scale au hover (`hover:scale-105` interdit sauf micro-effet sur icon containers).
- Bounce, elastic, spring.
- Shimmer sur skeleton loaders (préférer spinner simple ou texte "Chargement…").
- Hover effects qui **shift** le layout.

---

## ICÔNES

Provider : **Lucide React**.

```
Taille par défaut : h-4 w-4 (16px) dans boutons/labels
                    h-5 w-5 (20px) dans headers
                    h-6 w-6 (24px) dans upload zones
Stroke-width      : 1.5 (Lucide default 2 → override via strokeWidth={1.5})
Couleur défaut    : text-muted
```

### Règles icônes

- **Jamais** dans un cercle/carré coloré (pas de `bg-red-100 rounded-full` + icône).
- **Jamais** en couleur accent SAUF dans bouton CTA (`<Check className="text-white" />` dans bouton accent).
- Icônes de check (pricing) : `text-success` avec `strokeWidth={2.5}`.
- Icônes désactivées (pricing non-inclus) : `text-muted-foreground/40`.
- Icônes dans les inputs : **SUPPRIMÉES** sauf search.
- Icônes devant les labels de section : **SUPPRIMÉES** (texte seul).
- Exception justifiée : sidebar nav (icônes essentielles), alertes (AlertTriangle à côté du texte).

---

## GRAIN TEXTURE

Appliquée globalement via `body::before` (cf. `globals.css` ligne 30-40) :
- SVG `feTurbulence fractalNoise` baseFrequency 0.9
- `opacity: 0.035`, `z-index: 9999`
- `pointer-events: none`

**Ne pas retirer.** C'est ce qui donne la matière "premium" à l'ensemble du site.

---

## RESPONSIVE

```
Mobile  : < 768px  → sidebar cachée, hamburger menu, preview derrière bouton
Tablet  : 768-1024px → sidebar collapsed (56px), preview visible si espace
Desktop : > 1024px → layout complet (sidebar 220px + éditeur + preview)
```

- Padding de page : `px-4 md:px-6 lg:px-8`.
- Boutons Précédent/Suivant : sticky bottom sur mobile, inline desktop.
- Typo : `text-2xl sm:text-3xl lg:text-4xl` cascade standard.

---

## DASHBOARD — RÈGLES SPÉCIFIQUES

Le dashboard suit TOUTES les règles ci-dessus, avec ces précisions :

1. **Palette** : favoriser `bg-surface-warm` sur la sidebar et les sections alternées, `bg-surface` (blanc) sur les contenus principaux.
2. **Densité** : plus dense que le marketing. Padding `p-6` en général, pas `p-8 lg:p-12`.
3. **Animations** : fade-in initial uniquement (0.3s), pas de ScrollReveal par élément.
4. **Headers de page** : `<h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight">Titre</h1>` + sous-titre `text-sm text-muted mt-1`.
5. **Actions principales** : bouton primary accent en haut à droite du header de page.
6. **Tables / listes** : pas de shadows, dividers `border-b border-border-light` entre lignes, hover `bg-surface-warm`.
7. **Empty states** : centré, icône Lucide 40px `text-muted-foreground/60`, titre `text-base font-medium`, description `text-sm text-muted`, CTA secondaire.
8. **Toasts** : bas à droite, `max-w-sm`, border+bg blanc, pas de couleurs pleines full-width.
9. **Modales** : overlay `bg-black/30` (pas plus), container `rounded-[var(--radius-xl)]` sur mobile bottom-sheet / `rounded-[var(--radius-lg)]` desktop centered.

---

## ANTI-PATTERNS (interdits quoi qu'il arrive)

1. ❌ Gradients (sur quoi que ce soit)
2. ❌ Box-shadow au repos (shadow-sm/md/lg/xl)
3. ❌ Rounded-2xl / rounded-3xl sur cards (token `--radius-lg` = 14px max)
4. ❌ Backgrounds Tailwind gris froids (`bg-gray-*`, `bg-slate-*`, `bg-zinc-*`)
5. ❌ Hex inline (`bg-[#D4634E]`, `border-[#E5E7EB]`) → toujours token
6. ❌ Icônes dans des cercles/carrés colorés
7. ❌ Plus de 2 couleurs accent (UNE SEULE : terracotta `#D4634E`)
8. ❌ Texte centré sur les formulaires (toujours gauche)
9. ❌ Bordures accent latérales (`border-l-4 border-accent`)
10. ❌ Hover scale / lift qui shift le layout
11. ❌ Uppercase sauf badges de statut
12. ❌ Emojis dans l'UI
13. ❌ Placeholder "fun" ("Tape ici ton super nom !" → "Prénom")
14. ❌ Skeletons shimmer → spinner sobre
15. ❌ Toasts colorés full-width
16. ❌ Modales overlay opaque > 30%
17. ❌ Upload zone en accent dashed
18. ❌ Bold (700) sur le corps de texte (réservé aux boutons/headings bold)
19. ❌ Transitions > 300ms
20. ❌ ScrollReveal dans le dashboard (réservé au marketing)

---

## CHECKLIST AVANT CHAQUE COMMIT UI

- [ ] Aucun hex hardcodé → tous les tokens CSS
- [ ] Aucun `bg-gray-*` / `bg-slate-*` / `bg-zinc-*`
- [ ] Aucun gradient
- [ ] Aucun `shadow-*` au repos (seulement hover, ultra subtle)
- [ ] Aucun `rounded-2xl` / `rounded-3xl` sur card
- [ ] Max 1 bouton accent visible
- [ ] Inputs sans icône intégrée (sauf search)
- [ ] Labels `text-sm font-medium`, pas bold
- [ ] Headings en Satoshi (`font-[family-name:var(--font-satoshi)]`)
- [ ] Sections form séparées par whitespace + `border-b`, pas des cards
- [ ] Upload zone : border dashed gris, bg `surface-warm`
- [ ] Dashboard : pas de ScrollReveal, animations minimales
- [ ] Transitions entre 150ms et 300ms
- [ ] Icônes Lucide stroke-1.5, `text-muted` par défaut
- [ ] Grain texture préservée (body::before intact)
