# Design Review — $ARGUMENTS

Lis `MEMORY.md`, `CLAUDE.md` (section Design System), `.claude/status/design-decisions.md`.

## Checklist

### Anti-AI-Slop (CRITIQUE — échec = review rejetée)
- Pas de gradient violet-bleu, Inter/Roboto en display, layout symétrique sans personnalité
- Pas de border-radius uniforme, ombres par défaut, palette pastel fade, shadcn non personnalisé

### Typographie & Couleurs
- Font display distinctive, hiérarchie claire, line-height 1.4-1.6, texte ≥ 14px
- Contraste WCAG AA 4.5:1, palette cohérente, max 3-4 couleurs principales

### Responsive & Accessibilité
- Mobile-first, rendu correct 375/768/1280px, pas de scroll horizontal, touch targets ≥ 44px
- Navigation clavier, focus visible, aria-labels, alt text, heading hierarchy

### Animations
- 150-300ms, ease-out entrées, prefers-reduced-motion respecté, uniquement transform/opacity

## Format de sortie

```
[CRITIQUE] fichier:ligne — Problème. Correction suggérée.
[IMPORTANT] fichier:ligne — Problème. Correction suggérée.
[SUGGESTION] fichier:ligne — Amélioration optionnelle.
```

Verdict : APPROUVÉ / AVEC RÉSERVES / REJETÉ. Mettre à jour `MEMORY.md` + `MEMORY-LOG.md`.
