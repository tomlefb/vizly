# Decisions de design

Ce fichier contient les decisions de design qui s'appliquent a TOUS les agents. Chaque agent DOIT lire ce fichier avant de travailler sur un composant visuel.

---

## Direction artistique de l'application

**Style** : Refined Modern
**Display font** : Satoshi (Variable, via Fontshare CDN, self-hosted in public/fonts/)
**Body font** : DM Sans (via next/font/google)
**Fond principal** : #FAFAF8 (warm white)
**Texte principal** : #1A1A1A
**Couleur accent** : #E8553D (warm coral-red) -- accent-hover: #D44A33, accent-light: #FFF0ED
**Bordure** : #E8E6DC (warm border), #F0EEE6 (light variant)
**Surface** : #FFFFFF (elevated), #F5F4F0 (warm)
**Texture** : grain/noise SVG inline, opacity 3.5%, fractalNoise type, fixed overlay z-9999

---

## Fonts par template

REGLE : Chaque template utilise une paire de fonts UNIQUE. Aucun doublon entre templates.

| Template | Display font | Body font | Statut |
|----------|-------------|-----------|--------|
| Minimal | Outfit | Source Sans 3 | TERMINE |
| Dark | JetBrains Mono | IBM Plex Sans | TERMINE |
| Classique | Merriweather | Lato | TERMINE |
| Colore | Fredoka | Nunito | TERMINE |
| Creatif (premium) | Syne | Work Sans | TERMINE |
| Brutalist (premium) | Bebas Neue | Roboto Mono | TERMINE |
| Elegant (premium) | Cormorant Garamond | Raleway | TERMINE |
| Bento (premium) | Inter Tight | Red Hat Display | TERMINE |

---

## Composants shadcn/ui personnalises

Les composants shadcn/ui DOIVENT etre personnalises avant utilisation. Ne JAMAIS utiliser les styles par defaut. Adapter :
- Les border-radius (pas de rounded-xl uniforme)
- Les couleurs (utiliser les tokens du design system)
- Les ombres (intentionnelles, pas generiques)
- Les animations (easing et duree coherents)

---

## Historique des decisions

### Sprint 4 -- 2026-03-30

8. **Creatif template -- Syne + Work Sans** : Asymmetric layout with offset photo (3:4 ratio, creative border-radius 4px/4px/4px/40px). First-letter stroke treatment on the name. Projects as case studies with alternating left/right image/description layout. Tags displayed as slash-separated text (not pills).
9. **Brutalist template -- Bebas Neue + Roboto Mono** : Enormous name (9xl uppercase), "WORK" watermark rotated behind content. Dark/light mode derived from secondary_color luminance. Square photo with solid 3px primary border. Projects styled as newspaper articles with oversized numbers (01., 02.) and bracket-wrapped tags [tag]. Thick 4px dividers.
10. **Elegant template -- Cormorant Garamond + Raleway** : Gallery/magazine feel with extreme whitespace (6rem+ padding). Portrait photo (140x180). Name in light weight serif with wide tracking. Bio in italic Cormorant. Tags almost invisible (0.62rem, uppercase, tracking-widest, muted color). Vertical line separator in footer.
11. **Bento template -- Inter Tight + Red Hat Display** : Widget board layout using CSS grid with 4 columns. Dedicated blocks for photo (1x1), name+bio (2x1), stats with project count (1x1 accent), social links (2x1), tag cloud (2x1). Hero project spans full width (4col). Rounded-20px cards with subtle borders. Apple/iOS widget aesthetic.

### Sprint 1 -- 2026-03-30

1. **Display font = Satoshi** : Choisi pour son caractere geometrique moderne sans etre generique. Self-hosted via Fontshare CDN (woff2 variable). CSS var: --font-satoshi, Tailwind: font-display.
2. **Body font = DM Sans** : Lisibilite optimale, rondeur subtile, via next/font/google. CSS var: --font-dm-sans, Tailwind: font-body.
3. **Accent = #E8553D** : Warm coral-red. Distinctif, pas violet, pas bleu. Bon contraste sur fond clair et fonce.
4. **Hero layout asymetrique** : Grid 7/5 au lieu de centre. Mock portfolio preview avec browser chrome (macOS dots).
5. **Features grid non-uniforme** : col-span varie (2-1-1-1-1-2) avec accents colores distincts par feature.
6. **Pricing card Starter en avant** : Badge "Populaire", border accent, shadow, -translate-y-2.
7. **CTA section dark** : bg-foreground pour contraste maximal avant le footer.
