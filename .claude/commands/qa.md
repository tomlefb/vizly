# Session QA — $ARGUMENTS

Lis `MEMORY.md`, `CLAUDE.md`. Si aucun scope précisé, audit COMPLET.

## Processus

### 1. Build & types
```bash
npm run build && npm run typecheck && npm run lint
```

### 2. Tests E2E
```bash
npx playwright test  # ou tests/e2e/[scope].spec.ts
```
Flows critiques : auth, éditeur (5 étapes), publication, paiement Stripe, portfolio public, template premium. Si des tests manquent, les créer.

### 3. Responsive
Tester 375px / 768px / 1280px via Playwright (`page.setViewportSize`). Pas de scroll horizontal, textes lisibles, touch targets ≥ 44px.

### 4. Accessibilité
Navigation clavier, focus visible, aria-labels, contrastes WCAG AA 4.5:1, alt text, heading hierarchy.

### 5. Sécurité
Pas de secrets dans le code, RLS actif, webhooks vérifiés par signature, Zod sur toutes les entrées.

## Rapport dans `.claude/status/qa-report.md`

| Catégorie | Statut |
|-----------|--------|
| Build / TypeScript / Lint / Tests E2E / Responsive / Accessibilité / Performance / Sécurité |

Problèmes : `[CRITIQUE]` bloquant, `[IMPORTANT]` à corriger, `[MINEUR]` optionnel.
Verdict : PASSE / ECHEC. Mettre à jour `MEMORY.md` + `MEMORY-LOG.md`.
