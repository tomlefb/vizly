# Memoire du projet -- Consultation et mise a jour

Lis `MEMORY.md` a la racine du projet et effectue l'action demandee.

## Action par defaut (consultation)

Lis `MEMORY.md` et affiche un resume clair et structure de :

1. **Etat actuel** : phase en cours, progression, build status, tests status
2. **Derniere session** : date, agent, ce qui a ete fait
3. **Prochaines etapes** : ce qui est prevu ensuite
4. **Bugs connus** : liste des bugs non resolus (ou "Aucun")
5. **Blockers** : lire aussi `.claude/status/blockers.md` et lister les blocages actifs

Format de sortie :
```
== MEMOIRE DU PROJET ==

Derniere mise a jour : [date]
Phase : [N] -- [nom]
Progression : [X]%

-- DERNIERE SESSION --
Date : [date]
Agent : [role]
Realise : [liste courte]
A faire : [prochaines etapes]

-- BUGS CONNUS --
[liste ou "Aucun"]

-- BLOCKERS --
[liste ou "Aucun"]

-- DECISIONS RECENTES --
[3 dernieres decisions du registre]
```

## Arguments

$ARGUMENTS

### Si "update" ou "mise a jour" :

1. Verifier l'etat reel du projet :
```bash
git status
git log --oneline -5
npm run build 2>&1 | tail -5
npm run typecheck 2>&1 | tail -5
```

2. Comparer avec ce que dit MEMORY.md

3. Corriger les incoherences :
   - Mettre a jour "Etat actuel du projet"
   - Mettre a jour "Variables d'environnement configurees" en verifiant .env.local
   - Mettre a jour "Dependances installees" en lisant package.json
   - Mettre a jour "Bugs connus" si des erreurs de build/type sont trouvees
   - Mettre a jour le timestamp "Derniere mise a jour"

4. Ajouter une entree dans "Historique des sessions" :
```markdown
### Session [N] -- [date]
- **Duree** : ~Xmin
- **Agent(s)** : [qui]
- **Objectif** : Mise a jour automatique de la memoire
- **Realise** :
  - Verification de l'etat reel du projet
  - Correction des incoherences dans MEMORY.md
- **Problemes rencontres** : [ou "Aucun"]
- **Decisions prises** : Aucune
- **Fichiers crees/modifies** :
  - `MEMORY.md` -- Mise a jour
- **A faire ensuite** : [reprendre les prochaines etapes]
```

### Si "reset" :

ATTENTION : action irreversible.

1. Demander confirmation explicite a l'utilisateur
2. Si confirme :
   - Conserver les sections : "Registre des decisions", "Bugs connus", "Dependances installees", "Variables d'environnement configurees"
   - Vider "Historique des sessions" et recommencer a Session 0
   - Mettre a jour "Etat actuel du projet" avec l'etat reel

### Si "decisions" :

Afficher le registre complet des decisions avec contexte et impact.

### Si "deps" ou "dependances" :

Lire `package.json` et comparer avec la section "Dependances installees" de MEMORY.md.
Mettre a jour si necessaire.

### Si "env" :

Comparer `.env.example` avec `.env.local` (si existe) et afficher le statut de chaque variable.
