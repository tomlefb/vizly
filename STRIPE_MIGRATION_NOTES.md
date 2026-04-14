# STRIPE_MIGRATION_NOTES

Notes au fil de l'eau sur la migration Stripe Checkout → Stripe Elements.
Ce fichier capture tout ce qui sort du périmètre strict des 7 phases mais
mérite d'être tracé pour ne pas être perdu. Sera nettoyé en fin de Phase 7.

---

## ⚠️ Règle de push pour ce chantier (override temporaire)

**Aucun `git push` entre les phases du chantier Stripe.** Tous les commits
Phase 1 → Phase 7 restent strictement locaux jusqu'à validation finale du
chantier complet. Push uniquement à la fin, sur OK explicite de Tom.

**Pourquoi** : sur un refacto séquentiel de 7 phases, on veut pouvoir
réviser l'historique local (reset, rebase, fix de commit précédent,
re-séquençage des phases) sans contaminer `main` ni les PR de prod.
Push en cours de chantier rendrait l'historique immuable et compliquerait
toute remédiation.

**Override mémoire** : la mémoire utilisateur `feedback_auto_push.md`
dit "Always push after changes, never ask". Cette règle reste valide
**partout sauf ici**. Elle est suspendue uniquement pour les commits
de la migration Stripe Elements (préfixe `feat(stripe): phase N`). Pour
tout autre fichier touché en parallèle hors chantier, la règle de push
auto reste active.

---

## Phase 1 — fondations DB et dettes bloquantes

### Décisions documentées

- **Gestionnaire de paquets** : le projet utilise `npm` (présence d'un
  `package-lock.json`, pas de `pnpm-lock.yaml`). Le brief parle de
  `pnpm build` mais j'utilise `npm run build` pour rester cohérent avec
  le lockfile en place. Si tu souhaites basculer sur pnpm, ce sera un
  chantier séparé (suppression du lock npm, génération du lock pnpm,
  CI à mettre à jour).

- **Dette #11 — version API Stripe** : faux positif de l'audit. Le SDK
  installé `stripe@21.0.1` shippait déjà nativement `apiVersion =
  '2026-03-25.dahlia'` (vérifié dans `node_modules/stripe/cjs/apiVersion.js`).
  Aucun mismatch. Bumpé à `stripe@22.0.1` (latest publié 2026-04-08) pour
  rester sur la version la plus récente comme demandé — la 22 ship la même
  `2026-03-25.dahlia` (pas de bump d'API surface, juste un major TS/build).
  Le commentaire dans `src/lib/stripe/client.ts` documente maintenant
  pourquoi `apiVersion` est pinné explicitement.

- **Convention RLS service_role** : aucune des migrations existantes
  (001 → 011) n'ajoute de policy explicite "Service role can manage X". Le
  projet repose entièrement sur le bypass implicite du `service_role`
  Supabase (`rolbypassrls = true`, vérifié sur la base distante au moment
  de la migration 012). La migration 012 reste alignée sur cette convention
  et documente le choix dans son commentaire d'en-tête.

- **Index `users.stripe_customer_id`** : non créé séparément. La contrainte
  `UNIQUE (stripe_customer_id)` ajoutée par la migration crée déjà un index
  btree implicite, utilisable par les lookups du webhook
  (`resolveUserIdFromSubscription`). Documenté dans le SQL.

### Hors périmètre détecté en cours de route (à traiter plus tard)

- **`STRIPE_SUCCESS_URL` et `STRIPE_CANCEL_URL` dans `.env.example`** :
  déclarées mais jamais lues par le code (les URLs sont hardcodées via
  `APP_URL` dans `src/lib/stripe/checkout.ts`). Elles devraient être
  supprimées de `.env.example` ou réellement câblées. Pas critique, laissé
  intact pour la Phase 1. À nettoyer en Phase 6 (nettoyage de l'ancien
  code de checkout) ou plus tôt si tu préfères.

- **Table `page_views`** : présente en DB et donc dans les types Supabase
  régénérés, mais aucune migration entre 001 et 011 ne la crée. Elle a dû
  être créée hors flow normal (Studio Supabase, ou migration locale non
  versionnée). Hors périmètre Stripe — à clarifier dans un autre chantier.

- **2 vulnérabilités high severity** signalées par `npm install` après le
  bump Stripe — investigué en fin de Phase 1, arbitrage rendu : non-bloquant.
  Détail réel : il n'y a qu'**une seule** advisory (`GHSA-q4gf-8mx6-v5v3`,
  Next.js DoS via Server Components, CVSS 7.5) qui touche les versions
  `>= 16.0.0-beta.0 && < 16.2.3`. Le `next@^15.5.14` du runtime Vizly n'est
  PAS concerné. La vuln existe uniquement parce que `@react-email/preview-server`
  (devDep utilisée seulement via `npm run email` sur `localhost:3001` en dev
  local) embarque sa propre copie de `next@16.x beta` dans son sous-`node_modules`.
  Surface d'attaque réelle = nulle (jamais déployé). Le fix proposé par npm
  (downgrade `@react-email/preview-server@5 → 4.3.2`) est un major qui
  risque de casser le preview des templates email — on ne touche pas à la
  stack emails au milieu d'un chantier Stripe.

  **TODO à vérifier au moment de la session emails Resend** (probablement
  Phase 3 quand on branche `invoice.payment_succeeded` → email renouvellement,
  ou plus tard si on touche au preview server) : re-lancer `npm audit` et
  vérifier si `@react-email/preview-server` a publié entre-temps une version
  qui embarque `next@16.2.3+`. Si oui, simple bump mineur qui résout la
  vuln sans downgrade. Si non, on documente définitivement et on traite
  dans la session "audit sécu & divergences DB" post-Phase 7.

- **`@stripe/stripe-js@^9.0.0`** : toujours présent dans `package.json`,
  toujours non importé. Sera traité en Phase 2 comme prévu (réinstall
  propre + ajout `@stripe/react-stripe-js`).

- **Audit dette #17** (re-publication automatique des portfolios après
  re-souscription) : laissé hors périmètre comme convenu. Si un user
  s'abonne, est unpublish, puis se ré-abonne, ses portfolios restent
  dépubliés. Comportement actuel à documenter pour le support, ou à
  changer plus tard via un flag `was_published_before_cancel` ou similaire.

### Vérifs faites en pré-application de la migration

```sql
-- BYPASSRLS check (execute_sql via MCP Supabase)
select rolname, rolbypassrls from pg_roles
  where rolname in ('service_role','authenticated','anon','postgres');
-- → service_role | true ✅, authenticated/anon | false

-- Doublons de stripe_customer_id (execute_sql via MCP Supabase)
select stripe_customer_id, count(*) from public.users
  where stripe_customer_id is not null
  group by stripe_customer_id having count(*) > 1;
-- → 0 rows ✅
```

### Fichiers touchés en Phase 1

- `supabase/migrations/012_stripe_elements_foundations.sql` (créé)
- `src/lib/supabase/types.ts` (regénéré via MCP Supabase)
- `src/lib/stripe/client.ts` (commentaire renforcé sur apiVersion)
- `.env.example` (fix `CREATIVE`→`CREATIF`, ajout `STRIPE_TAX_ENABLED=false`)
- `package.json` + `package-lock.json` (bump `stripe@21.0.1`→`stripe@22.0.1`)
- `STRIPE_MIGRATION_NOTES.md` (ce fichier, créé)

### Correction Phase 1 → reportée en Phase 2

- **Compte de warnings Phase 1 inexact** : j'avais reporté "3 warnings
  pré-existants" en fin de Phase 1, mais c'était une erreur de mesure due
  à un `tail -80` qui ne capturait que les 3 dernières lignes de warnings
  avant la table des routes. En réalité le build a ~20 warnings ESLint
  pré-existants (custom-fonts dans templates, unused-vars, react-hooks
  exhaustive-deps) qui datent d'avant le chantier Stripe. Vérifié
  rigoureusement en Phase 2 — aucun warning n'est introduit par le code
  Phase 1 ou Phase 2 sur les fichiers Stripe. Le chiffre correct à retenir
  pour la baseline est **~20 warnings pré-existants**.

---

## Phase 2 — lib Stripe serveur pour Elements

### Versions packages (post-install)

- `stripe@22.0.1` (server SDK, déjà installée en Phase 1)
- `@stripe/stripe-js@9.2.0` (réinstallée — était `^9.0.0` avant Phase 2,
  uninstall + reinstall a résolu à `9.2.0`, dernière minor stable)
- `@stripe/react-stripe-js@6.1.0` (nouveau, ajouté pour Phase 4)
- **Aucun conflit peer dep** lors de l'install. Ni `--force` ni
  `--legacy-peer-deps` utilisé.

Note sur la lenteur de `@stripe/stripe-js` : le package est délibérément
minimaliste (juste `loadStripe()` + un type `Stripe`), donc il évolue très
lentement par design — major bumps espacés, minor bumps rares. Si on relit
ce fichier dans 6 mois et qu'on s'étonne de ne voir que `9.x.x`, c'est
normal. Stripe pousse l'innovation côté SDK serveur (`stripe`) pas côté
loader browser.

### Bug Next.js 15.5.15 constaté mid-Phase 2 (faux positif → cache stale)

**Symptomatologie initiale** : après `npm install` du package
`@stripe/react-stripe-js`, le `npm run build` crashait avec :

```
uncaughtException [TypeError: Cannot read properties of undefined (reading 'length')]
```

Crash très tôt, à l'init du build, avant même TypeScript checking. Aucune
stack trace, aucun fichier source mentionné.

**Diagnostic initial (partiel/incorrect)** : l'install avait silencieusement
bumpé `next@^15.5.14` → `next@15.5.15` (sorti entre Phase 1 et Phase 2,
pulled in par le caret). J'ai conclu à un bug dans Next.js 15.5.15 et
proposé Option A (pin exact `15.5.14`) à Tom, qui a validé.

**Diagnostic complet (post-validation)** : pour vérifier honnêtement, j'ai
testé `next@15.5.15` + `rm -rf .next` (cache propre) **après** la validation
d'Option A. **Le build a passé** sur 15.5.15 avec une cache propre. Le vrai
coupable était la cache `.next/cache` (datée du 10 avril, antérieure aux
modifs Phase 2) qui n'était plus compatible avec quelque chose dans la
nouvelle install — possiblement le cache webpack sérialisé, possiblement
un edge case de cache cross-version.

**Conclusion** :
- Next.js `15.5.15` n'est pas cassé en absolu — il fonctionne sur cleansheet
- La combinaison "cache .next stale + nouveau bundle Phase 2" déclenche le
  crash, indépendamment de la version Next.js (à confirmer si on veut être
  exhaustif, mais probable d'après les symptômes)

**Remédiation conservée** : pin exact `next@15.5.14` dans `package.json`
maintenu malgré ce nouveau diagnostic, parce que Tom avait verrouillé
Option A explicitement par philosophie "rien ne bouge mid-chantier", pas
spécifiquement à cause du bug. La justification du pin glisse de
"15.5.15 est cassé" → "stabilité chantier verrouillée jusqu'à fin Phase 7".

**TODO post-chantier** : retirer le pin exact `next@15.5.14` et remettre
un caret (`^15.5.14` ou `^15.5.16+` selon ce qui est dispo et validé) à la
fin du chantier Stripe, hors Phase 7. Tester en cleansheet (`rm -rf .next`)
et bien valider que le build passe avant de commit ce bump.

**Leçon retenue** : un build qui crashe à l'init après un `npm install`
n'est pas forcément un bug du package qu'on vient d'installer. Toujours
tester le build après `rm -rf .next` avant de pointer du doigt une
dépendance. Réflexe à adopter dans les phases suivantes du chantier.

### Décisions architecturales (Q1-Q5 du recap pré-Phase 2)

- **Q1 — couplage lib ↔ Supabase** : verdict **(b)**. La lib
  `src/lib/stripe/elements.ts` reste 100 % pure-Stripe, aucun import de
  `@/lib/supabase/admin`. Le check "user a déjà acheté ce template" vit
  dans la Server Action `createTemplateIntentAction` (couche
  d'orchestration domaine). Raison : testabilité (mock Stripe seul, pas
  de mock Supabase), composabilité (lib réutilisable depuis cron/scripts
  admin), responsabilité claire.

- **Q2 — `confirmation_secret` vs legacy `payment_intent`** : sur dahlia
  (vérifié dans `node_modules/stripe/esm/resources/Invoices.d.ts`),
  l'interface `Invoice` n'a plus de champ top-level `payment_intent`. Le
  chemin canonique pour récupérer le `client_secret` d'un sub
  `default_incomplete` est désormais `latest_invoice.confirmation_secret.client_secret`.
  L'expand passe de `['latest_invoice.payment_intent', 'latest_invoice.confirmation_secret']`
  → `['latest_invoice']` tout court (`confirmation_secret` est inline,
  pas expandable). Implémentation **canonique single-path**, pas de
  primary+fallback (le pin d'API est explicite, on s'engage sur dahlia).
  Commentaire dans `elements.ts` pointe vers une assertion future si
  Stripe ajoute d'autres `confirmation_secret.type`.

- **Q3 — check `subscription_already_active`** : verdict **(b)**, double
  check défensif sur la nouvelle table `subscriptions` ET le legacy
  `users.stripe_subscription_id`. Pendant la fenêtre Phase 2→6, la table
  locale est vide ou partiellement remplie (Phase 3 wire le webhook),
  alors que des users legacy peuvent déjà avoir une sub via le flow
  Checkout existant. Sans le double check, un user legacy passerait
  l'isolation et créerait une 2e sub Stripe en parallèle.
  **TODO Phase 6** : retirer le check `hasLegacySub` quand l'ancien flow
  Checkout sera supprimé et que la table locale sera l'unique source de
  vérité. Le commentaire au-dessus du check pointe explicitement le TODO.

- **Q4 — math des promotion codes** : `Math.round(amount * (1 - percentOff/100))`
  validé tel quel pour `percent_off`. Pour `amount_off` avec mismatch de
  devise → `throw 'invalid_promotion_code_currency'` (pas de silently
  skip ni d'auto-convert). Pour discount qui amène l'amount à `< 50` cents
  (seuil Stripe minimum EUR card PI) → `throw 'discount_too_large'`. Le
  Server Action mappe ces messages stables vers des codes d'erreur
  client-facing que la modal Phase 4 traduira en voix Vizly.

- **Q5 — wallets Apple Pay / Google Pay / Link** : nuance validée.
  `payment_method_types: ['card']` sur la subscription est suffisant
  côté code, mais l'affichage des wallets dans le PaymentElement
  dépend de la config Dashboard Stripe au niveau compte. Voir TODOs
  ci-dessous.

### TODOs explicites pour Tom avant Phase 4

- **TODO Tom — Dashboard Stripe TEST avant Phase 4** : aller sur
  `dashboard.stripe.com` en mode test → Settings → Payment methods →
  activer **Cards** (déjà actif normalement), **Apple Pay**, **Google Pay**,
  **Link**. Désactiver SEPA Direct Debit, Bancontact, iDEAL et tout le reste.
  Sans cette config compte, les wallets ne s'afficheront PAS dans le
  PaymentElement de Phase 4 même avec le code correct.

- **TODO Tom — Dashboard Stripe LIVE + vérif domaine Apple Pay avant
  passage en mode live** :
  1. Refaire l'activation des wallets (Cards/Apple Pay/Google Pay/Link)
     en mode live sur le Dashboard.
  2. Vérifier le domaine `vizly.fr` pour Apple Pay : Stripe demande
     d'uploader un fichier `apple-developer-merchantid-domain-association`
     sous `https://www.vizly.fr/.well-known/`. Tant que le domaine n'est
     pas vérifié, Apple Pay ne s'affichera pas sur Safari en prod, **même
     s'il marchait parfaitement en test sur localhost**. Classique piège
     "marche en test, pas en live".

### Hors périmètre détecté en cours de route (Phase 2)

- **Cache `.next/cache` polluée par les builds Phase 1** : à clear via
  `rm -rf .next` régulièrement entre les phases pour éviter de retomber
  dans le piège du faux positif "build cassé". Pas de fix structurel à
  faire, juste un réflexe à garder.

### Fichiers touchés en Phase 2

- `src/lib/stripe/client-browser.ts` (créé) — singleton Stripe.js loader
- `src/lib/stripe/elements.ts` (créé) — `createSubscriptionWithPaymentIntent`,
  `createTemplatePaymentIntent`, `validatePromotionCode`
- `src/lib/stripe/invoice-metadata.ts` (créé) — `INVOICE_FOOTER_TEXT`,
  `getCustomerInvoiceSettings()`
- `src/actions/billing.ts` (modifié) — `getOrCreateCustomerId` enrichi
  (`invoice_settings`, `address.country`, `preferred_locales`) +
  3 nouvelles Server Actions : `createSubscriptionIntentAction`,
  `createTemplateIntentAction`, `validatePromotionCodeAction`
- `package.json` (modifié) — bump `@stripe/stripe-js` (réinstall propre),
  ajout `@stripe/react-stripe-js`, **pin exact** `next: 15.5.14`
- `package-lock.json` (modifié) — aligné sur les nouveaux packages + le pin
- `STRIPE_MIGRATION_NOTES.md` (modifié — ce fichier, section Phase 2)

### Code Phase 1 toujours intact (vérifié manuellement)

Aucune des fonctions / actions de l'ancien flow Checkout n'a été touchée :

- `createSubscriptionCheckout` (dans `src/lib/stripe/checkout.ts`) ✅
- `createTemplateCheckout` (dans `src/lib/stripe/checkout.ts`) ✅
- `createSubscriptionCheckoutAction` (dans `src/actions/billing.ts`) ✅
- `createTemplateCheckoutAction` (dans `src/actions/billing.ts`) ✅
- `updateExistingSubscription`, `createBillingPortalSession` (toujours
  utilisés, intacts) ✅

Ces fonctions seront supprimées en Phase 6 quand l'UI sera recâblée vers
les nouvelles modals.
