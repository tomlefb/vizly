# Status du projet -- Vue d'ensemble

Tu es le Lead Orchestrator. Tu generes un rapport de status complet du projet Portfolio Builder SaaS.

## Processus

### 0. Lire la memoire

Lis `MEMORY.md` en premier pour avoir le contexte global du projet (phase, progression, derniere session, decisions, bugs).

### 1. Lire les fichiers de status

Lis ces fichiers dans l'ordre :
- `MEMORY.md` -- Memoire persistante (etat global, historique, decisions, bugs)
- `.claude/status/current-sprint.md` -- Taches en cours
- `.claude/status/blockers.md` -- Blocages actuels
- `.claude/status/completed.md` -- Taches terminees
- `.claude/status/design-decisions.md` -- Decisions de design

### 2. Verifier l'etat technique

```bash
# Etat du repo git
git status
git log --oneline -10

# Le projet build-t-il ?
npm run build 2>&1 | tail -5

# Les types sont-ils corrects ?
npm run typecheck 2>&1 | tail -5

# Les tests passent-ils ?
npm run test 2>&1 | tail -10
```

### 3. Analyser la structure du projet

```bash
# Arborescence des fichiers source
find src -type f -name "*.tsx" -o -name "*.ts" | head -50

# Nombre de fichiers par dossier
find src -type f | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn
```

### 4. Generer le rapport

Format de sortie :

```
== STATUS DU PROJET -- Portfolio Builder SaaS ==

Date : [date]
Phase actuelle : [1-5]

-- SANTE TECHNIQUE --
Build     : OK / ECHEC
Types     : OK / ECHEC (X erreurs)
Lint      : OK / ECHEC (X warnings)
Tests     : OK / ECHEC (X/Y passes)

-- TACHES EN COURS --
[liste des taches de current-sprint.md avec statut]

-- BLOCAGES --
[liste des blocages de blockers.md]

-- RECEMMENT TERMINE --
[5 dernieres taches de completed.md]

-- DECISIONS DE DESIGN ACTIVES --
[resume des decisions de design-decisions.md]

-- PROCHAINES ETAPES --
[recommandations basees sur l'analyse]

-- METRIQUES --
Fichiers source   : X
Composants React  : X
API Routes        : X
Tests E2E         : X
Templates         : X/8
```

## Arguments optionnels

$ARGUMENTS

Si un argument est passe (ex: "detailed", "blockers", "tests"), focaliser le rapport sur cet aspect.

## Memoire -- Mise a jour obligatoire

Apres avoir genere le rapport, mettre a jour `MEMORY.md` :
1. Mettre a jour "Etat actuel du projet" avec les valeurs reelles (build, tests, phase)
2. Corriger toute incoherence entre MEMORY.md et l'etat reel du code
3. Mettre a jour le timestamp "Derniere mise a jour"
