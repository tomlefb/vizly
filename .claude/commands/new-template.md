# Nouveau Template — $ARGUMENTS

Lis `MEMORY.md`, `CLAUDE.md`, `.claude/status/design-decisions.md` (fonts déjà utilisées).

## Design Thinking Process (OBLIGATOIRE avant le code)

1. **Purpose** — Cible, problème résolu, contexte d'usage
2. **Tone** — Émotion dominante, registre visuel, références
3. **Differentiation** — En quoi unique vs les 7 autres templates + concurrents
4. **Execution** — Font display + body (UNIQUES), layout, élément signature, palette dynamique

## Checklist technique

- Implémenter `TemplateProps` (portfolio, projects, isPremium)
- Couleurs dynamiques (`primary_color`, `secondary_color`)
- Fonts via `<link>` Google Fonts preconnect (Server Components)
- Responsive mobile-first 375/768/1280px, WCAG AA, < 50KB gzipped
- Badge "Fait avec Vizly" si `isPremium === false`
- Gérer cas limites : pas de photo, 0 projets, bio vide, pas de social links
- `data-testid` sur les éléments testables, `prefers-reduced-motion` respecté

## Livrables

1. `src/components/templates/Template[Nom].tsx`
2. Mise à jour `src/components/templates/index.ts` (export + templateMap)
3. Mise à jour `design-decisions.md` avec fonts choisies
4. Mise à jour `MEMORY.md` + `MEMORY-LOG.md`
