# Catalogue de références SaaS modernes

Avant de concevoir un écran Vizly, **cite 1 ou 2 refs** de cette liste pour ancrer le choix. Tu ne copies pas — tu piques une idée structurante par ref.

## Philosophie générale

Vizly s'inspire de **Linear + Maze + Framer** pour la signature visuelle (typographie soignée, sobriété chaleureuse, micro-interactions discrètes) et de **Stripe + Vercel Dashboard** pour la density info.

**Clef** : ces apps sont sobres mais **jamais plates**. Elles ont une personnalité qui passe par :
1. Le choix de typo (pas Inter, pas Roboto)
2. Un accent color unique mais affirmé
3. Des radius cohérents (pas un mix aléatoire)
4. Une density maîtrisée (ni trop aérée, ni étouffante)
5. Des micro-interactions qui ne shift jamais le layout

---

## Par type d'écran

### Dashboard home

**À imiter :**
- **Linear (inbox/views)** — density raisonnable, hover state très discret, pas de card wrapping pour chaque ligne.
- **Maze dashboard** — welcome header sobre avec prénom de l'user, blocs d'accès rapide sans décoration lourde.
- **Vercel projects list** — hover row, statut en pill discret à droite, metadata en text-xs muted.

**À éviter :**
- Cards géantes avec stats "12 000 visits" en texte énorme coloré.
- Welcome hero avec illustration SaaS générique.
- Gradient backgrounds.

**Pour Vizly** : header page avec salutation discrète + CTA "Créer un portfolio" accent → grille de cartes de portfolios actuels (hover léger, status pill), section "Templates que tu pourrais aimer" sous les cards.

---

### Settings / Profil

**À imiter :**
- **Linear settings** — sections séparées par whitespace + divider fin, pas de card par section. Label à gauche + input à droite ou au-dessous selon density.
- **Stripe account settings** — hierarchy par H2 sobres, helper text systématique sous les inputs.
- **Framer account** — avatar circle 64px, upload via "Change" link texte sous l'avatar.

**À éviter :**
- Sidebar de sous-sections à gauche (on a déjà une sidebar nav principale).
- Cards pour chaque setting (ça fracture la lecture).
- Save button en bas de page — préférer save inline par section ou autosave.

**Pour Vizly** : layout single-column `max-w-2xl`, sections "Compte", "Sécurité", "Préférences" avec `<hr>` entre. Save par section avec toast bottom-right.

---

### Billing / Subscription

**À imiter :**
- **Stripe Dashboard billing** — plan actuel dans un encart très clair en haut, invoices en table dense en dessous, next invoice amount prominent.
- **Linear billing** — toggle monthly/yearly réutilise le pattern marketing (cohérent), upgrade CTA discret mais clair.
- **Vercel usage** — progress bar de quota avec token color (vert/orange/rouge) mais très sobres.

**À éviter :**
- Re-display des 3 plans avec CTA "Upgrade" sur chacun (spam visuel). Préférer 1 CTA "Changer de plan" qui ouvre une modale avec le pricing.
- Invoices en cards séparées — toujours en table.
- "Manage subscription" 8 fois en haut et en bas.

**Pour Vizly** : section "Ton plan" (card sobre avec plan + prix + prochaine facturation), section "Historique de facturation" (table), section "Moyen de paiement" (single line avec card icon + "Modifier").

---

### Templates gallery

**À imiter :**
- **Framer templates** — grille très aérée, preview image dominant, label et price en pied de card, badge "Premium" discret.
- **Webflow templates** — hover reveal CTA "Use template" par-dessus l'image sans bouger la card.
- **Notion templates gallery** — filtres en ligne (chips), grid responsive.

**À éviter :**
- Hover scale 1.05 de la card (shift layout).
- Overlay accent sur l'image au hover (on ne veut pas masquer le template).
- Tags multiples colorés sous chaque card (tag `Dark` vert + `Pro` rouge + `Responsive` bleu).

**Pour Vizly** : grille 3 colonnes desktop, card = image preview 4/3 + titre + prix ou "Gratuit" + badge "Premium" si applicable. Hover : border + subtle shadow, rien d'autre.

---

### Editor (split panel)

**À imiter :**
- **Framer editor** — gauche form dense, droite preview device-frame, pas de fioriture, toolbar minimale en haut.
- **Webflow designer (panneau propriétés)** — sections accordion, labels courts, inputs alignés.
- **Notion edit** — inline, pas de save button (autosave discret).

**À éviter :**
- Toolbar coloré avec 20 icônes (on est sur un form guidé, pas Figma).
- Preview derrière onglets "Desktop / Tablet / Mobile" avec animation coûteuse — toggle simple suffit.

**Pour Vizly** : panel gauche form guidé (stepper en haut + sections whitespace), panel droit preview iframe `bg-surface-warm`, toolbar top = logo + nom du projet + "Publier" CTA.

---

### Empty states

**À imiter :**
- **Linear empty** — icône Lucide sobre 32px muted, titre 1 ligne, description 1-2 lignes, CTA secondaire.
- **Vercel empty deployments** — juste un line-icon + texte + lien texte.

**À éviter :**
- Illustration SaaS générique (le mec avec la boîte vide, la plante en pot).
- Texte trop marketing ("Prêt à lancer ta carrière ?").

**Pour Vizly** : pattern défini dans `SKILL.md`.

---

### Onboarding

**À imiter :**
- **Linear onboarding** — questions sobres 1 par écran, pas de progress bar agressive, keyboard-first.
- **Notion setup** — 3 steps max, skip button toujours visible.
- **Maze welcome** — pre-filled avec le prénom Google, cards minimalistes pour choisir le rôle.

**À éviter :**
- 6 steps avec illustrations custom.
- Animations lourdes entre steps (fade simple suffit).
- Forced completion (toujours laisser "Passer cette étape").

---

### Modales

**À imiter :**
- **Linear confirm delete** — petite, concise, destructive CTA rouge, 1 ligne de description + impact.
- **Stripe cancel subscription** — retention flow sobre (pas de "Attends ! Voilà 3 raisons de rester") mais info claire sur ce qui se passe après cancel.

**À éviter :**
- Modal pleine largeur.
- Overlay noir opaque.
- Header coloré.

---

## Signatures typographiques SaaS modernes

Pour info si on te demande d'ajouter une font :
- **Linear** : Inter Variable + custom icon font. (On l'évite — Vizly a Satoshi.)
- **Framer** : Framer Sans (display) + Inter (body).
- **Stripe** : Stripe Sans (custom) + SF Pro.
- **Notion** : system-ui stack.
- **Vercel** : Geist (display + mono).
- **Vizly** : **Satoshi** (display) + **DM Sans** (body). **Ne pas changer sans discussion.**

## Palettes "SaaS chaleureux" (famille Vizly)

Vizly se distingue en n'étant PAS une énième app bleu/violet/noir. Sa famille :
- **Maze** : orange doux + crème
- **Remote.com** : vert terracotta + blanc cassé
- **Sprig** : terracotta + crème (quasi jumeau)
- **Neon** : vert émeraude + noir (plus technique)

**Vizly** : terracotta `#D4634E` + `surface-warm #FAF8F6`. Garder. Pas de dérive vers le bleu "safe SaaS".

## Quand tu choisis une ref

Dans ton output à l'utilisateur, formule comme ça :

> "Pour cet écran Billing, je m'aligne sur **Stripe Dashboard** (clarté du plan courant en haut, invoices en table dense dessous) et **Linear settings** (sections séparées par whitespace + `<hr>`, pas de card wrapping). Voici le draft →"

Ça montre l'intention et permet à l'utilisateur de rediriger s'il préfère une autre direction.
