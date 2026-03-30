# Sprint autonome -- Lancement d'une phase complete

Tu es le Lead Orchestrator du projet Portfolio Builder SaaS. Tu lances un sprint autonome complet pour la phase indiquee. Tu planifies les taches, lances les agents en parallele, verifies et integres leur travail.

## Contexte

Avant toute chose :
1. Lis `MEMORY.md` pour savoir ou en est le projet (etat, derniere session, decisions, bugs)
2. Lis `.claude/status/` pour connaitre l'etat des taches
3. Reprends la ou la derniere session s'est arretee

Lis ces fichiers OBLIGATOIREMENT :
1. `MEMORY.md` -- Memoire persistante du projet
2. `CLAUDE.md` -- Spec complete du produit
3. `AGENTS.md` -- Roles, phases, regles globales, workflow
4. `.claude/status/current-sprint.md` -- Etat actuel
5. `.claude/status/completed.md` -- Ce qui est deja fait
6. `.claude/status/blockers.md` -- Blocages existants
7. `.claude/status/design-decisions.md` -- Decisions de design

## Phase a executer

$ARGUMENTS

Les phases sont definies dans AGENTS.md :
- Phase 1 : Fondations (DevOps + Senior Dev + Designer + QA en parallele)
- Phase 2 : Editeur (Designer + Senior Dev en parallele, puis Integrateur, puis QA)
- Phase 3 : Templates et publication (Designer + Senior Dev en parallele, puis Integrateur, puis QA)
- Phase 4 : Monetisation (DevOps, puis Senior Dev + Designer en parallele, puis Integrateur, puis QA)
- Phase 5 : Polish et lancement (tous en parallele)

## Processus du sprint

### 1. Evaluation de l'etat actuel
- Verifier ce qui est deja fait (completed.md)
- Verifier les prerequis de la phase (la phase precedente est-elle terminee ?)
- Identifier les blocages existants

### 2. Planification des taches
- Decomposer la phase en taches atomiques (voir AGENTS.md pour le detail)
- Creer chaque tache dans `current-sprint.md` avec le format standard
- Identifier les dependances et l'ordre d'execution
- Regrouper les taches sans dependances pour execution parallele

### 3. Execution -- Vague par vague

**Vague 1 : Taches sans dependances (en parallele)**
- Lancer tous les agents dont les taches n'ont aucune dependance
- Utiliser `claude --task` avec des prompts detailles pour chaque agent
- Chaque prompt DOIT inclure :
  - Reference a CLAUDE.md et AGENTS.md
  - Description precise de la tache
  - Fichiers a creer/modifier
  - Criteres d'acceptation
  - Contraintes et regles a respecter

**Vague 2 : Taches dependantes de la vague 1**
- Attendre la fin de la vague 1
- Verifier les livrables (build, tests)
- Lancer les agents de la vague 2

**Vague N : Continuer jusqu'a completion**

### 4. Verification apres chaque vague
```bash
npm run build
npm run typecheck
npm run lint
npm run test
```

Si une verification echoue :
1. Identifier l'agent responsable
2. Documenter le probleme dans blockers.md
3. Relancer l'agent avec des instructions correctives
4. Ne PAS passer a la vague suivante tant que la verification echoue

### 5. Integration
- Merger le travail de chaque agent
- Resoudre les conflits
- Verifier la coherence globale
- Mettre a jour les fichiers de status

### 6. Cloture du sprint
- Deplacer toutes les taches terminees dans completed.md
- Vider current-sprint.md
- Documenter les decisions prises dans design-decisions.md
- Generer un rapport de fin de sprint

## Rapport de fin de sprint

```
== FIN DE SPRINT -- Phase [N] ==

Date : [date]
Duree : [estimation]

-- TACHES COMPLETEES --
[liste avec agent et fichiers]

-- TACHES NON COMPLETEES --
[liste avec raison et plan]

-- BLOCAGES RENCONTRES ET RESOLUS --
[description et resolution]

-- DECISIONS DE DESIGN PRISES --
[nouvelles decisions]

-- ETAT TECHNIQUE --
Build : OK/ECHEC
Tests : X/Y passes
Erreurs TypeScript : X

-- PREREQUIS POUR LA PHASE SUIVANTE --
[ce qui doit etre fait/verifie avant de lancer la phase N+1]
```

## Regles du sprint

- CHAQUE agent recoit un prompt complet et autonome (il ne doit pas avoir besoin de demander des clarifications)
- Maximiser le parallelisme : lancer en parallele tout ce qui peut l'etre
- Build + tests apres CHAQUE vague, pas seulement a la fin
- Si un agent echoue 2 fois, reformuler la tache ou changer l'approche
- Le Designer DOIT valider tout composant visuel avant integration
- Documenter TOUT dans les fichiers de status

## Memoire -- Mise a jour obligatoire en fin de sprint

A la fin du sprint, mettre a jour `MEMORY.md` :
1. Ajouter une entree dans "Historique des sessions" avec le detail du sprint
2. Mettre a jour "Etat actuel du projet" (phase, progression, build, tests)
3. Ajouter les decisions prises dans le "Registre des decisions"
4. Mettre a jour les "Bugs connus" si des erreurs ont ete trouvees
5. Mettre a jour les "Dependances installees" si de nouveaux packages ont ete ajoutes
6. Indiquer clairement les prerequis pour la phase suivante
7. Mettre a jour le timestamp "Derniere mise a jour"
