# Vizly Design System

> Direction artistique : **"Handcrafted"** — lime citron, crème chaud, boutons noirs à ombre offset. Pas de SaaS bleu/violet générique. Se reconnaît en 2 secondes.

## Produit

**Vizly** est un SaaS français de création de portfolios en ligne. Formulaire guidé → choix de template → site live sur `pseudo.vizly.fr`.

**Public cible :** créatifs indépendants (photographes, designers, illustrateurs), freelances, étudiants en reconversion.

**Stack :** Next.js 15 (App Router), Tailwind CSS v4, shadcn/ui, Framer Motion, Supabase, Stripe. Interface **en français** par défaut.

**Surfaces :**
1. **Marketing site** — `vizly.fr` (Hero, Features, Pricing, Templates, Blog, Legal)
2. **Dashboard / App** — création et gestion de portfolios, stats, facturation
3. **Portfolios publics** — `pseudo.vizly.fr` (templates appliqués aux contenus de l'utilisateur)

## Sources

- **GitHub :** `tomlefb/vizly` — code source Next.js (importé partiellement : `globals.css`, `layout.tsx`, composants marketing + dashboard, `CLAUDE.md` du design system)
- **Briefing designer :** notes "Handcrafted" fournies par l'utilisateur (source de vérité pour la direction visuelle actuelle)

### ⚠️ Divergence codebase ↔ briefing

Le repo GitHub est dans un état **"ancien"** : palette accent terracotta `#D4634E`, fond blanc pur, boutons accent solides. Les **notes fournies par l'utilisateur sont plus récentes** et décrivent la direction "Handcrafted" en cours d'implémentation : accent lime `#C8F169`, fond crème `#FAF8F6`, boutons noirs avec ombre offset lime. **Ce design system suit les notes utilisateur.**

---

## Index

- `colors_and_type.css` — tokens CSS (couleurs, type, radius, spacing, ombres) + classes signature (`.vz-highlight`, `.vz-wordmark`, grain body::before)
- `assets/` — logo (lime / dark variants), SVG icons si utilisés
- `fonts/` — LICENSE Satoshi (fichiers WOFF2 absents du repo public — substitution Google Fonts, voir VISUAL FOUNDATIONS)
- `preview/` — cartes HTML présentées dans l'onglet Design System
- `ui_kits/marketing/` — landing, pricing, header, hero, footer (Next.js + Tailwind recréé en HTML)
- `ui_kits/dashboard/` — sidebar, dashboard home, stats, nouveau portfolio wizard
- `SKILL.md` — point d'entrée skill Claude Code
- `README.md` — ce fichier

---

## CONTENT FUNDAMENTALS

**Langue :** français d'abord, anglais secondaire. Le tutoiement est obligatoire et chaleureux (« Ton portfolio », « Crée ton site »), jamais de vouvoiement dans l'UI produit.

**Ton :** direct, factuel, artisanal. Zéro marketing-ese. Pas d'exclamations (exceptions très rares pour les CTA). Jamais d'emoji dans l'UI.

**Casing :**
- Phrases : capitale initiale seulement (« Crée ton portfolio », pas « Crée Ton Portfolio »)
- UPPERCASE réservé strictement aux badges de statut : `EN LIGNE`, `BROUILLON`, `POPULAIRE`, `PRO`
- Jamais d'italique
- Ponctuation française : espace insécable avant `:`, `;`, `!`, `?`

**Vocabulaire :**
- « Portfolio » (pas « site web »)
- « Template » (pas « thème »)
- « En ligne » (pas « publié »)
- « Brouillon » (pas « draft »)
- « Tes projets » (pas « vos projets »)
- « Commencer gratuitement → » (flèche ASCII acceptable dans CTA marketing)

**Placeholders :** factuels. « Prénom » pas « Ton super prénom ». « studio-dupont » pas « trouve-un-truc-cool ».

**Exemples concrets (tirés du produit) :**
- H1 marketing : « Crée ton portfolio en **5 minutes** »  (surlignage sur « 5 minutes »)
- H1 dashboard : « Mes **projets** »
- H1 section : « Simple, **transparent** »
- CTA primaire : « Commencer gratuitement → »
- CTA secondaire : « Voir les templates »
- Badge : `EN LIGNE`, `BROUILLON`
- Empty state : « Pas encore de portfolio. Lance-toi. »
- URL affichée : `studio-dupont.vizly.fr` (en mono)

**Ce qu'il ne faut pas écrire :**
- ❌ « Bienvenue sur Vizly ! 🎉 »
- ❌ « Votre portfolio attend d'être créé »
- ❌ « WOW ! Regardez ça ! »
- ✅ « Crée ton portfolio en 5 minutes »
- ✅ « Ton site est en ligne sur `studio-dupont.vizly.fr` »

---

## VISUAL FOUNDATIONS

### Palette — STRICTE

| Token | Valeur | Usage |
|---|---|---|
| `--bg` | `#FAF8F6` | Fond de page (JAMAIS bg-gray/slate/zinc) |
| `--surface` | `#FFFFFF` | Cards, surfaces élevées |
| `--surface-sunken` | `#F4EFE8` | Code, surfaces imbriquées |
| `--fg` | `#1A1A1A` | Texte principal (presque noir, pas noir pur) |
| `--fg-secondary` | `#6B6560` | Texte secondaire |
| `--fg-tertiary` | `#9C958E` | Meta, placeholders |
| `--border-light` | `#EDE6DE` | Cards au repos |
| `--border` | `#D8D3C7` | Cards au hover |
| `--accent` | `#C8F169` | **Unique accent** — lime citron |
| `--accent-deep` | `#8AB83D` | Lime foncé (dot logo inline, liens) |
| `--success-bg` / `--success-fg` | `#E8F5E9` / `#1B5E20` | Badge EN LIGNE |
| `--destructive` | `#DC2626` | Erreurs uniquement |

**Règles absolues :**
- MAX **1 seul accent lime visible** à la fois par page (exception : grille pricing 3 plans)
- **JAMAIS de gradients** (nulle part)
- **JAMAIS** `bg-gray-*` / `bg-slate-*` / `bg-zinc-*` Tailwind
- **JAMAIS de hex inline** — toujours via tokens
- Pas de couleur accent alternative

### Typographie

- **Display :** Satoshi (variable, weight 700-800, tracking `-0.02em`)
- **Body :** DM Sans (400)
- **Mono :** ui-monospace (URLs type `studio-dupont.vizly.fr` uniquement)

**Substitution :** les fichiers `.woff2` Satoshi ne sont pas publics dans le repo (la LICENSE l'est, mais pas les fichiers). J'ai substitué **Plus Jakarta Sans** (géométrique, grotesque, proche métriquement) depuis Google Fonts. **⚠️ À remplacer par les vrais WOFF2 Satoshi** quand tu peux les fournir — mets-les dans `fonts/Satoshi-Variable.woff2`.

Échelle :
- H1 marketing : `text-5xl`/`text-6xl` (48-60px), weight 800
- H1 dashboard : `text-2xl`/`text-3xl` (24-30px), weight 700
- H2 : `text-3xl`/`text-4xl`
- H3 / card title : `text-lg`, weight 600
- Body : `text-sm`/`text-base`
- Meta : `text-xs`

**Règles :** pas d'italique, pas d'uppercase (sauf badges de statut). `leading-[1.08]` sur H1 hero, `leading-relaxed` sur paragraphes.

### Patterns signature

**1. Surlignage « marqueur » sur H1/H2 :** 1 à 2 mots du titre surlignés au lime (`inset:-2px -6px`, rotation `-1.5deg`, radius 3px). Effet fait-main, pas parfait.

**2. Boutons primaires :** fond noir `#1A1A1A`, texte blanc, radius 10px, **ombre offset lime** `box-shadow: 3px 3px 0 #C8F169` (pas de blur). Au hover, shift `translate(1px, 1px)` + ombre réduite à 2px — donne l'effet de « l'appui ».

**3. Cards :** fond blanc, `border: 1px solid #EDE6DE`, radius 14px, **jamais d'ombre au repos**. Hover : border → `#D8D3C7` + `shadow: 0 2px 12px rgba(0,0,0,0.04)` (ultra-subtle).

**4. Avatars / initiales :** pastille lime `#C8F169`, radius 8px (pas rond, pas carré), initiales en noir extrabold.

**5. Badges de statut :** pills, uppercase, letter-spacing `0.05em` :
- `EN LIGNE` : bg `#E8F5E9`, fg `#1B5E20`
- `BROUILLON` : bg `#FAF8F6`, fg `#6B6560`
- `POPULAIRE` (pricing) : bg `#1A1A1A`, fg `#C8F169`

**6. Logo wordmark :** partout où apparaît « Vizly », le point final est coloré au lime foncé (`#8AB83D` pour lisibilité sur fond clair).

### Backgrounds & texture

- **Fond principal :** crème chaud `#FAF8F6` — jamais gris froid
- **Grain texture** appliqué globalement via `body::before` (fractalNoise `baseFrequency 0.9`, opacity `0.035`, z-index 9999, pointer-events none). **Ne jamais retirer** — c'est ce qui donne la matière premium.
- Pas de patterns répétés, pas d'illustrations décoratives lourdes, pas de full-bleed images sauf mockups de templates
- Pas de blur/transparence sauf header sticky (`bg-background/80 backdrop-blur-md`)

### Radii cohérents

- 6px — tags, focus ring
- 10px — boutons, inputs
- 14px — cards
- 20px — sections CTA pleine largeur
- 9999px — pills, toggles

**Jamais** `rounded-2xl` / `rounded-3xl` brut.

### Shadows

- **Cards au repos : aucune ombre.**
- Hover card : `0 2px 12px rgba(0,0,0,0.04)` ultra-subtle
- **Offset shadow accent (signature)** : `3px 3px 0 #C8F169` (bouton primaire), `2px 2px 0 #C8F169` (bouton secondaire dashboard)

### Borders

- 1px par défaut
- 1.5px pour boutons outline (noir)
- 1.5px dashed pour upload zones (border gris, jamais accent)

### Animations & transitions

- Transitions CSS : **150-200ms** ease pour hover/focus/color
- Framer Motion : ScrollReveal + StaggerItem sur le **marketing uniquement**
  - Ease : `[0.16, 1, 0.3, 1]` (custom EASE_OUT_EXPO)
  - Duration : `0.5s`
  - Initial : `{ opacity: 0, y: 24 }`
- **Dashboard : fade-in initial 0.3s uniquement**, rien d'autre
- `prefers-reduced-motion` respecté partout

**Hover states :**
- Boutons primaires : shift `translate(1px,1px)` + shadow offset réduit (l'effet « appui »)
- Boutons secondaires : fond `surface-warm`
- Links : `text-foreground` (noir) depuis `text-muted`
- Cards : border plus foncée + shadow subtle

**Press states :** pas de scale. Pas de changement de couleur additionnel.

**Interdits :**
- Transitions > 300ms
- Hover scale qui shift le layout
- Bounce, elastic, spring
- Skeletons shimmer (spinner sobre ou « Chargement… »)

### Layout

- Container marketing : `max-w-7xl mx-auto px-6 lg:px-8`
- Sections : `py-16 lg:py-24`
- Card padding : marketing `p-7 lg:p-8` (28-32px), dashboard `p-5 lg:p-6` (20-24px)
- Gaps dans grids : `gap-4 lg:gap-5`
- Sidebar dashboard : 220px expanded, 56px collapsed

### Transparence / blur

- Header marketing uniquement : `bg-background/80 backdrop-blur-md`
- Modales overlay : `bg-black/30` max (jamais plus opaque)
- Tooltips sidebar : `bg-foreground/90` + texte blanc
- Pas de verre, pas de néomorphisme

---

## ICONOGRAPHY

**Provider :** **Lucide React exclusivement**. Pas de système custom, pas d'icon font, pas d'SVG custom.

**Règles :**
- Stroke-width : **1.5** par défaut (2 ou 2.5 uniquement pour `<Check>`)
- Tailles :
  - 16px (dans boutons, labels)
  - 18px (sidebar nav)
  - 20px (headers de section)
  - 24px (upload zones, empty states)
  - 36-40px (empty state principal)
- Couleur défaut : `var(--fg-secondary)` (#6B6560)
- Active / focus : `var(--fg)` (#1A1A1A)
- Jamais en accent sauf Check dans bouton CTA

**Anti-patterns :**
- ❌ Icône dans un cercle/carré coloré décoratif
- ❌ Icône devant un label de section
- ❌ Icône dans un input (sauf `<Search>`)
- ❌ Emoji (bannis de l'UI)
- ❌ Caractères Unicode comme icônes (sauf flèche ASCII `→` dans CTA marketing)

**CDN de substitution :** pour les previews HTML de ce design system, j'utilise Lucide via `https://unpkg.com/lucide-static` ou des SVG inline copiés-collés depuis `lucide.dev`. Pas d'icônes custom dessinées à la main.

**Assets dans `assets/` :**
- `logo.svg` — logo original du repo (circle terracotta `#E8553D` — version historique)
- `logo-lime.svg` — logo version « handcrafted » (circle lime `#C8F169`) — **à utiliser par défaut**
- `logo-dark.svg` — wordmark clair + dot lime, pour fonds sombres

---

## Index des UI kits

- `ui_kits/marketing/index.html` — landing Vizly (header, hero, features, pricing, footer)
- `ui_kits/dashboard/index.html` — app (sidebar, dashboard home, portfolio list, créer portfolio)

## Index des previews

Voir `preview/` pour les cartes cards du Design System tab.
