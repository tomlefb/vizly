# Checklist de revue — avant de conclure un écran UI

Applique cette revue **avant de dire "c'est prêt"**. Réponds honnêtement à chaque item. Si un check échoue, corrige avant de commit.

---

## 1. Tokens & cohérence

- [ ] Aucun hex inline (`bg-[#D4634E]`, `text-[#6B6560]`, `border-[#E8E3DE]`) → tous remplacés par les classes tokenisées (`bg-accent`, `text-muted`, `border-border`).
- [ ] Aucun `bg-gray-*`, `bg-slate-*`, `bg-zinc-*`, `text-gray-*` — palette froide Tailwind bannie.
- [ ] Aucun `rounded-lg`, `rounded-xl`, `rounded-2xl` brut → tous via `rounded-[var(--radius-md)]` / `--radius-lg` / `--radius-xl` ou `rounded-full`.
- [ ] Fonts : tous les headings ont `font-[family-name:var(--font-satoshi)]`. Le body hérite DM Sans.
- [ ] Transitions : entre 150ms et 300ms, pas plus.

## 2. Hiérarchie visuelle

- [ ] Le premier élément lu doit être le plus important de l'écran (titre de page, puis CTA, puis contenu).
- [ ] Pas plus de 2 font-weight simultanés par bloc (400 body + 600/700 titres).
- [ ] Pas plus d'**1 bouton primaire accent** visible (hors pricing 3-plans qui est une exception).
- [ ] Les sections sont séparées par du whitespace + border-bottom `border-border-light`, pas par des cards empilées.

## 3. Ombres & profondeur

- [ ] Aucune `shadow-*` Tailwind au repos sur une card ou un conteneur.
- [ ] Seules shadows autorisées : hover subtile `shadow-[0_2px_12px_rgba(0,0,0,0.04)]` sur card, shadow `shadow-[0_4px_20px_rgba(0,0,0,0.08)]` sur toast/modale ouverte.
- [ ] Pas de `drop-shadow-*` sur du texte.

## 4. Icônes

- [ ] Lucide uniquement, `strokeWidth={1.5}` (sauf checks : 2 ou 2.5).
- [ ] Taille cohérente dans un même bloc (pas d'icônes 16px mélangées avec 24px sans raison).
- [ ] Couleur : `text-muted` par défaut, `text-foreground` si actif, `text-accent` uniquement dans CTA accent (`<Icon className="text-white" />`) ou success/destructive selon contexte.
- [ ] Aucune icône dans un cercle/carré coloré décoratif (`bg-red-100 + icon rouge`).
- [ ] Aucune icône devant un label de section.
- [ ] Aucune icône dans un input (sauf `<Search />`).

## 5. Inputs & formulaires

- [ ] Height `h-10` pour text/select, textarea min 88px.
- [ ] Focus : `border-accent/40 ring-2 ring-accent/10`, pas de shadow lourde ni border rouge.
- [ ] Labels `text-sm font-medium text-foreground mb-1.5`, pas en bold.
- [ ] Helper text `text-xs text-muted mt-1`, erreurs `text-xs text-destructive mt-1`.
- [ ] Placeholder factuel (pas de "Tape ton super titre ici !"), en `text-muted-foreground`.
- [ ] Form aligné à gauche, jamais centré.

## 6. Cards & listes

- [ ] `border border-border-light` au repos, `border-border` au hover.
- [ ] Radius `rounded-[var(--radius-lg)]` (14px), pas plus.
- [ ] Padding uniforme entre cards d'une même grille.
- [ ] Pour > 3 items similaires : privilégier une liste/table au lieu de cards empilées.

## 7. Spacing & rythme

- [ ] Le header de page est séparé du contenu par `mb-8` ou `mb-10`.
- [ ] Sections dans une page : `space-y-8` ou `space-y-10`.
- [ ] Champs dans un form : `space-y-4`.
- [ ] Padding de page : `p-6 lg:p-8` (dashboard) ou `py-16 lg:py-24 px-6 lg:px-8` (marketing).

## 8. États

- [ ] **Loading** : spinner sobre ou texte "Chargement…", pas de skeleton shimmer.
- [ ] **Empty** : pattern centered sobre (icône 32px muted + titre + description + CTA secondaire), pas d'illustration générique.
- [ ] **Error** : texte `text-destructive` sobre, pas de card rouge pleine.
- [ ] **Disabled** : `opacity-50 cursor-not-allowed`, pas de remplacement de couleur.
- [ ] **Success toast** : bottom-right, max-w-sm, disparaît en 4s.

## 9. Animations

- [ ] Dashboard : **pas de ScrollReveal**, seulement fade-in initial sur la page (0.3s).
- [ ] Marketing : ScrollReveal + StaggerItem OK avec ease `[0.16, 1, 0.3, 1]`.
- [ ] Aucun `hover:scale-*` qui shift le layout.
- [ ] Aucun bounce/spring/elastic.
- [ ] `prefers-reduced-motion` respecté (Framer Motion le gère automatiquement).

## 10. Contenu

- [ ] Copie claire, directe, pas marketing-ese (pas de "Lance ta carrière de freelance en 3 clics!").
- [ ] Pas d'emojis dans l'UI.
- [ ] Accents français corrects partout (é, è, à, ç, œ, ù).
- [ ] Uppercase seulement sur les badges de statut (PRO, LIVE, BROUILLON).
- [ ] Pas de texte italique.
- [ ] Montants en euros avec espace insécable : `4,99 €` (ou respecte le format de la codebase existante).

## 11. Responsive

- [ ] L'écran est lisible et utilisable à 375px de large (iPhone SE).
- [ ] La sidebar se cache en < 768px (hamburger).
- [ ] Les CTA sticky bottom sur mobile, inline desktop.
- [ ] Padding adaptatif `px-4 md:px-6 lg:px-8`.

## 12. Accessibilité minimum

- [ ] Contraste texte/fond ≥ AA (text-muted sur bg-background : OK, text-muted-foreground sur bg-background : borderline — éviter sur du texte important).
- [ ] `aria-label` sur boutons icon-only.
- [ ] `focus-visible` ring accent visible (hérité de `globals.css`).
- [ ] Headings dans l'ordre (`h1 → h2 → h3`, pas de skip).
- [ ] Images avec `alt` pertinent.

## 13. Test visuel final

Avant de commit :
- [ ] Ouvrir l'écran dans le navigateur (si dev server up).
- [ ] Vérifier que le **grain texture** est bien présent (`body::before`).
- [ ] Se demander : "Si je voyais ça sur un Dribbble de senior designer, est-ce que je trouverais ça soigné ?"
- [ ] Si on enlève 20% de la page, qu'est-ce qui saute ? Le supprimer.

## 14. Checklist spécifique au pattern

Si tu viens de toucher à…

**…un formulaire** → champs 1 par ligne sur mobile, possibles 2 par ligne desktop, save par section si > 5 champs.

**…une modale** → overlay `bg-black/30` max, focus trap, ESC ferme, CTA primaire à droite, cancel ghost à gauche.

**…une liste/table** → dividers `divide-y divide-border-light`, hover `bg-surface-warm`, 1ère col = identifier, dernière col = actions avec `IconButton` ghost.

**…une sidebar nav** → chevron toggle (pas hover), items `h-9`, état actif `bg-surface text-foreground`, icônes 18px.

**…un onboarding/stepper** → dot + numéro, pas d'icônes custom, progression accent, étape future en muted.

**…un CTA de conversion** → un seul par vue, accent + icône ArrowRight, sous-texte rassurant en muted (pas "14 jours gratuit !" en rouge clignotant).

---

## Si un check échoue

1. Corrige **avant** de faire une autre modification.
2. Si tu ne sais pas comment corriger sans casser le design system : **demande à l'utilisateur** plutôt que d'inventer.
3. Si le design system ne couvre pas le cas : **propose d'enrichir CLAUDE.md**, puis implémente.

Ne conclus jamais "c'est prêt" si un item critique (tokens, shadows au repos, hex inline) n'est pas respecté.
