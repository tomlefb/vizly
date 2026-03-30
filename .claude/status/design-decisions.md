# Decisions de design

Ce fichier contient les decisions de design qui s'appliquent a TOUS les agents. Chaque agent DOIT lire ce fichier avant de travailler sur un composant visuel.

---

## Direction artistique de l'application

**Style** : Refined Modern
**Display font** : a definir lors de la Phase 1 (choisir parmi : Cabinet Grotesk, Satoshi, General Sans)
**Body font** : a definir lors de la Phase 1 (choisir parmi : DM Sans, Plus Jakarta Sans)
**Fond principal** : #FAFAF8 (warm white)
**Texte principal** : #1A1A1A
**Couleur accent** : a definir lors de la Phase 1 (PAS violet, PAS bleu generique)
**Texture** : grain/noise subtil, opacity 3-5%

---

## Fonts par template

REGLE : Chaque template utilise une paire de fonts UNIQUE. Aucun doublon entre templates.

| Template | Display font | Body font | Statut |
|----------|-------------|-----------|--------|
| Minimal | a definir | a definir | En attente |
| Dark | a definir | a definir | En attente |
| Classique | a definir | a definir | En attente |
| Colore | a definir | a definir | En attente |
| Creatif (premium) | a definir | a definir | En attente |
| Brutalist (premium) | a definir | a definir | En attente |
| Elegant (premium) | a definir | a definir | En attente |
| Bento (premium) | a definir | a definir | En attente |

---

## Composants shadcn/ui personnalises

Les composants shadcn/ui DOIVENT etre personnalises avant utilisation. Ne JAMAIS utiliser les styles par defaut. Adapter :
- Les border-radius (pas de rounded-xl uniforme)
- Les couleurs (utiliser les tokens du design system)
- Les ombres (intentionnelles, pas generiques)
- Les animations (easing et duree coherents)

---

## Historique des decisions

<!-- Ajouter ici les decisions prises pendant le developpement avec date et justification -->
