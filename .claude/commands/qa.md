# Session QA -- Audit qualite complet

Tu es le QA Engineer du projet Portfolio Builder SaaS. Tu effectues un audit qualite complet selon le scope demande.

## Contexte

Lis ces fichiers OBLIGATOIREMENT :
1. `MEMORY.md` -- Memoire persistante du projet (etat, bugs connus, decisions)
2. `CLAUDE.md` -- Spec produit, flows utilisateur, stack
3. `AGENTS.md` -- Section QA, flows critiques, seuils Lighthouse, conventions de test

## Scope

$ARGUMENTS

Si aucun scope n'est precise, effectuer un audit COMPLET de tout le projet.

## Processus d'audit

### 1. Build et types

```bash
# Le projet doit compiler sans erreur
npm run build

# Zero erreur TypeScript
npm run typecheck

# Zero warning ESLint non justifie
npm run lint
```

Documenter chaque erreur trouvee avec le fichier et la ligne.

### 2. Tests E2E Playwright

```bash
# Lancer tous les tests
npx playwright test

# Lancer les tests du scope specifique
npx playwright test tests/e2e/[scope].spec.ts
```

Si des tests manquent pour des flows critiques, les creer dans `tests/e2e/`.

**Flows critiques (voir AGENTS.md pour la liste complete)** :
1. Inscription / connexion
2. Editeur : remplir chaque etape
3. Preview du portfolio
4. Publication avec paiement
5. Portfolio public sur subdomain
6. Achat template premium
7. Modification post-publication

### 3. Responsive

Pour chaque page et template, verifier le rendu sur :
- 375px (mobile)
- 768px (tablette)
- 1280px (desktop)

Utiliser Playwright pour les captures :
```typescript
await page.setViewportSize({ width: 375, height: 812 });
await page.screenshot({ path: 'screenshots/mobile-[page].png' });
```

Verifier :
- Pas de scroll horizontal
- Textes lisibles
- Images adaptees
- Navigation fonctionnelle
- Touch targets >= 44x44px

### 4. Accessibilite

Verifier pour chaque page :
- Navigation clavier complete (tab, enter, escape, fleches)
- Focus visible sur tous les elements interactifs
- aria-labels sur les elements sans texte
- Contrastes WCAG AA (4.5:1 texte, 3:1 grands textes)
- Alt text sur les images
- Structure heading correcte (h1 > h2 > h3, pas de saut)
- Formulaires avec labels associes

### 5. Performance Lighthouse

Pour chaque page publique :
```bash
# Utiliser Lighthouse via Playwright ou CLI
npx lighthouse [url] --output=json --output-path=./lighthouse-report.json
```

**Seuils obligatoires** :
- Performance : > 90
- Accessibilite : > 95
- Best Practices : > 90
- SEO : > 90

### 6. Securite (verification rapide)

- [ ] Pas de secrets dans le code source (grep pour les patterns de cles API)
- [ ] Pas de console.log en production
- [ ] RLS actif sur toutes les tables
- [ ] Webhooks Stripe verifies par signature
- [ ] Pas de donnees sensibles dans les reponses API publiques
- [ ] Validation Zod sur toutes les entrees utilisateur

## Format du rapport

Generer le rapport dans `.claude/status/qa-report.md` :

```markdown
# Rapport QA -- [date]

## Scope : [description]

## Resume

| Categorie | Statut | Details |
|-----------|--------|---------|
| Build | OK/ECHEC | [details] |
| TypeScript | OK/ECHEC | [nombre erreurs] |
| Lint | OK/ECHEC | [nombre warnings] |
| Tests E2E | OK/ECHEC | [passes/total] |
| Responsive | OK/ECHEC | [problemes] |
| Accessibilite | OK/ECHEC | [problemes] |
| Performance | OK/ECHEC | [scores] |
| Securite | OK/ECHEC | [problemes] |

## Problemes trouves

### [CRITIQUE] -- Bloquants (doivent etre corriges avant deploy)
- [description, fichier, ligne, correction suggeree]

### [IMPORTANT] -- Non-bloquants mais a corriger
- [description, fichier, ligne, correction suggeree]

### [MINEUR] -- Ameliorations souhaitables
- [description, fichier, ligne, correction suggeree]

## Tests manquants
- [flows non couverts]

## Verdict : PASSE / ECHEC
```

## Memoire -- Mise a jour obligatoire en fin de session QA

A la fin de l'audit, mettre a jour `MEMORY.md` :
1. Ajouter une entree dans "Historique des sessions" avec le resume de l'audit
2. Mettre a jour "Etat actuel du projet" (build status, tests status)
3. Mettre a jour "Bugs connus" avec tous les problemes critiques et importants trouves
4. Mettre a jour le timestamp "Derniere mise a jour"
