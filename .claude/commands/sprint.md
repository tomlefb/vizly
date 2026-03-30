# Sprint — Phase $ARGUMENTS

Lis `MEMORY.md`, `CLAUDE.md`, `AGENTS.md`, `.claude/status/`.

## Processus

1. **Évaluation** — Vérifier `completed.md` (ce qui est fait), prérequis de la phase, blocages existants
2. **Planification** — Décomposer la phase en tâches dans `current-sprint.md`, identifier dépendances
3. **Exécution par vagues** :
   - Vague 1 : tâches sans dépendances (en parallèle via `claude --task`)
   - Vague 2+ : tâches dépendantes, lancées après vérification de la vague précédente
   - Chaque prompt agent = contexte complet (CLAUDE.md + tâche + fichiers + contraintes)
4. **Vérification après chaque vague** : `npm run build && npm run typecheck && npm run test`. Si échec → relancer agent avec corrections
5. **Clôture** — Déplacer tâches dans `completed.md`, documenter décisions dans `design-decisions.md`

## Rapport de fin

```
== FIN DE SPRINT — Phase [N] ==
Tâches complétées : [liste]
Build : OK/ECHEC | Tests : X/Y | TypeScript : 0 erreurs
Décisions prises : [liste]
Prérequis phase suivante : [liste]
```

## Règles
- Maximiser le parallélisme entre agents sans dépendances
- Build + tests après CHAQUE vague
- Designer valide tout composant visible
- Documenter TOUT dans `.claude/status/`

Mettre à jour `MEMORY.md` + `MEMORY-LOG.md` à la fin.
