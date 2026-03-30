# Memoire du projet -- Consultation et mise a jour

## Action par defaut (consultation)

Lis `MEMORY.md` et affiche un resume clair :

```
== MEMOIRE DU PROJET ==

Phase : [etat]
Build : [status]
Tests : [count]
Derniere action : [quoi]
Prochaines etapes : [liste]
Bugs : [liste ou "Aucun"]
```

## Arguments

$ARGUMENTS

### Si "log" ou "historique" :

Lis `MEMORY-LOG.md` et affiche les N dernieres sessions (defaut : 5).

### Si "update" ou "mise a jour" :

1. Verifier l'etat reel :
```bash
npm run build 2>&1 | tail -5
npx tsc --noEmit 2>&1 | tail -5
```
2. Mettre a jour `MEMORY.md` (etat actuel, bugs, env vars)
3. Ajouter une entree courte dans `MEMORY-LOG.md`

### Si "decisions" :

Lis `MEMORY-LOG.md` section "Registre complet des decisions".

### Si "deps" :

Comparer package.json avec la section deps de MEMORY.md.

### Si "env" :

Comparer .env avec la section env vars de MEMORY.md.
