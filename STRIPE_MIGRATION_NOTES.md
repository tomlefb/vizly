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

## ⚠️ Règles méthodo du chantier

### Règle Stripe types-vs-runtime (Phase 4 post-mortem)

Les types TypeScript du SDK Stripe reflètent les **formes possibles**
d'un champ, **pas sa présence garantie dans une response API donnée**.
Un champ typé `?: Foo | null` peut signifier **trois états runtime
distincts** :

1. **Absent** du payload par défaut (nécessite un expand explicite)
2. **Présent et `null`** (le champ est dans le payload mais sa valeur
   est null — état pré-finalisation, état d'erreur, etc.)
3. **Présent et populé** avec une valeur réelle

Seule **l'expansion explicite** ou une **lecture de la doc Stripe
runtime** (hors types TS) garantit l'état (3). Le type TS à lui seul
ne permet PAS de distinguer (1) de (2)/(3) — c'est ce qui a causé le
bug de Phase 4 sur `invoice.confirmation_secret`, où le type déclarait
`?: Invoice.ConfirmationSecret | null` et j'en ai conclu à tort que le
champ était inline sans besoin d'expand.

**Règle opérationnelle** : quand une extraction de champ Stripe échoue
en runtime alors que le type TS la rend possible, le premier réflexe
est (a) d'**ajouter un expand explicite et de re-tester**, avant
(b) d'hypothéser un bug Stripe, un bug de config prix, ou un bug de
cycle de vie.

**À appliquer pour le reste du chantier** :

- **Phase 5** (`createTemplatePaymentIntent` → `PaymentIntent` pour
  templates) : vérifier que `client_secret` est bien accessible sans
  edge case. `stripe.paymentIntents.create` retourne normalement le
  client_secret inline sur les PI classiques, mais dahlia pourrait
  avoir changé ça aussi. Dump runtime avant confiance.
- **Phase 6** (recâblage UI) : toute lecture de `subscription.items`,
  `subscription.latest_invoice`, etc. doit être testée runtime si les
  types TS laissent penser que le champ est inline.
- **Phase 7** (lecture des `invoices` pour le récap `/billing`) : les
  champs lus depuis la table locale `invoices` (peuplée par le webhook
  Phase 3) n'ont pas ce problème — ils viennent de notre DB, pas de
  Stripe runtime. Mais si on lit des champs Stripe live en fallback,
  même règle : expand explicite ou dump runtime.

**Réflexe spécifique** : si tu touches à un `expand: [...]` Stripe,
tu vérifies runtime avant de faire confiance au type TS.

### Règle cache `.next` (Phase 2 post-mortem)

Avant de diagnostiquer un build cassé comme étant la faute d'une
dépendance, toujours faire `rm -rf .next && npm run build` pour
exclure la cache. 30 secondes de coût pour 10+ minutes économisées
sur un faux positif. Cette règle a été établie en Phase 2 après le
faux positif Next.js `15.5.15` (voir section Phase 2).

**⚠️ Réserve Phase 4** : `rm -rf .next` NE DOIT JAMAIS être fait
pendant qu'un dev server Next est actif. Le dev server garde en
mémoire des chunks compilés ; si on supprime le `.next` sur disque,
les prochaines requêtes retournent 404 sur tous les assets et la
page se charge en HTML brut sans CSS. Toujours stopper le dev server
AVANT un clean, OU utiliser `npm run build` sans clean dans un autre
terminal quand le dev server tourne. Cette sous-règle a été établie
après le faux positif Phase 4 où j'ai cassé la session de test
visuel de Tom en cleant pendant que son dev server tournait.

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

**Justification finale du pin (validée par Tom post-diagnostic)** : pin
exact `next: 15.5.14` conservé pour toute la durée du chantier Stripe,
**non pas parce que `15.5.15` est cassé** (le diagnostic initial s'est
révélé être une cache `.next` stale cross-version, pas un bug package),
mais par **principe de stabilité mid-chantier** : zéro variable parasite
dans la résolution de dépendances pendant 7 phases. Trois raisons qui
tiennent indépendamment du bug :

1. **Stabilité par principe** : le fait qu'on ait eu UNE fausse alerte
   due à une cache stale prouve précisément pourquoi on veut zéro
   variable parasite pendant le chantier. Un caret auto-upgrade peut
   déclencher d'autres faux positifs du même genre dans les phases
   suivantes.
2. **Reproductibilité cross-machine** : un clone du repo sur un autre
   laptop ou en CI doit produire exactement le même `node_modules`. Le
   pin garantit ça, le caret ne le garantit pas à 100 %.
3. **Coût nul** : c'est un caractère à virer (`^`) à la fin du chantier.

**TODO post-chantier** : retirer le pin exact et revenir au caret
`^15.5.x` à la fin du chantier Stripe (hors Phase 7), en testant avec
`rm -rf .next && npm run build` avant de commit ce bump pour éviter de
retomber dans le piège du faux positif cache stale.

**Règle méthodo retenue pour la suite du chantier** : avant de
diagnostiquer un build cassé comme étant la faute d'une dépendance,
toujours faire `rm -rf .next && npm run build` pour exclure la cache.
30 secondes de coût pour 10+ minutes économisées sur un faux positif.

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

- **TODO Tom — Dashboard Stripe TEST wallets avant Phase 4** : aller sur
  `dashboard.stripe.com` en mode test → Settings → Payment methods →
  activer **Cards** (déjà actif normalement), **Apple Pay**, **Google Pay**,
  **Link**. Désactiver SEPA Direct Debit, Bancontact, iDEAL et tout le reste.
  Sans cette config compte, les wallets ne s'afficheront PAS dans le
  PaymentElement de Phase 4 même avec le code correct.

- **TODO Tom — Dashboard Stripe TEST webhook events avant Phase 4**
  (ajouté en Phase 3) : s'assurer que l'endpoint webhook Stripe Dashboard
  (mode test) a bien les **7 events** suivants activés :
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `checkout.session.completed`
  - `payment_intent.succeeded`

  Sans cette config endpoint, la modal Phase 4 semblerait fonctionner
  côté front (le `confirmPayment` retourne success) mais la DB locale
  ne serait jamais synchronisée — le webhook `customer.subscription.created`
  n'arriverait jamais → pas de row dans `subscriptions`, `users.plan`
  jamais mis à jour, user qui paie sans être crédité.

  Note CLI : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
  forward TOUS les events par défaut, donc en dev local pur (sans Dashboard
  config) ça fonctionne si tu as le CLI lancé. Mais le Dashboard endpoint
  doit être à jour pour les environnements Staging / Production Railway où
  le CLI n'est pas en cours.

- **TODO Tom — Dashboard Stripe LIVE + vérif domaine Apple Pay avant
  passage en mode live** :
  1. Refaire l'activation des wallets (Cards/Apple Pay/Google Pay/Link)
     en mode live sur le Dashboard.
  2. Refaire la config endpoint webhook avec les 7 events ci-dessus
     en mode live.
  3. Vérifier le domaine `vizly.fr` pour Apple Pay : Stripe demande
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

---

## Phase 3 — webhooks migrés et idempotents

### Vérifications dahlia (faites en bloc avant de coder)

| # | Vérif | Verdict | Path utilisé |
|---|---|---|---|
| 1 | `subscription.current_period_*` | ❌ Brief faux (anticipé par Tom) | `subscription.items.data[0].current_period_start/end` (item-level depuis dahlia) |
| 2 | `invoice.subscription` (top-level) | ❌ Brief faux (anticipé par Tom) | `invoice.parent?.subscription_details?.subscription` |
| 3 | `Invoice.status_transitions.paid_at` | ✅ Brief correct | `invoice.status_transitions.paid_at` |
| 4 | `Invoice.BillingReason` enum | ✅ Brief correct | `'subscription_create' \| 'subscription_cycle' \| 'subscription_update'` confirmés |

Les 2 divergences anticipées par Tom ont été appliquées avec commentaires
inline dans `webhook-helpers.ts` et `route.ts`. Pas de stop intermédiaire,
conformément à la consigne ("micro-ajustements évidents → applique
directement").

> ### ⚠️ Post-mortem Phase 4 — correction de cette analyse
>
> **L'analyse Phase 3 ci-dessus sur `confirmation_secret` est partiellement
> fausse.** Mon raisonnement de l'époque était : *« le type TS déclare
> `confirmation_secret?: Invoice.ConfirmationSecret | null` comme un champ
> inline non-expandable, donc `expand: ['latest_invoice']` suffit »*. Le
> runtime sur `2026-03-25.dahlia` a démenti cette conclusion : sans expand
> explicite `['latest_invoice.confirmation_secret']`, le champ est
> **absent** du payload retourné par `stripe.subscriptions.create`, pas
> `null`. Le type TS `?: ... | null` englobe les **3 états runtime**
> `{ absent, present-null, present-populated }` et ne permet pas de
> distinguer (1) de (2)/(3). Voir la règle "Stripe types-vs-runtime" en
> tête de ce fichier.
>
> **Fix appliqué en Phase 4** : `src/lib/stripe/elements.ts` ligne 166,
> `expand: ['latest_invoice']` → `expand: ['latest_invoice.confirmation_secret']`.
> Preuve runtime dumpée pendant le debug (voir commit de fix Phase 4).
> L'extraction `invoice.confirmation_secret?.client_secret` reste valide
> une fois l'expand explicite en place — c'est bien le chemin canonique
> sur dahlia, mais pas le chemin *inline*.

### Décision Q1 — single source of truth pour `payment-succeeded` (validée par Tom)

Le brief littéral créait un **double email** sur l'ancien flow Checkout
hosted (les deux handlers `handleCheckoutCompleted` mode=subscription ET
`handleInvoicePaid` `billing_reason='subscription_create'` envoyaient
tous les deux `payment-succeeded`). Verdict Tom : **option (a)**.
Implémenté :

- L'envoi de `sendPaymentSucceededEmail` est **retiré** de la branche
  `mode='subscription'` de `handleSubscriptionCheckout` (sub-helper de
  `handleCheckoutCompleted`). Commentaire explicite laissé en place.
- `handleInvoicePaid` devient le notifier canonique pour les deux flows
  (legacy Checkout + nouveau Elements), via `billing_reason='subscription_create'`.
- La signature de `sendPaymentSucceededEmail` a été refactorée pour
  prendre une `Stripe.Invoice` directement (au lieu d'une
  `Stripe.Checkout.Session` dont on extrayait l'invoice). Plus de
  round-trip `stripe.invoices.retrieve` côté email — l'invoice est lue
  directement depuis l'event.

### Décision Q3 — `UNKNOWN PRICE_ID` (validée par Tom)

Centralisé dans `resolvePlanOrLogUnknown(priceId, context)` dans
`webhook-helpers.ts`. Comportement :

- `console.error` (pas warn) avec message structuré
  `[stripe webhook] UNKNOWN PRICE_ID: ${priceId} — skipping local sync. Event: ${eventId}, Subscription: ${subscriptionId}. ...`
- Return `null` — le caller bail proprement (pas de throw, pas de 500),
  l'event est consommé légitimement et la DB locale n'est juste pas
  synchronisée pour cette price.
- Utilisé par les 3 handlers concernés (`handleSubscriptionCreated`,
  `handleSubscriptionUpdated` indirectement via `mapStripeSubscriptionToRow`,
  `handleSubscriptionCheckout` legacy).

**TODO post-chantier** : configurer une alerte Sentry/Logtail sur le
préfixe `[stripe webhook] UNKNOWN PRICE_ID` pour détecter en prod les
priceIds manquants de `prices.ts` (legacy ou créés manuellement dans
le Dashboard Stripe).

### Résolution forcée — `onConflict='user_id'` au lieu du brief

Le brief Phase 3 dit `onConflict: 'stripe_subscription_id'` pour les
upserts dans la table `subscriptions`. **Incompatible** avec le schéma
verrouillé en Phase 1 :

```sql
user_id uuid not null unique references public.users(id) on delete cascade,
stripe_subscription_id text not null unique,
```

**Le scénario qui plante** : user A a un sub_old en local
(status='canceled' après cancellation, conservé pour traçabilité comme
demandé par le brief section 4). User A re-souscrit → nouveau sub_new.
`handleSubscriptionCreated` tente d'insérer (user_id=A,
stripe_subscription_id=sub_new). `onConflict='stripe_subscription_id'`
ne se déclenche PAS (sub_old ≠ sub_new), donc INSERT — qui plante sur
`UNIQUE(user_id)` parce que user_id=A existe déjà.

**Résolution** : `onConflict='user_id'` partout (dans
`handleSubscriptionCreated`, `handleSubscriptionUpdated`,
`handleSubscriptionCheckout` legacy, `handleInvoicePaid` re-sync).
Sémantique :

- Une row par user maximum (cohérent avec l'invariant Phase 1)
- La row reflète l'état du sub courant (active OU canceled)
- Re-souscription après cancellation = REPLACE complet de la row (le
  sub_id change, status redevient 'active', etc.)
- Trade-off : pas d'historique des subs précédents dans la table locale.
  Stripe Dashboard reste la source de vérité pour l'historique complet.

Documenté en commentaire dans `webhook-helpers.ts` (header) et dans le
header de chaque handler concerné.

### Idempotence (dette #3)

Implémentée au tout début de la POST entry, juste après `constructEvent` :

```ts
const { error: insertError } = await supabase.from('webhook_events').insert({
  stripe_event_id: event.id,
  event_type: event.type,
  payload: event as unknown as Json,
})
if (insertError) {
  if (insertError.code === '23505') {
    // Already processed → 200 immediate, no handler invoked
    return NextResponse.json({ received: true, skipped: true }, { status: 200 })
  }
  return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
}
```

Postgres `23505` = `unique_violation`, code stable. Le payload jsonb
complet est stocké pour debug post-mortem. Ce single insert est l'unique
point d'idempotence — aucun handler métier n'est appelé en cas de retry.

### Durcissement handler (dette #9)

L'ancien dispatch retournait toujours 200 (catch swallow). Restructuré
avec un try/catch global qui retourne 500 sur erreur handler :

```ts
try {
  switch (event.type) { /* 7 handlers */ }
  return NextResponse.json({ received: true }, { status: 200 })
} catch (err) {
  console.error(`[stripe webhook] Handler failed for ${event.type} (${event.id}):`, err)
  return NextResponse.json({ error: 'Handler failed', eventId, eventType }, { status: 500 })
}
```

Tous les handlers throw `Error` sur état invalide ou DB write fail. Les
appels `sendXxxEmail` à l'intérieur restent best-effort (les helpers
email loggent et ne re-throw pas). Le throw remonte au catch global → 500
→ Stripe retry avec backoff jusqu'à ~3 jours.

### Fix dette #18 — fallback `detectSubscriptionChange`

Quand Stripe envoie un `previous_attributes` partiel sans `items`, le
dispatcher tombait en `no-op` et perdait l'event. Fix :

- Lecture de la row locale `subscriptions` AVANT l'upsert dans
  `handleSubscriptionUpdated` → capture le snapshot OLD (plan + interval)
- Passage de `localSubscriptionBefore` à `detectSubscriptionChange`
- Si `previous_attributes.items` est undefined ou non résolvable, fallback
  sur `localSubscriptionBefore` (uniquement valide si la row locale avait
  un plan payant — un fallback 'free' indiquerait une transition free→paid
  qui doit passer par `handleInvoicePaid`)

### Pas de nouveau template email (dette #4 partielle)

Comme convenu : **aucun nouveau template email créé** en Phase 3. Le
template `renewal-reminder` existant n'est pas touché. Pour les
renouvellements (`billing_reason='subscription_cycle'`), `handleInvoicePaid`
synchronise la table `invoices` mais n'envoie aucun email Vizly — Stripe
envoie automatiquement son receipt natif au customer, ce qui couvre le
besoin user-facing.

**Dette #4 statut** : *partiellement résolue*. La table `invoices` est
sync (l'historique est désormais en DB), mais l'email custom de
renouvellement est reporté hors chantier Stripe. À traiter dans une
session emails dédiée si on veut un email de renouvellement Vizly en
plus du receipt Stripe natif.

### Hors périmètre détecté en cours de route (Phase 3)

- **Refactor signature `sendPaymentSucceededEmail`** : techniquement une
  modif d'un fichier email-handlers.ts. C'était nécessaire pour Q1
  (single source of truth). N'a touché à AUCUN template email, juste
  à la signature/body de la fonction qui les déclenche. La règle "pas
  de nouveau template" est respectée stricto sensu.

- **`updateUserPlanFromSubscription` désormais throw** au lieu de
  log+return : petit changement de comportement local pour s'aligner
  avec la rule "errors → 500". Bénéfique : si l'update users.plan rate,
  on retry au lieu de drift silencieusement.

### Vérification post-Phase 3 — `detectSubscriptionChange` au renouvellement

Tom a légitimement demandé : au renouvellement mensuel, Stripe fire
`customer.subscription.updated` (avec `current_period_*` qui changent) ET
`invoice.paid`, dans un ordre non garanti. Est-ce que le detector peut
confondre un renouvellement avec un "billing-period-changed" et déclencher
un email spurieux à chaque cycle ?

**Verdict : (a) pas de bug, le detector est sûr par construction.**

Le detector compare `plan` et `interval` dérivés du **priceId** de l'item,
PAS les `current_period_*` timestamps. À un renouvellement, `items` ne
change pas (même priceId, même plan), donc :

- `previous_attributes.items` est `undefined` (Stripe n'envoie que les
  champs qui ont changé, et `items` est inchangé)
- Le primary path `prevMapping` reste null
- Le fallback dette #18 lit `localSubscriptionBefore = { plan: 'starter',
  interval: 'monthly' }` (la row locale capturée AVANT l'upsert dans
  `handleSubscriptionUpdated`)
- `prevMapping = { plan: 'starter', interval: 'monthly' }`
- `newMapping = { plan: 'starter', interval: 'monthly' }` (même priceId)
- `prevMapping.plan === newMapping.plan` → pas plan-changed
- `prevMapping.interval === newMapping.interval` → pas billing-period-changed
- Tombe à `return { kind: 'no-op' }` ✓

Les deux branches de cancel detection ne se déclenchent pas non plus :
`cancelled-scheduled` requiert `cancel_at_period_end` qui ne change pas
au renouvellement, et `cancelled-immediate` requiert
`subscription.status === 'canceled'` qui est faux au renouvellement.

**Le seul cas où `billing-period-changed` se déclenche** : un user passe
explicitement `STRIPE_PRICE_STARTER` (mensuel) → `STRIPE_PRICE_STARTER_YEARLY`
(annuel) ou inverse. Là, `newPriceId !== anciennePriceId`, le mapping
change `interval`, et la branche email s'exécute. Comportement attendu.

Pas de fix nécessaire. Le design "comparer le priceId, pas les timestamps"
est exactement ce qui protège contre ce piège.

### Fichiers touchés en Phase 3

- `src/lib/stripe/webhook-helpers.ts` (créé) — `mapStripeSubscriptionToRow`,
  `resolvePlanOrLogUnknown`, `resolveUserIdForSubscription`
- `src/app/api/webhooks/stripe/route.ts` (réécrit en grande partie) —
  idempotence, dispatch durci, 3 nouveaux handlers, 3 handlers modifiés,
  signature uniformisée `(event, supabase)` partout
- `src/app/api/webhooks/stripe/email-handlers.ts` (modifié) —
  `sendPaymentSucceededEmail` refactoré pour prendre une `Invoice` au
  lieu d'une `Checkout.Session` ; suppression de l'import `stripe`
  (plus besoin de retrieve l'invoice)
- `STRIPE_MIGRATION_NOTES.md` (modifié — ce fichier, section Phase 3
  + absorption des modifs Phase 2 uncommitted : justification pin Next.js)

### Code legacy toujours intact

Toutes les fonctions / actions Lib + Server Action de l'ancien flow
Checkout sont **inchangées en signature et en effet utilisateur** :

- `createSubscriptionCheckout` ✅
- `createTemplateCheckout` ✅
- `createSubscriptionCheckoutAction` ✅
- `createTemplateCheckoutAction` ✅
- `createBillingPortalSession`, `updateExistingSubscription` ✅

Le **handler webhook** `handleCheckoutCompleted` mode=subscription a
été modifié (suppression de l'envoi d'email, ajout de l'upsert local
`subscriptions`) mais sa fonction métier reste la même : un user qui
paie via le legacy Checkout reçoit toujours son email
`payment-succeeded` (envoyé désormais depuis `handleInvoicePaid`) et
son plan est toujours mis à jour côté DB.

---

## Phase 4 — modal subscription Elements

### Fix Phase 2 découvert en Phase 4

Le defensive check de `createSubscriptionIntentAction` bloquait sur toute
row `subscriptions` locale, peu importe son `status`. Cela cassait le
flow d'application d'un code promo (qui nécessite de recréer la sub),
et aussi le re-try après abandon de modal.

**Fix appliqué** : restreindre le check aux statuses réellement bloquants
(`active`, `trialing`, `past_due`, `unpaid`), exclure `incomplete`,
`incomplete_expired`, `canceled`. Aligne le comportement avec la
sémantique Stripe : une sub `incomplete` est un checkout en cours, pas
un engagement.

5 lignes de modif dans `src/actions/billing.ts`, périmètre Phase 4 parce
que le bug n'était détectable qu'en construisant un consommateur (la
modal). Verdict Q3 de Phase 2 retracé en commentaire inline. Le check
`hasLegacySub` est aussi raffiné : il ne se déclenche QUE si la table
locale n'a aucune row pour cet user (sinon la table locale a priorité,
peu importe son status). Naturellement compatible avec la suppression
prévue du legacy column en Phase 6.

### Décisions architecture (validées par Tom)

- **Q1 Stripe appearance — hardcode + commentaire de sync** : les
  couleurs Vizly sont copiées en HEX direct dans
  `src/components/billing/stripeAppearance.ts` avec un header
  `// keep in sync with src/app/globals.css` daté. Raison : Tailwind 4
  `@theme` (Vizly) stocke les couleurs en hex, pas en HSL séparé, donc
  le pattern `hsl(var(--accent))` shadcn ne s'applique pas. Le
  PaymentElement vit dans un iframe Stripe et ne peut pas lire les
  variables CSS du parent.

- **Q2 Pas de `<Input>` partagé** : le projet n'a pas de
  `src/components/ui/input.tsx`. Le champ code promo utilise un
  `<input>` HTML brut wrappé dans le pattern de `StepPublish.tsx`
  (`flex items-center rounded-[var(--radius-md)] border border-border
  ... focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15`).
  Si Phase 5 (`TemplatePurchaseModal`) en a besoin, on extraiera à ce
  moment-là.

- **Q3 Focus management — option (b) légère** : focus initial sur le
  bouton X au mount (après ~100 ms pour ne pas fighter avec l'animation),
  Escape qui ferme, clic backdrop qui ferme, focus rendu à l'élément
  ayant déclenché l'ouverture au unmount. **Pas** de wrap-around Tab
  full focus-trap (refusé : nouvelle dépendance). Suffisant pour la
  plupart des cas modal légers.

### Fermeture pendant `processing` — verrou strict

Pendant `state.kind === 'processing'`, **toutes** les voies de fermeture
sont désactivées par construction :

- Bouton X : `disabled` + `opacity-40 pointer-events-none`
- Touche `Escape` : ignorée (le keydown handler check `isProcessing`)
- Clic sur le backdrop : ignoré (le handler check `isProcessing`)

Raison : si l'user ferme pendant que `stripe.confirmPayment` est en vol,
le payment peut aboutir côté Stripe sans que l'UI ait pu afficher le
success → état désynchronisé entre serveur (sub active) et UI (modal
disparue, user perplexe). Forcer l'attente des 2-3 secondes de traitement
évite ce piège.

### Abandons de checkout — accepté pour le lancement

La fermeture de la modal en état `ready` (avant payment) ne cancel PAS
la subscription `incomplete` créée au mount côté Stripe. Conséquence :
des subs `incomplete` peuvent s'accumuler dans le Stripe Dashboard.

**Pourquoi c'est OK** :
1. Stripe garbage-collect les `incomplete` après 24 h (passent en
   `incomplete_expired`).
2. Le defensive check de `createSubscriptionIntentAction` exclut
   maintenant `incomplete` et `incomplete_expired`, donc l'user peut
   réouvrir la modal et créer un nouveau sub sans être bloqué.
3. Le webhook `customer.subscription.deleted` ne fire pas pour ces
   subs expirées (Stripe garbage collection silencieuse), donc pas de
   pollution `webhook_events`.

**TODO post-chantier** : si en prod le taux d'abandon génère trop de
bruit dans le Dashboard Stripe (visibilité opérateur), on pourra
appeler `stripe.subscriptions.cancel(subId)` côté client au `onClose`
quand `state.kind === 'ready'`. Optimisation, pas urgent.

### Animation et accessibilité

- **Animation** : `framer-motion` avec `EASE_OUT_EXPO = [0.16, 1, 0.3, 1]`
  et durée 0.5 s pour le panel modal, durée 0.25 s pour le backdrop.
  Cohérent avec `src/components/shared/ScrollReveal.tsx`. `useReducedMotion`
  désactive les animations pour les users avec `prefers-reduced-motion`.
- **Accessibilité** :
  - `role="dialog"` + `aria-modal="true"` sur le panel
  - `aria-labelledby` (id du H2) + `aria-describedby` (id du sub)
    via `useId()` React 18+
  - `document.body.style.overflow = 'hidden'` au mount, restauré au
    unmount (avec capture de la valeur précédente)
  - Focus initial sur le bouton X au mount, focus rendu à l'élément
    précédent au unmount (via `previousFocusRef`)
  - Escape pour fermer (sauf si processing)
  - `aria-busy="true"` sur le skeleton du PaymentElement
  - `role="alert"` sur les blocs d'erreur

### Voix éditoriale Vizly — vérifications

Tous les textes de la modal respectent :
- Tutoiement systématique
- Point final aux titres courts ("Passer en Starter.", "Paiement confirmé.")
- Mot accentué en terracotta dans le titre
- Pas de "désolé", "malheureusement", "oups"
- Pas d'emoji, pas de caractères Unicode décoratifs
- Action claire à la fin des messages d'erreur ("Réessaie", "Essaie une
  autre carte")

### Anti-patterns DA — vérification stricte

Aucun des 8 antipatterns du brief Phase 4 n'est présent dans les fichiers
créés (`SubscriptionCheckoutModal.tsx`, `stripeAppearance.ts`,
`CheckoutErrorMessage.ts`) :

1. ✅ Pas de `shadow-[0_2px_8px_rgba(...)]` ou shadow custom
2. ✅ Pas d'`active:scale-[0.98]` ni animation de scale
3. ✅ Pas de `bg-green-50/80`, `bg-amber-100`, `bg-red-100` ou couleurs
   hors système
4. ✅ Pas de `rounded-full` sur badges (le tag code promo utilise
   `rounded-[var(--radius-sm)]`)
5. ✅ Pas de `bg-accent/[0.03]` ou transparences fantaisistes (j'utilise
   `bg-accent-light` qui est une variable du système)
6. ✅ Pas d'emoji
7. ✅ Pas de centrage horizontal — tout aligné à gauche
8. ✅ Pas de "⚠️" ni "✓" en Unicode décoratif — le `Check` du success
   utilise `lucide-react`

### Fichiers touchés en Phase 4

- `src/components/billing/CheckoutErrorMessage.ts` (créé) — constantes
  + `getErrorMessage(code, fallback)`
- `src/components/billing/stripeAppearance.ts` (créé) — `vizlyAppearance`
  hardcodé avec commentaire de sync vers `globals.css`
- `src/components/billing/SubscriptionCheckoutModal.tsx` (créé) —
  ~600 lignes, composant principal + sous-composants inline
  (`CheckoutHeader`, `Recap`, `PromoCodeField`, `PaymentSkeleton`,
  `ErrorBlock`, `CheckoutForm`, `SuccessHeader`, `SuccessBody`)
- `src/actions/billing.ts` (modifié) — fix du defensive check dans
  `createSubscriptionIntentAction` (5 lignes effectives + commentaire
  bloc)
- `STRIPE_MIGRATION_NOTES.md` (modifié — section Phase 4)

### Composant non câblé — confirmation

`SubscriptionCheckoutModal` est créée comme composant réutilisable
exporté mais **n'est importée nulle part** dans le code existant. Le
branchement aux 3 points d'entrée (`/billing` → `BillingClient.tsx`,
`/tarifs` → `TarifsClient.tsx`, `/editor` → `useEditorState.handlePublish`)
sera fait en Phase 6.

### Post-mortem — bugs découverts lors du test visuel (fixes follow-up)

Deux bugs découverts successivement lors du test visuel de la modal
en isolation (`/dev-modal-test`). Tous deux absorbés dans un seul
commit follow-up :
`fix(stripe): phase 4 - expand confirmation_secret + dynamic payment methods`.

Le commit Phase 4 principal `0ec9249` reste historiquement cohérent
(modal créée telle quelle à partir du brief), et le follow-up fix
marque explicitement le moment où les 2 bugs runtime ont été
découverts et corrigés.

#### Premier fix — `confirmation_secret` absent par défaut sur dahlia

Bug : la modal échouait au fetch de l'intent avec
`Stripe subscription created but no confirmation_secret returned`.

**Cause racine** : expand incomplet (`['latest_invoice']` au lieu de
`['latest_invoice.confirmation_secret']`). **Preuve runtime** via dump
JSON d'un vrai `subscriptions.create` test mode : `confirmation_secret: undefined`
sans expand, `{ client_secret: "pi_..." }` avec expand. **Fix** : 1
fragment de chaîne dans `elements.ts` ligne 166. **Temps de debug** :
~15 min grâce à l'instrumentation structurée (types TS + SDK Stripe
direct + dump runtime) plutôt qu'un debug à l'aveugle.

**Leçon** : règle "types-vs-runtime" ajoutée en haut des notes pour le
reste du chantier (voir section `Règles méthodo du chantier`).

#### Second fix — `payment_method_types: ['card']` restreignait les méthodes affichées

Après correction de l'expand `confirmation_secret`, le test visuel a
révélé un second bug : le PaymentElement affichait seulement le
formulaire carte (numéro / expiration / CVC / pays) sans la tab Link
ni les wallets.

**Cause racine** : `payment_method_types: ['card']` dans
`payment_settings` de la subscription, hérité du brief Phase 0. Cette
ligne forçait Stripe à n'exposer QUE la méthode `card` sur le
PaymentElement. Le pattern moderne Stripe documenté est **Dynamic
Payment Methods** : ne PAS spécifier `payment_method_types` et laisser
Stripe détecter automatiquement via les méthodes activées dans le
Dashboard compte + les capabilities du browser.

**Preuve** : le type TS `PaymentSettings.payment_method_types?:` est
optionnel ET son commentaire inline dit explicitement *"If not set,
Stripe attempts to automatically determine the types to use..."*. La
bonne pratique est documentée dans le type lui-même.

**Fix** : retrait de la ligne `payment_method_types: ['card']` dans
`createSubscriptionWithPaymentIntent`. Commentaire bloc laissé en place
pour expliquer pourquoi l'omission est intentionnelle et pointer vers
la leçon retenue.

**Même principe à appliquer en Phase 5** pour
`createTemplatePaymentIntent` si la même config existe. À vérifier au
démarrage de Phase 5 par grep rapide sur `payment_method_types`.

**Note Apple Pay dans Chrome desktop** : Apple Pay ne s'affichera
**jamais** dans Chrome, quelle que soit la config Stripe — c'est une
limitation browser native (Apple Pay API est uniquement disponible
dans Safari). Pour valider Apple Pay en test, Tom devra tester dans
Safari desktop ou iOS Safari séparément. Ce n'est PAS un bug de la
config Stripe ni du code Vizly.

#### Absorption `.env.example` dans le même commit

Le commit de fix Phase 4 absorbe aussi la mise à jour uncommitted de
`.env.example` (ajout du commentaire bloc expliquant que
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` est REQUIS et pourquoi le préfixe
`NEXT_PUBLIC_` est obligatoire pour l'inlining côté client). Cette
modif avait été faite pendant le debug de l'erreur
`STRIPE_PUBLIC_KEY` mal nommée dans le `.env` de Tom. Elle trainait en
working tree, elle part dans ce commit puisque c'est la même session
de debug Phase 4.

#### Troisième fix — abandon du `layout: 'accordion'` pour le pattern ExpressCheckoutElement

Après l'activation de Dynamic Payment Methods (second fix), le test
visuel a révélé un problème de rendu : avec seulement 2 méthodes
résolues côté PaymentIntent (`card` + `link`), Stripe rendait soit
des **tabs compacts asymétriques** (Card en icône seule, Google Pay
avec label texte) soit un **accordion** avec 1-2 items qui paraissait
bancal et déséquilibré. Aucune combinaison de `layout` / `radios` /
`spacedAccordionItems` ne donnait un rendu propre.

**Décision** : abandonner le sélecteur accordion / tabs pour adopter
le pattern **ExpressCheckoutElement + séparateur + PaymentElement
Card-only**, qui est celui utilisé par Linear, Resend, Vercel, Framer
et les SaaS de référence du brief Vizly. Structure finale de la
modal :

```
┌─────────────────────────────────┐
│ Moyen de paiement               │
│                                 │
│ [  G Pay  ]   ← ExpressCheckoutElement
│ [   Link  ]      (wallets en boutons natifs, overflow: 'never')
│                                 │
│ ──── ou par carte ────          │   ← séparateur conditionnel
│                                 │
│ Numéro de carte                 │   ← PaymentElement Card-only
│ [                          ]    │      (wallets: { …all 'never' })
│ Date   CVC                      │
│ [  ]   [  ]                     │
│ Pays                            │
│ [ France      ▼]                │
│                                 │
│ [ Payer 4,99 €  ]               │
│                                 │
│ Paiement sécurisé par Stripe... │
└─────────────────────────────────┘
```

**Détails d'implémentation** :

- `<ExpressCheckoutElement>` est toujours monté (pas dans un
  `{hasExpressPayments && (...)}`) pour que son event `onReady` fire
  dans tous les cas. Sans méthodes dispo, Stripe rend l'iframe vide
  (zéro hauteur visible), donc zéro bruit. Avec méthodes dispo, les
  boutons apparaissent et `setHasExpressPayments(true)` déclenche
  l'affichage conditionnel du séparateur "ou par carte".
- Options ECE : `buttonType: { applePay: 'plain', googlePay: 'plain' }`
  (logos seuls sans texte — mantra Vizly "moins > plus"),
  `buttonTheme: { applePay: 'black', googlePay: 'black' }` (Apple Pay
  noir natif, Google Pay noir pour cohérence),
  `buttonHeight: 48` (cohérent avec hauteur boutons CTA Vizly),
  `layout: { overflow: 'never' }` (pas de bouton "Afficher plus" qui
  masquerait Link derrière un clic supplémentaire — preuve type :
  `LayoutOption.overflow?: 'auto' | 'never'` ligne 252 de
  `express-checkout.d.ts`).
- Options PaymentElement : `layout: 'tabs'` (retour au compact, mais
  avec seulement Card dispo l'UI dégrade gracieusement en formulaire
  direct sans tab strip), `wallets: { applePay: 'never', googlePay: 'never', link: 'never' }`
  (désactivation complète des wallets pour éviter la double-display
  avec l'ECE — Link en particulier affichait une barre "Paiement
  sécurisé et rapide avec Link" qui dupliquait le bouton Link
  express). Preuve type : `PaymentWalletsOption.link?: 'auto' | 'never'`
  ligne 220 de `payment.d.ts`.
- Handler `handleExpressConfirm` dédié aux wallets, avec appel
  critique à `event.paymentFailed({ reason, message })` AVANT la
  transition d'état React pour fermer proprement la sheet native
  (pattern Stripe documenté dans `StripeExpressCheckoutElementConfirmEvent`).
- Factorisation `confirmAndHandleResult(onBeforeError?: (error) => void)`
  : core partagé entre `handleSubmit` (Card) et `handleExpressConfirm`
  (wallets). Le callback `onBeforeError` est appelé d'abord côté
  wallet pour dismiss la sheet, puis la logique d'erreur standard
  s'applique pareil dans les deux flows.

#### Quatrième fix — classification erreurs validation vs erreurs serveur

Après le test visuel du flow Card, un gros problème UX découvert :
taper un numéro de carte incomplet → clic "Payer" → la modal passait
en état `error` global, démontait le formulaire, affichait "Votre
numéro de carte est incomplet" avec bouton "Réessayer", et le clic
Réessayer recréait une subscription côté Stripe et rechargeait tout.
L'user perdait son saisissage à chaque typo.

**Cause racine** : `stripe.confirmPayment` retourne des erreurs de
deux catégories sémantiques très différentes (documenté dans
`StripeErrorType` ligne 1464-1501 de `stripe.d.ts`) :

- **Type 1 — `'validation_error'`** : "Errors triggered by our
  client-side libraries when failing to validate fields (e.g., when
  a card number or expiration date is invalid or incomplete)". Ces
  erreurs sont déjà affichées inline sous le champ concerné par le
  PaymentElement natif — il NE faut PAS les escalader.
- **Type 2 — `'card_error'` / `'api_error'` / `'authentication_error'`
  / etc.** : vraies erreurs serveur ou carte (card_declined,
  insufficient_funds, processing_error...). Celles-ci nécessitent
  un écran d'erreur global avec retry.

**Fix** : nouveau helper `isValidationError(error: StripeError): boolean`
dans `CheckoutErrorMessage.ts` qui retourne `true` si
`error.type === 'validation_error'` OU si `error.code` est dans un
set `VALIDATION_ERROR_CODES` (9 codes explicites pour defense-in-depth :
`incomplete_number`, `incomplete_cvc`, `incomplete_expiry`, etc.).

Nouveau state transition `handleValidationError` dans le parent modal,
qui fait un functional setState `processing → ready` en préservant
`clientSecret` + `subscriptionId` du state courant sans touche au
PaymentElement. La classification se fait dans
`confirmAndHandleResult` : si validation → `onValidationError()`
(form intact, bouton Payer re-cliquable), sinon → `onSubmitError()`
(écran d'erreur global). Le callback `onBeforeError` (dismiss wallet
sheet) est toujours appelé en premier, donc les wallets avec erreur
de validation (rare) ferment leur sheet ET retournent au state ready.

#### Cinquième fix — bouton "Payer" grisé tant que le formulaire Card n'est pas complet

Pour éviter même d'arriver à l'étape de validation error, le bouton
"Payer X,XX €" est désormais **disabled tant que le PaymentElement
n'a pas signalé `complete: true`** via son event `onChange`. Nouveau
state local `isCardComplete` dans `CheckoutForm`, initialisé à `false`
(form vide au mount), set via `<PaymentElement onChange={(event) => setIsCardComplete(event.complete)} />`.
Preuve type : `StripePaymentElementChangeEvent.complete: boolean`
(ligne 304 de `payment.d.ts`, doc inline : *"true if the every input
in the Payment Element is well-formed and potentially complete"*).

Le bouton "Payer" étend ses conditions disabled à
`!stripe || !elements || isProcessing || !isCardComplete`, et les
classes visuelles reflètent le même : `bg-accent/50 cursor-not-allowed`
quand disabled, `bg-accent hover:bg-accent-hover` quand cliquable.

Le flow wallets (ECE) n'est **pas affecté** par ce disabled — cliquer
sur Google Pay continue à marcher même si le form Card est vide (cas
courant : l'user choisit direct le wallet sans toucher au form Card).

### Test visuel wallets en local — HTTPS obligatoire

Apple Pay et Google Pay nécessitent un **contexte secure (HTTPS)**
pour apparaître dans le PaymentElement / ExpressCheckoutElement, même
en localhost. Sans HTTPS, les browser APIs sous-jacentes (Apple Pay JS
pour Safari, PaymentRequest API pour Chrome Google Pay) sont refusées
par le navigateur, peu importe la config Stripe.

**Commande de test local HTTPS** : `npx next dev --experimental-https`
(Next.js 13.5+ génère un cert auto-signé local dans
`certificates/localhost.pem` qui est réutilisé entre les sessions).
Au premier load, Chrome affiche un avertissement sur le cert non
reconnu — cliquer "Avancé → Continuer vers localhost" pour l'accepter
pendant la session de test.

**Validation en local HTTPS (Chrome)** :

- **Google Pay** : apparaît dans l'ExpressCheckoutElement si le compte
  Chrome de test a au moins une carte enregistrée dans Google Pay.
  Validé visuellement en Phase 4.
- **Link** : apparaît systématiquement dans l'ExpressCheckoutElement
  (on l'a désactivé dans le PaymentElement pour éviter la duplication).
  Validé visuellement en Phase 4.
- **Apple Pay** : reste **invisible** même en HTTPS localhost dans
  Safari. Cause probable : cert auto-signé Next.js non accepté par
  Apple Pay JS, ou domaine localhost non dispensé de vérification de
  domaine contrairement à ce que la doc Stripe laisse entendre. La
  validation Apple Pay est reportée à l'**environnement Railway staging**
  (vrai cert TLS auto-géré par Railway) puis à la **production**
  (`vizly.fr` avec upload du fichier
  `apple-developer-merchantid-domain-association` sous `/.well-known/`
  avant le passage live — voir TODO section "Dashboard Stripe LIVE").

**En production** : Apple Pay + Google Pay + Card + Link doivent tous
apparaître automatiquement via Stripe Dynamic Payment Methods. Aucun
code supplémentaire requis, la config finale de la modal est complète.

### Leçon méthodo — `rm -rf .next` pendant un dev server qui tourne

Pendant le debug du bug `confirmation_secret` + wallets, j'ai fait à
tort `rm -rf .next && npm run build` **pendant que le dev server
HTTPS tournait en background**. Résultat : le dev server gardait en
mémoire des chunks compilés qui n'existaient plus sur disque, donc
les prochaines requêtes ont retourné des 404 sur `app-pages-internals.js`,
`page.js`, `layout.js`, `layout.css`, etc. Tom a vu la page `/dev-modal-test`
en HTML brut sans CSS, avec la console pleine d'erreurs 404.

**Leçon** : la règle méthodo "rm -rf .next && npm run build" est
réservée au **diagnostic d'un build cassé**, PAS à la validation
post-edit. Pendant un dev server actif, faire juste `npm run build`
dans un autre terminal (ou ne rien faire et laisser HMR gérer). Ou
stopper le dev server avant le clean. Je l'ajoute à la section
"Règles méthodo du chantier" en tête de fichier pour que ce soit
explicite dans les phases suivantes.

---

## Phase 5 — modal template purchase

### Décision architecturale — duplication contrôlée (validée par Tom)

`TemplatePurchaseModal.tsx` est créée par **duplication contrôlée** de
`SubscriptionCheckoutModal.tsx`, pas par extraction d'un `CheckoutShell`
générique partagé. Verdict Tom + argumentaire YAGNI :

- Les briques vraiment partagées (codes d'erreur, appearance Stripe,
  `getStripe()` singleton, helper `formatEur`) sont **déjà partagées
  via imports** — on n'a pas besoin d'un shell générique pour ça.
- Les deux modals diffèrent sur ~15-20 % de leur surface (state machine
  shape, Server Action appelée, textes, récap, absence de promo code
  côté template). Un shell générique aurait nécessité un système de
  props de configuration complexe avec TypeScript generics, ~400 lignes
  de plumbing abstrait peu lisible.
- **Coût accepté** : ~350 lignes de duplication entre les 2 fichiers.
  Contrepartie : lisibilité, indépendance d'évolution, zéro risque
  d'abstraction fragile qui se révèlerait problématique en Phase 6/7.
- **Si un besoin d'extraction émerge** lors de la réécriture de
  `/billing` en Phase 7 (où les 2 modals sont utilisées côte à côte),
  on fera l'extraction à ce moment-là avec le contexte complet des
  deux consommateurs.

### Extension de `createTemplateIntentAction` avec un objet `pricing`

Modification Phase 2 effectuée dans le commit Phase 5 (même pattern que
`isValidationError` en Phase 4 — l'extension est justifiée par un besoin
UX Phase 5). La Server Action retourne désormais un objet `pricing`
structuré plutôt qu'un simple `amountCents` top-level :

```ts
// Avant (Phase 2)
type TemplateIntentResult =
  | { ok: true; clientSecret: string; paymentIntentId: string }
  | { ok: false; error: string }

// Après (Phase 5)
type TemplateIntentResult =
  | {
      ok: true
      clientSecret: string
      paymentIntentId: string
      pricing: { amountCents: number; currency: string }
    }
  | { ok: false; error: string }
```

**Pourquoi un objet `pricing` plutôt qu'un `amountCents` top-level** :

- **Future-proof** : si Phase 7 ou un chantier ultérieur a besoin de
  surfacer `subtotalCents`, `discountCents`, `taxCents` (au cas où
  Stripe Tax serait activé un jour pour la franchise base TVA qui
  pourrait évoluer), on a déjà un objet pour les accueillir sans
  changer la signature top-level.
- **Cohérent avec les conventions Stripe** : Stripe retourne toujours
  les montants en cents + currency ensemble, jamais isolés. Un champ
  `amountCents` seul sans `currency` est techniquement ambigu (même
  si on sait que Vizly est 'eur' uniquement aujourd'hui).
- **Explicite à la lecture** : `result.pricing.amountCents` est plus
  lisible dans le code consommateur que `result.amountCents` qui
  pourrait être confondu avec un autre champ amount (par exemple
  `amount_received`, `amount_due`, etc.).

Le helper lib `createTemplatePaymentIntent` retourne maintenant aussi
`pricing: { amountCents, currency }` — valeur dérivée du Stripe Price
live via `stripe.prices.retrieve(priceId)` (source de vérité), pas d'une
constante locale. Si un jour Tom change le prix dans le Dashboard, le
modal affiche le nouveau prix sans redéploiement.

### Pas de code promo pour les templates (validé)

La modal `TemplatePurchaseModal` n'a **pas** de champ code promo,
contrairement à `SubscriptionCheckoutModal`. Raisons :

1. Un template à 2,99 € + promo = réductions en centimes, peu de sens
   métier.
2. Les promos Stripe sont naturellement câblées sur les subscriptions
   (via `discounts: [{ promotion_code }]` natif). Pour les one-shot
   PaymentIntents, on doit calculer manuellement le discount côté
   serveur et passer un `amount` réduit (pattern fragile, documenté
   dans le verdict Q4 Phase 2).
3. Simplification drastique de la modal : pas de `PromoCodeField`,
   pas de recalcul de pricing au runtime, pas de re-fetch d'intent
   au changement de code promo.
4. Si un jour on veut une offre "Pack 4 templates premium -50 %",
   ce sera un nouveau produit Stripe (un price dédié), pas un code
   promo sur un template individuel.

**Note** : le helper lib `createTemplatePaymentIntent` supporte toujours
les paramètres `promotionCode` + `promotionDiscount` (héritage de Phase 2
où on avait prévu le support). La Server Action `createTemplateIntentAction`
les accepte aussi. Mais la modal `TemplatePurchaseModal` ne les utilise
simplement pas. Pas de code mort — le support serveur reste en place au
cas où on veut ré-activer la feature plus tard depuis un autre endroit
(admin script, future pack UI, etc.).

### Gestion du cas `template_already_purchased`

Le flow :

1. Modal mount → `createTemplateIntentAction({ templateId })` appelée
2. Server Action check `purchased_templates` via Supabase → si déjà
   acheté, retourne `{ ok: false, error: 'template_already_purchased' }`
3. Modal reçoit l'erreur → state passe à `{ kind: 'error', message,
   canRetry: false, alreadyOwned: true }`
4. `ErrorBlock` détecte `alreadyOwned && onAlreadyOwned` et rend un
   bouton **"Accéder au template"** au lieu de "Réessayer"
5. Clic → appelle le prop `onAlreadyOwned?.()` (le consommateur
   Phase 6 navigue typiquement vers `/editor?template=${templateId}`)

**Dégradation gracieuse** : si `onAlreadyOwned` n'est pas fourni (cas
d'un consommateur minimaliste qui ne veut pas gérer la redirection),
l'ErrorBlock affiche juste le message sans bouton. Pas de crash, pas
de bouton "Réessayer" qui serait absurde sur une erreur d'idempotence.

Le message exact dans `SERVER_ACTION_ERROR_MESSAGES` (dans
`CheckoutErrorMessage.ts`) a été mis à jour : `'Tu as déjà acheté ce
template.'` → `'Tu as déjà débloqué ce template.'` pour cohérence
lexicale avec le titre de la modal "Débloquer ce template.".

### Skeleton sur la ligne prix pendant `loadingIntent`

La modal affiche un skeleton `bg-surface-warm animate-pulse` sur la
ligne "Total" pendant que `createTemplateIntentAction` fetch le prix
authoritative depuis Stripe. Le reste du récap (label template,
"Paiement unique") s'affiche immédiatement avec la prop `templateLabel`
sans dépendre de la Server Action.

Raison du skeleton plutôt qu'une constante de fallback : la source de
vérité pour le prix est **Stripe Price live** (via le helper lib), pas
`constants.ts`. Afficher une constante en fallback risquerait d'afficher
un prix obsolète si Tom change le prix dans le Dashboard sans mettre
à jour `constants.ts`. Le skeleton accepte un délai de ~500 ms-1 s
pour garantir que le prix affiché est toujours le bon.

### Extraction `formatEur` vers `src/lib/utils.ts`

Helper de formatage EUR (Intl.NumberFormat `fr-FR` currency) extrait de
`SubscriptionCheckoutModal.tsx` vers `src/lib/utils.ts` pour réutilisation
par `TemplatePurchaseModal.tsx`. Petit refacto trivial (< 2 min) fait
dans le même commit Phase 5. Aligné avec la convention existante de
`utils.ts` qui contient déjà `formatDate`, `slugify`, `cn`, `getBaseUrl`.

### Fichiers touchés en Phase 5

- `src/components/billing/TemplatePurchaseModal.tsx` (créé, ~700 lignes —
  structure self-contained, sous-composants inline comme
  `SubscriptionCheckoutModal`)
- `src/actions/billing.ts` (modifié) — `TemplateIntentResult` étendu
  avec `pricing`, `createTemplateIntentAction` pass-through du pricing
  depuis le lib
- `src/lib/stripe/elements.ts` (modifié) — `createTemplatePaymentIntent`
  retourne `pricing: { amountCents, currency }` en plus de ses champs
  existants
- `src/lib/utils.ts` (modifié) — extraction de `formatEur` depuis
  `SubscriptionCheckoutModal.tsx` vers le module utils partagé
- `src/components/billing/SubscriptionCheckoutModal.tsx` (modifié) —
  import de `formatEur` depuis `@/lib/utils` au lieu de la définition
  locale, définition locale supprimée (5 lignes)
- `src/components/billing/CheckoutErrorMessage.ts` (modifié) — message
  de `template_already_purchased` affiné de "acheté" à "débloqué"
- `STRIPE_MIGRATION_NOTES.md` (modifié — section Phase 5)
- `src/app/dev-modal-test/page.tsx` (modifié mais **toujours uncommitted**,
  route scratch) — ajout d'un second bouton pour tester
  `TemplatePurchaseModal` avec un dropdown de sélection du template

### Composant non câblé — confirmation

`TemplatePurchaseModal` est créée comme composant réutilisable exporté
mais **n'est importée dans aucune page de prod** (seulement dans la
route scratch `dev-modal-test/page.tsx` qui reste uncommitted). Le
branchement aux points d'entrée de prod (typiquement depuis la section
"Premium templates" de `/billing` ou depuis une page `/templates/[id]`
marketing) sera fait en Phase 6.

### Infrastructure — serveur Railway, pas Vercel (correction de session)

Tom m'a corrigé pendant Phase 5 : le serveur Vizly tourne sur **Railway**,
pas Vercel (malgré ce que dit le `CLAUDE.md` outdated). Mentions
corrigées dans ce fichier aux lignes Dashboard Stripe endpoint config
(Staging/Production Railway au lieu de Preview Vercel) et validation
Apple Pay (Railway staging au lieu de Vercel Preview). La référence
"Linear, Resend, Vercel, Framer" dans la décision design du pattern
ExpressCheckout reste inchangée — c'est une référence au style de
leurs billing UIs (Vercel en tant que SaaS de référence), pas à
l'infrastructure de déploiement de Vizly.

**TODO post-chantier** : mettre à jour `CLAUDE.md` qui déclare toujours
`**Vercel** — hosting, wildcard *.vizly.fr` dans sa section Stack.
Le vrai hosting est Railway. Hors périmètre Phase 5 (c'est un fix doc
projet global, pas lié à Stripe), mais à faire pour éviter que le
prochain Claude de session hérite de la même mauvaise info.
