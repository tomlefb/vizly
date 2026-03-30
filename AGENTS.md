# Architecture Multi-Agent

Prérequis : chaque agent lit `MEMORY.md` + `CLAUDE.md` avant de commencer.

## Agents

### Lead / Orchestrator
Planifie, décompose, délègue via `claude --task`, vérifie (build + tests après chaque intégration), intègre. Ne code JAMAIS sauf hotfix critique. Maintient `.claude/status/` à jour. Si un agent échoue 2×, reformuler la tâche.

### Designer / Frontend
Responsable de tout le visuel : landing, éditeur, dashboard, templates. Suit le Design Thinking Process (Purpose → Tone → Differentiation → Execution) avant chaque composant. Vérifie anti-patterns AI slop (voir CLAUDE.md), responsive 375/768/1280px, accessibilité WCAG AA. Chaque template = paire de fonts unique documentée dans `design-decisions.md`.

### Senior Dev / Backend
Architecture DB, API, intégrations (Stripe, Supabase Auth, Resend). TypeScript strict, Zod pour toute validation, RLS 100% des tables, Server Actions pour mutations. Utilise les MCPs Supabase et Resend en priorité. Webhooks Stripe idempotents avec vérification de signature.

### QA / Testeur
Tests Playwright E2E dans `tests/e2e/`. Sélecteurs `data-testid` uniquement. Couvre les flows critiques : auth, éditeur complet, publication, paiement, portfolio public. Teste responsive + accessibilité + performance Lighthouse (>90 perf, >95 a11y).

### Intégrateur
Connecte frontend ↔ backend. Gère tous les états UI (loading, error, success, empty). Debounce 300ms sur les inputs. Upload images avec preview locale immédiate puis upload async. Server Actions pour les mutations.

## Communication

Fichiers de statut dans `.claude/status/` : `current-sprint.md`, `completed.md`, `blockers.md`, `design-decisions.md`. Format tâche : `[TASK-XXX] Titre — Agent, Statut, Priorité P0-P3, Fichiers, Critères d'acceptation`.

## Règles globales

1. **TypeScript strict** — pas de `any`, `@ts-ignore`, `as unknown as`. Zod pour les types d'entrée.
2. **Accessibilité + responsive** — clavier, aria-labels, focus visible, mobile-first 375/768/1280px.
3. **Performance** — imports nommés (pas `import *`), `next/dynamic` pour le lazy loading, `next/image` systématique.
4. **Sécurité** — RLS 100%, validation Zod côté serveur, pas de secrets client-side, signatures webhooks vérifiées.
5. **Mémoire** — lire `MEMORY.md` au début, mettre à jour à la fin (état + `MEMORY-LOG.md` append-only).
