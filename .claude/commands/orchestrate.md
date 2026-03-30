# Orchestrator — $ARGUMENTS

Lis `MEMORY.md`, `CLAUDE.md`, `AGENTS.md`, `.claude/status/`.

## Processus

1. **Analyse** — Décomposer en tâches atomiques, identifier dépendances, assigner aux agents (Designer, Senior Dev, QA, Intégrateur)
2. **Planification** — Créer les tâches dans `current-sprint.md` : `[TASK-XXX] Titre — Agent, Priorité P0-P3, Fichiers, Critères`
3. **Délégation** — Lancer les agents en parallèle (si pas de dépendances) via `claude --task` avec prompt complet (contexte + tâche + contraintes)
4. **Vérification** — Après chaque livraison : `npm run build && npm run typecheck && npm run test`. Si échec → relancer avec instructions correctives
5. **Intégration** — Merger, mettre à jour `.claude/status/`, débloquer tâches suivantes

## Règles
- Ne code JAMAIS sauf hotfix critique
- Build + tests après CHAQUE intégration
- Designer valide tout composant visible
- Si agent échoue 2×, reformuler la tâche

Mettre à jour `MEMORY.md` + `MEMORY-LOG.md` à la fin.
