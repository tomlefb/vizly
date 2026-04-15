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

---

## Phase 6 — recâblage UI et nettoyage ancien code

### Objectif

Brancher les deux modals Elements (Phase 4 + Phase 5) sur tous les points
d'entrée UI qui utilisaient encore l'ancien redirect `createCheckoutSession`,
puis **supprimer tout le code legacy** (Server Actions, lib helpers,
handler webhook, env vars, route scratch). Plus de coexistence : après
Phase 6, Stripe Checkout hosté n'existe plus côté Vizly.

### Architecture du flow subscription après Phase 6

Il y a désormais **trois points d'entrée** pour s'abonner, qui convergent
tous sur `SubscriptionCheckoutModal` :

1. **`/billing`** (utilisateur loggé, plan courant = free)
   - Clic sur CTA d'un plan → `BillingClient` ouvre la modal directement
     (state `subscriptionModalPlan`).
   - Clic sur un plan quand l'utilisateur est déjà sur un plan payant →
     pas de modal, appel direct `changeSubscriptionPlanAction({ plan, interval })`
     qui fait un `stripe.subscriptions.update` in-place (proration auto).
     Feedback local via `feedback` state.

2. **`/tarifs`** (page marketing, anonyme OU loggé)
   - Anonyme → `router.push('/register?plan=…&interval=…')`.
   - Loggé free → ouvre la modal.
   - Loggé paid → appelle `changeSubscriptionPlanAction` directement
     (même path que `/billing`).
   - Le server component `tarifs/page.tsx` fait un `getUser()` +
     `.select('plan')` sur `users` pour passer `isAuthenticated` et
     `currentPlan` au client component.

3. **`/editor` (Step 4 — Publier)**
   - Clic sur "Publier maintenant" → `StepPublish.handlePublishClick`
     sauvegarde le draft d'abord (`onSaveDraft`), PUIS branche :
     - Si `billingPlan === 'free'` → ouvre la modal `SubscriptionCheckoutModal`
       avec `plan='starter'` + `interval='monthly'`.
     - Sinon → appelle `onPublishNow` directement.
   - À la fermeture de la modal avec succès, `handleModalSuccess` appelle
     `onPublishNow` qui déclenche `publishPortfolio` + redirect vers l'URL
     publique.

4. **`/register?plan=starter&interval=yearly`** (cas spécifique tarifs → anon)
   - `register/page.tsx` lit `useSearchParams()` et construit un
     `dashboardUrl` qui préserve `plan` + `interval` comme query params,
     utilisé dans `window.location.href = dashboardUrl` à la fin du flow
     signup Google.
   - Sur `/dashboard`, `page.tsx` lit `searchParams.plan` / `searchParams.interval`
     et rend conditionnellement `<AutoOpenSubscriptionModal>`.
   - `AutoOpenSubscriptionModal` est un tiny client wrapper avec un
     `hasAutoOpenedRef` guard pour protéger contre le double-mount de
     React StrictMode en dev, et appelle `router.replace('/dashboard')`
     sur `onClose` pour stripper les query params une fois la modal vue.

### Refactor `useEditorState` / `StepPublish` — split `handlePublish`

Avant Phase 6, le hook `useEditorState` exposait un seul `handlePublish()`
qui : (1) sauvait le brouillon, (2) créait un checkout Stripe, (3) faisait
un redirect vers `checkout.stripe.com`. `StepPublish` consommait
ce pipeline atomique via un `onPublish={handlePublish}` et un
`isPublishing` prop.

Avec le move modal in-app, ce pipeline atomique casse : la modal est
un composant React qui vit dans `StepPublish`, donc la branche "paywall"
doit être gérée **dans** `StepPublish`, pas dans le hook. J'ai donc
splitté :

- `useEditorState.saveDraft()` : upsert portfolio + sync projets, pas
  de publication ni de checkout. Retourne `{ error }`.
- `useEditorState.publishNow()` : appelle `publishPortfolio(slug)` qui
  fait `published=true` + redirect vers l'URL publique. Retourne
  `{ error }`.

Côté `StepPublish.tsx`, `handlePublishClick` orchestre :

```
handlePublishClick = async () => {
  const { error } = await onSaveDraft()
  if (error) return setPublishError(error)

  if (billingPlan === 'free') {
    setSubscriptionModalOpen(true)  // modal prend le relais
  } else {
    await onPublishNow()            // publication directe
  }
}
```

`StepPublish` gère aussi son propre `publishError` state et un modal
local `subscriptionModalOpen`. Le prop `isPublishing` a été retiré
— le loading state est géré localement dans `StepPublish`.

### Refactor `BillingClient.tsx` — upgrade/downgrade in-place via `changeSubscriptionPlanAction`

Avant Phase 6, BillingClient appelait `createSubscriptionCheckoutAction`
pour TOUT changement de plan (free → paid, mais aussi starter → pro,
monthly → yearly, etc.). Stripe créait alors une **nouvelle** subscription,
ce qui est incorrect pour un changement de plan : il faut un
`stripe.subscriptions.update` in-place qui préserve le `subscription_id`,
applique la proration, et ne créé pas de double-billing.

Nouvelle Server Action `changeSubscriptionPlanAction({ plan, interval })`
dans `src/actions/billing.ts` :

- Lit `subscriptions.stripe_subscription_id` (fallback sur
  `users.stripe_subscription_id` pendant la transition).
- Résout le nouveau `priceId` via `getSubscriptionPriceId(plan, interval)`.
- Appelle `updateExistingSubscription({ subscriptionId, newPriceId })` qui
  était déjà dans `src/lib/stripe/checkout.ts` (non touché en Phase 2 parce
  que déjà correct — il vérifie l'idempotence via `currentItem.price.id ===
  newPriceId` qui retourne "Tu es deja sur ce plan").
- Retourne `{ ok: true, message }` ou `{ ok: false, error }`.

**Trois modes de changement** dans `BillingClient.handleSubscriptionClick` :

```
free → paid    : ouvre la modal (SubscriptionCheckoutModal)
paid → paid    : changeSubscriptionPlanAction (update in-place)
déjà sur plan  : error "Tu es deja sur ce plan" du helper, géré en feedback
```

### Règles `Pricing.tsx` — Link → button avec `onPlanClick`

Le composant `marketing/Pricing.tsx` était structuré avec des `<Link href>`
pointant vers `/register?plan=…` (hard-coded dans `plansData.href`). Pour
le rendre polymorphe (réutilisable par `/tarifs` loggé ET anon), j'ai :

- Retiré le champ `href` de `PlanData` et des entries.
- Ajouté un prop optionnel `onPlanClick?: (planId: string) => void`.
- Converti tous les CTAs de `<Link>` à `<button type="button" onClick={() => onPlanClick?.(plan.id)}>`.

Le composant reste utilisable sans handler (si aucun `onPlanClick` n'est
passé, les boutons sont juste no-op — utile pour une éventuelle landing
publique où le user doit finir par s'inscrire avant de choisir, mais
actuellement tous les consommateurs passent un handler).

### Fichiers créés

- `src/components/billing/AutoOpenSubscriptionModal.tsx` — tiny client
  wrapper de `SubscriptionCheckoutModal` qui auto-open au mount (guard
  `hasAutoOpenedRef` pour StrictMode) et strippe les query params au close.

### Fichiers modifiés (14)

- `src/actions/billing.ts` — ajout `changeSubscriptionPlanAction`, retrait
  `createSubscriptionCheckoutAction` / `createTemplateCheckoutAction` /
  `SubscriptionUpdateResult` / import de `createSubscriptionCheckout` /
  `createTemplateCheckout` / check `hasLegacySub` (TODO Phase 4 soldé).
- `src/lib/stripe/checkout.ts` — rewrite en-tête + suppression des 2 helpers
  legacy ; seul `updateExistingSubscription` + `createBillingPortalSession`
  restent. Nom de fichier conservé (rename reporté Phase 7 si
  réécriture `/billing` touche les imports).
- `src/app/api/webhooks/stripe/route.ts` — retrait `handleCheckoutCompleted`
  + sous-helpers `handleSubscriptionCheckout` / `handleTemplateCheckout`
  + case `'checkout.session.completed'` du switch + mise à jour des
  commentaires headers qui référençaient le flow legacy.
- `src/lib/stripe/webhook-helpers.ts` — retrait mention
  `handleCheckoutCompleted` du commentaire d'en-tête.
- `src/app/api/webhooks/stripe/email-handlers.ts` — retrait mention
  `handleSubscriptionCheckout` du commentaire de `sendPaymentSucceededEmail`.
- `src/components/billing/BillingClient.tsx` — recâblage complet :
  remplacement des calls `createSubscriptionCheckoutAction` /
  `createTemplateCheckoutAction` par state `subscriptionModalPlan` +
  `templateModalId` ; handleSubscriptionClick branche free/paid ;
  rendu conditionnel de `SubscriptionCheckoutModal` + `TemplatePurchaseModal`
  en fin de JSX.
- `src/components/marketing/Pricing.tsx` — conversion Link → button,
  ajout prop `onPlanClick`, retrait champ `href`.
- `src/components/marketing/TarifsClient.tsx` — rewrite avec props
  `isAuthenticated` + `currentPlan`, `handlePlanClick` (anon/free/paid),
  rendu conditionnel modal, feedback state.
- `src/app/(marketing)/tarifs/page.tsx` — conversion en async Server
  Component avec `getUser()` + lecture `users.plan`.
- `src/app/(dashboard)/dashboard/page.tsx` — ajout `searchParams` prop
  (Promise en Next 15), rendu conditionnel `<AutoOpenSubscriptionModal>`.
- `src/app/(auth)/register/page.tsx` — lecture `useSearchParams()`,
  construction `dashboardUrl` préservant `plan` + `interval`, redirect
  final vers `dashboardUrl`.
- `src/hooks/useEditorState.ts` — split `handlePublish` en `saveDraft`
  + `publishNow` ; retrait imports `createSubscriptionCheckoutAction` /
  `createTemplateCheckoutAction` ; refactor `handleTemplatePurchase` pour
  ne faire que la sauvegarde du draft.
- `src/components/editor/EditorClient.tsx` — update props passés à
  `StepPublish` (`onSaveDraft` + `onPublishNow` au lieu de `onPublish`,
  retrait `isPublishing`).
- `src/components/editor/StepPublish.tsx` — ajout import
  `SubscriptionCheckoutModal`, state local `subscriptionModalOpen` +
  `publishError` + `isPublishing`, orchestration `handlePublishClick`
  (save puis branche), `handleModalSuccess` qui appelle `onPublishNow`.

### Fichiers supprimés

- `src/app/dev-modal-test/page.tsx` — route scratch de développement
  utilisée pour itérer sur l'appearance Stripe Elements en Phase 4.
  N'a jamais été linkée depuis l'app et était cachée derrière un
  check NODE_ENV. Plus utile en Phase 6.
- `STRIPE_SUCCESS_URL` + `STRIPE_CANCEL_URL` dans `.env.example` —
  jamais lues depuis le code (URLs hardcodées via `APP_URL`), dette
  documentée en Phase 1 et soldée ici comme prévu.

### Code supprimé (récap)

Summary des suppressions fonctionnelles opérées en Phase 6 (pour mémoire
diff-level — voir git log Phase 6 pour les lignes exactes) :

1. **`createSubscriptionCheckout`** (legacy helper, `src/lib/stripe/checkout.ts`)
   — créait une Stripe Checkout Session hostée.
2. **`createTemplateCheckout`** (legacy helper, idem) — idem pour les
   templates one-shot.
3. **`createSubscriptionCheckoutAction`** (Server Action, `src/actions/billing.ts`)
   — wrapper du helper ci-dessus pour UI.
4. **`createTemplateCheckoutAction`** (Server Action, idem).
5. **`SubscriptionUpdateResult`** interface (plus consommée).
6. **`handleCheckoutCompleted`** + ses 2 sous-helpers dans le webhook route.
7. **Check `hasLegacySub`** défensif dans `billing.ts` (TODO Phase 4
   marqué "à retirer Phase 6" — soldé).

### Checklist déploiement Phase 6 (⚠️ à faire AVANT de merger en prod)

Le webhook `checkout.session.completed` n'est plus handled dans le code :
le switch retourne implicitement dans la branche "default" qui log et
retourne 200. Si Stripe continue à firer cet event en prod après deploy,
on risque une fenêtre pendant laquelle un paiement hostedmalgré-tout
(cas extrême : un retry de vieille session en attente) laisse un user
crédité côté Stripe mais PAS côté Vizly DB. Les handlers
`customer.subscription.created` et `invoice.paid` le rattrapent dans 99%
des cas (c'est justement la raison d'être de la Phase 3), mais pour être
100% propre :

**Avant le merge en prod :**

1. Aller dans Stripe Dashboard → Developers → Webhooks → endpoint Railway
   production.
2. Cliquer "Listen to events" / "Select events".
3. **Décocher** `checkout.session.completed` de la liste.
4. Sauvegarder.
5. Attendre ~1h que les éventuelles Checkout Sessions en cours expirent
   (TTL par défaut Stripe = 24h pour les Checkout Sessions, mais les
   utilisateurs actifs cliquent en < 10 min dans 99% des cas).
6. **Puis** merger + deploy Phase 6.

**Optionnel post-deploy :** supprimer les Products legacy "Starter" /
"Pro" / templates du Dashboard Stripe ? **NON** — les `price_id` restent
utilisés par `src/lib/stripe/prices.ts` pour créer les subscriptions et
payment intents. Les Products Stripe sont toujours actifs, seul le mode
Checkout Hosted est retiré côté code Vizly.

### Note sur les anti-patterns design system dans `BillingClient.tsx`

Tom m'a explicitement dit pendant Phase 6 : "ne touche pas aux
`shadow-sm`, aux `scale-`, aux `bg-green-50`, aux `rounded-full` que
tu vois passer dans ces fichiers. Ce n'est pas le périmètre Phase 6."
Donc BillingClient.tsx et TarifsClient.tsx contiennent toujours des
violations du DESIGN-SYSTEM.md (shadows au repos, scale hover, bordures
colorées, gradients badges "Populaire"). À nettoyer en Phase 7 ou dans
un chantier UI dédié post-migration Stripe.

→ **Soldé en Phase 7 pour `BillingClient.tsx`** (rewrite complet, voir
section ci-dessous). `TarifsClient.tsx` reste avec ses antipatterns —
hors périmètre Phase 7, à traiter dans un chantier UI dédié.

---

## Phase 7 — Récap `/billing` custom + page `/billing/confirm`

### Objectif

Réécriture complète de `BillingClient.tsx` qui lit désormais les tables
locales `subscriptions` et `invoices` (instantané, zéro appel Stripe live),
et création de la page `/billing/confirm` qui gère le retour 3DS post-
`stripe.confirmPayment` quand la carte exige Strong Customer Authentication.

### Architecture data — `getBillingDetails` (option A retenue)

`getBillingStatus` est appelée à 2 endroits :
- `src/app/(dashboard)/billing/page.tsx` (où Phase 7 a besoin du shape
  riche)
- `src/hooks/useEditorState.ts` (où seul `plan` + `purchasedTemplates`
  est consommé)

Verdict : **option A**. Création d'une nouvelle Server Action
`getBillingDetails` qui lit les tables riches en parallèle, sans toucher
à `getBillingStatus` qui reste lean pour `useEditorState`. Pas de
duplication réelle puisque les deux fonctions ont des shapes différents
et des consommateurs disjoints.

`getBillingDetails` fait 4 queries en parallèle via `Promise.all` :
1. `users.plan`
2. `subscriptions` (single row par user via `.maybeSingle()`)
3. `invoices` triées `paid_at desc` (filtrées sur `paid_at !== null`
   pour exclure les rares invoices en draft qui auraient atterri en DB)
4. `purchased_templates`

Toutes les queries respectent les RLS Phase 1 (le user ne voit que ses
propres lignes). Aucun appel `stripe.*` côté serveur — c'est le point
critique de Phase 7.

Les types `BillingSubscriptionSummary`, `BillingInvoiceSummary` et
`BillingDetails` sont exportés depuis `src/actions/billing.ts` pour
que le client component les consomme directement (pas de duplication
de type côté UI).

### Structure du nouveau `BillingClient.tsx`

Bloc par bloc dans l'ordre du JSX :

1. **Bandeau cancel** (visible si `subscription.cancel_at_period_end === true`)
   — message info sobre `bg-surface-warm` + bordure neutre. Date formatée
   FR-FR, nom du plan injecté. Disparaît dès que le webhook
   `customer.subscription.updated` syncera `cancel_at_period_end: false`
   après une réactivation.

2. **Bandeau success** (auto-clear 5 s) — affiché après
   `changeSubscriptionPlanAction` réussi. Style identique au cancel
   banner : `bg-surface-warm`, icône `Check` neutre, pas de vert.

3. **Bandeau erreur** (persistant jusqu'à prochaine action) — `bg-surface-warm`,
   icône `AlertCircle` en `text-destructive`. Texte foreground.

4. **Bloc "Mon abonnement"** — pour user free : phrase sobre
   `Tu n'as pas d'abonnement actif.`. Pour user payant : grille `dl/dt/dd`
   3 colonnes (Plan, Facturation, Prochaine facture). Pas de carte, pas
   de feature list, pas d'icône Crown. Le badge "Annulation prévue"
   remplace la date dans la 3e colonne quand `cancel_at_period_end === true`.

5. **Bloc "Choisis ton abonnement" / "Changer de plan"** —
   contexte-aware :
   - **Free** : titre `Choisis ton abonnement`, toggle interval visible,
     2 CTAs (Starter primaire + Pro secondaire) qui ouvrent la modal.
   - **Starter monthly** : `Passer Pro — 9,99 €/mois` (primaire) +
     `Passer en facturation annuelle (−15 %)` (secondaire).
   - **Starter yearly** : `Passer Pro — 101,90 €/an` (primaire) +
     `Repasser en facturation mensuelle` (secondaire).
   - **Pro monthly** : `Repasser Starter — 4,99 €/mois` (secondaire,
     downgrade) + `Passer en facturation annuelle (−15 %)` (secondaire).
   - **Pro yearly** : `Repasser Starter — 50,90 €/an` (secondaire) +
     `Repasser en facturation mensuelle` (secondaire).
   Tous les CTAs paid passent par la même `changeSubscriptionPlanAction`
   ; seul le shape `{plan, interval}` change. Aucune nouvelle Server
   Action créée.

6. **Bloc "Factures"** — visible si `invoices.length > 0`. Tableau HTML
   natif sobre (Date, Numéro, Montant, Documents). Liens `Voir en ligne`
   (vers `hosted_invoice_url`) et `PDF` (vers `invoice_pdf`) en
   `text-muted-foreground` avec hover `text-foreground`. Pagination
   locale : affiche 12 dernières par défaut, bouton `Voir toutes les
   factures` qui révèle le reste via state local `showAllInvoices`.

7. **Bloc "Templates premium"** — adaptatif (option (c) du récap) :
   - Si `purchasedPremiumTemplates.length > 0` : section
     `Tes templates premium` listant uniquement les achetés + lien
     `Voir tous les templates premium →` vers `/templates`.
   - Sinon, si `plan !== 'free'` : grille des 4 templates premium avec
     CTA `Débloquer — 2,99 €` qui ouvre la `TemplatePurchaseModal`.
   - Sinon (free + 0 templates) : bloc absent.

8. **Bloc "Gérer mon abonnement"** — visible uniquement pour les payants.
   Description courte + un bouton secondaire `Ouvrir le portail Stripe`
   qui appelle `createBillingPortalAction()` et redirige.

9. **Modals** — `SubscriptionCheckoutModal` + `TemplatePurchaseModal`
   rendus conditionnellement en fin de JSX. **Non touchées en Phase 7**
   (elles restent telles quelles depuis Phase 4/5).

### Sous-composants extraits localement

Le rewrite extrait des sous-composants dans le **même fichier**
(`BillingClient.tsx`) plutôt que dans des fichiers séparés. Raisons :
- Aucun de ces sous-composants n'est consommé ailleurs dans l'app.
- Le fichier monolithique reste lisible (~970 lignes structurées
  bloc par bloc).
- Une extraction multi-fichiers serait du polish prématuré.

Sous-composants : `Banner`, `SubscriptionBlock`, `DetailField`,
`StatusBadge`, `ChangePlanBlock`, `IntervalToggle`, `InvoicesBlock`,
`TemplatesBlock`, `ManageBlock`, `PrimaryButton`, `SecondaryButton`.

Les boutons primaires et secondaires sont extraits comme composants pour
éliminer les ~40 lignes de classes Tailwind dupliquées qui existaient
dans l'ancien `BillingClient`. Ils n'ont volontairement aucune option
`variant` / `size` — c'est juste un wrapper qui standardise la signature
et le style. YAGNI strict.

### Antipatterns DA corrigés (vs ancien BillingClient.tsx 535 lignes)

| Avant | Après |
|---|---|
| `bg-green-50/80`, `bg-amber-50/80` (bandeaux statut) | `bg-surface-warm` neutre |
| `border-green-200`, `border-amber-200` | `border-border` neutre |
| `text-green-600/700/800`, `text-amber-600/700/800` | `text-foreground` + `text-destructive` pour erreurs |
| `rounded-full` sur disques d'icône bandeaux | Icône inline 16px sans wrapper circulaire |
| `bg-amber-100 text-amber-800` (badge Pro) | Badge sobre `bg-surface-warm text-foreground` |
| `text-amber-500` sur Crown icon | Crown supprimé (icône décorative) |
| `rounded-[var(--radius-full)]` sur badges | `rounded` (radius standard 6px) |
| `Check` en `text-accent` dans feature list | Feature list supprimée (donnée déjà connue par l'user) |
| `shadow-[0_2px_8px_rgba(212,99,78,0.2)]` sur CTAs | Aucune shadow au repos |
| `active:scale-[0.98]` sur tous les CTAs | Aucun scale, transitions colors uniquement |
| `transition-all duration-200` | `transition-colors duration-150` |

### Page `/billing/confirm`

**Localisation** : `src/app/(dashboard)/billing/confirm/page.tsx`
(Server Component) + `ConfirmRedirectAfterDelay.tsx` (Client Component).

**Pourquoi sous `(dashboard)`** : le user authentifié hérite du layout
sidebar et retombe dans son contexte habituel après le retour 3DS.

**Query params lus** :
- `redirect_status` : `succeeded | failed | undefined` — ajouté
  automatiquement par Stripe lors du redirect post-3DS
- `subscription_id` : custom param injecté par `SubscriptionCheckoutModal`
  via le `return_url` de `confirmPayment` (utilisé pour discriminer
  le contexte sub vs template — pas pour fetcher Stripe)
- `payment_intent_id` : custom param injecté par `TemplatePurchaseModal`
  pour la même raison
- (`payment_intent`, `payment_intent_client_secret` : présents mais
  pas lus — pas besoin de re-fetch Stripe)

**Comportement** :
- `succeeded` → icône Check 32px sobre, titre `Paiement confirmé.`
  (point final cohérent avec le H1 `Mon abonnement.`), sous-titre adapté
  au contexte (sub vs template), redirect auto vers `/billing` après 3 s
  via `<ConfirmRedirectAfterDelay />`. Bouton `Continuer` qui zappe
  le délai immédiatement (`clearTimeout` + `router.push`).
- `failed` → icône X sobre, titre `Paiement refusé.`, sous-titre court,
  bouton primaire `Retour à mes abonnements`.
- `unknown` → branche défensive si `redirect_status` est absent ou
  inconnu (cas qui ne devrait jamais survenir mais on n'éclate pas
  silencieusement). Icône `AlertCircle` neutre, message factuel,
  bouton retour secondaire.

**Rule clé respectée** : la page **ne touche pas la DB**. Le webhook
pipeline (`customer.subscription.created`, `invoice.paid`,
`payment_intent.succeeded`) reste la source de vérité et tourne en
parallèle. Le `redirect_status=succeeded` dans l'URL n'est qu'un signal
optimiste pour afficher un message ; le délai de 3 s avant redirect
laisse au webhook le temps de lander avant le prochain render de
`/billing`.

**Layout** : centré verticalement (l'EXCEPTION au "alignement gauche
partout" du DA — c'est une page de confirmation, pattern reconnu).

### Extension `PLANS` dans `src/lib/constants.ts`

Ajout de `priceCents: { monthly: number; yearly: number }` à `starter`
et `pro`. Permet d'utiliser `formatEur(PLANS[plan].priceCents[interval])`
partout dans `BillingClient` sans hardcoder les prix en string. Cohérent
avec le pattern Phase 4/5 des modals.

Vérifié : aucun consommateur de `PLANS` ne lit `price` ni `yearlyPrice`
en valeur numérique — ces champs restent uniquement pour rétrocompatibilité
des marketing pages qui les affichent en string formatée. Pas de
dépréciation forcée en Phase 7.

### Suppression du dead code `?checkout=success/cancel`

L'ancien `billing/page.tsx` lisait `searchParams.checkout` et passait
un `checkoutStatus` au client pour afficher des bandeaux post-redirect.
Plus aucune Server Action ne set ces params depuis Phase 6, plus aucun
`return_url` Stripe ne pointe là-dessus → suppression complète.

Le nouveau `billing/page.tsx` fait `getBillingDetails()` + render direct
sans lire de query params (les confirmations 3DS atterrissent sur
`/billing/confirm`, pas sur `/billing` directement).

### Fichiers touchés (Phase 7)

**Créés (3)** :
- `src/app/(dashboard)/billing/confirm/page.tsx` — Server Component qui
  lit `searchParams` et branche sur `redirect_status`.
- `src/app/(dashboard)/billing/confirm/ConfirmRedirectAfterDelay.tsx` —
  Client Component qui gère le `setTimeout` + bouton `Continuer`.
- (pas de nouvelle migration Supabase, pas de nouvelle Server Action
  hors `getBillingDetails` ajoutée à `billing.ts`)

**Modifiés (5)** :
- `src/components/billing/BillingClient.tsx` — rewrite complet
  (~970 lignes structurées, vs 535 lignes bordéliques avant).
- `src/app/(dashboard)/billing/page.tsx` — H1 modifié avec accent
  terracotta `Mon abonnement.`, suppression du `?checkout=` legacy,
  passage à `getBillingDetails`.
- `src/actions/billing.ts` — ajout de `getBillingDetails` et de 3 types
  exportés (`BillingSubscriptionSummary`, `BillingInvoiceSummary`,
  `BillingDetails`). `getBillingStatus` non touchée.
- `src/lib/constants.ts` — ajout `priceCents` sur `starter` et `pro`.
- `messages/fr.json` + `messages/en.json` — refonte complète du bloc
  `billing` avec ~50 nouvelles clés (titles, CTAs contextuels, libellés
  de tableau factures, messages page confirm). Anciennes clés inutilisées
  supprimées (`paymentConfirmed`, `paymentCancelled`, `pricePerMonth`,
  `featuresLabel`, `notOnline`, etc.).

### Dette technique identifiée pendant le chantier Stripe

**Rip-out global de la police Satoshi** : Tom m'a explicitement demandé
de NE PAS toucher à `font-[family-name:var(--font-satoshi)]` sur les
H1/H2 en Phase 7. Le DA Vizly impose pourtant DM Sans uniquement
(la `--font-display: var(--font-satoshi)` reste définie dans
`globals.css` mais n'est plus alignée avec le DA strict). Ce rip-out
touche TOUS les H1/H2 de l'app (dashboard, settings, marketing,
templates, billing) et nécessite aussi un update de `CLAUDE.md` qui
parle encore de "Satoshi" comme police de titre. **Hors périmètre
Stripe — chantier UI dédié post-migration.**

**Nettoyage `TarifsClient.tsx`** : reste avec ses antipatterns DA
(shadows custom, scale, badges gradient, couleurs hors système). Phase 6
les a laissés intacts par décision Tom, Phase 7 ne les touche pas car
hors périmètre `/billing`. À traiter dans le même chantier UI dédié.

**Sous-composants `BillingClient.tsx` à externaliser** : si la base
billing devient plus complexe (ex: ajout d'un onglet `Méthodes de
paiement` ou `Adresse de facturation` post-Stripe Tax), les
sous-composants `Banner`, `InvoicesBlock`, etc. mériteront leur fichier
propre. Pas le cas aujourd'hui — gardés en monofile.

### Test visuel attendu (à effectuer par Tom)

Trois flows à tester sur `https://localhost:3000/billing` :

1. **User free** : voit le bloc "Mon abonnement" sobre
   (`Tu n'as pas d'abonnement actif.`), bloc "Choisis ton abonnement"
   avec toggle + 2 CTAs. Pas de bloc factures. Pas de bloc gérer.
   Pas de bloc templates (sauf si l'user a déjà un template acheté
   par un ancien flow, cas marginal mais géré).
2. **User Starter active** : voit le bloc "Mon abonnement" avec détails
   (plan + interval + next billing), bloc "Changer de plan" avec
   2 CTAs (Pro + toggle interval), bloc factures si `invoices` présent,
   bloc "Tes templates achetés" si templates achetés OU bloc
   "Templates premium" achetable, bloc "Gérer mon abonnement".
3. **Flow 3DS** : clic CTA "Passer Starter" sur un user free → modal
   s'ouvre → carte `4000 0025 0000 3155` (force 3DS) → popup 3DS →
   approuver → redirect `/billing/confirm?redirect_status=succeeded` →
   message "Paiement confirmé." → auto-redirect `/billing` après 3 s
   avec sub active affichée.

---

## Phase 7.5 — Correctif post-test Tom

Tom a testé Phase 7 après cache clear et a remonté **un bug critique
+ une refonte visuelle**. Pas un nouveau "feat" — c'est un correctif
sur Phase 7. La numérotation 7.5 est uniquement pour clarté dans ces
notes ; le commit lui-même est un `fix(stripe):`.

### Bug critique — User Pro affiché comme "Tu n'as pas d'abonnement actif"

**Cause** : le sous-composant `SubscriptionBlock` collapse-ait deux
conditions distinctes (`plan === 'free' || subscription === null`)
et tombait dans le branch "free" pour les users payants legacy qui
ont un `users.plan` correctement renseigné mais aucune row dans
`subscriptions` (utilisateurs créés avant Phase 1, ou hydratation
webhook manquée).

**Source-of-truth contract clarifié** (documenté dans le commentaire
de `getBillingDetails`) :
- `users.plan` = canonical, toujours présent depuis migration 001
- `subscriptions` row = enrichissement OPTIONNEL (interval,
  current_period_end, cancel_at_period_end)

**Fix** :
- `SubscriptionBlock` ne lit plus que `plan === 'free'` pour basculer
  sur la phrase sobre `Tu n'as pas d'abonnement actif.`
- Le nouveau sous-composant `PlanCard` reçoit `plan` + `subscription`
  et gère le fallback : si `subscription === null`, il affiche le plan,
  le prix (depuis `PLANS[plan]` constants), les features, et un message
  discret `Détails complets disponibles dans le portail Stripe.` à la
  place du bloc "Prochaine facture / Annulation prévue".
- `ChangePlanBlock` retourne `null` (bloc absent) quand `plan !== 'free'`
  ET `subscription === null` — on ne peut pas construire des CTAs
  context-aware sans connaître l'`interval` actuel. Le user est poussé
  vers le portal Stripe via le bloc séparé `ManageBlock` en bas de page.

### Refonte visuelle — bloc "Mon abonnement" pour user payant

Tom a comparé avec l'ancien design Vizly et préfère l'esprit
"card avec features détaillées" à la version Phase 7 minimaliste
(grille `dl/dt/dd` 3 colonnes). Phase 7 était trop austère.

Nouveau pattern `PlanCard` :
- Card pleine largeur `border border-border rounded-[var(--radius-md)]
  bg-background p-6` (zéro shadow au repos)
- Header : icône (Crown jaune `text-amber-500` pour Pro, CreditCard
  neutre `text-foreground` pour Starter) + nom du plan + prix + badge
  uppercase sobre `bg-surface-warm text-foreground` (PAS amber)
- Liste features depuis `PLANS[plan].features` avec `Check` 14px
  `text-foreground` (PAS text-accent — l'accent terracotta reste
  réservé aux CTAs, pas aux feature lists)
- Footer séparé par `border-t border-border` :
  - `Prochaine facture : Le 15 mai 2026` en `text-muted-foreground`
  - Si `cancel_at_period_end === true` : ligne supplémentaire
    `Annulation prévue le {date}` en `text-muted-foreground`
  - Si `subscription === null` (legacy fallback) : `Détails complets
    disponibles dans le portail Stripe.`
- **Pas de bouton "Gérer mon abonnement" dans la card** — Tom a
  demandé que le bouton portal reste dans le bloc séparé `ManageBlock`
  en bas. La card affiche l'info, le bloc du bas regroupe les actions.

**Exception DA explicite** : Crown coloré `text-amber-500` est
**autorisé** sur la card du plan Pro. Validé par Tom comme expressif
sans être "trop IA". Reste banni partout ailleurs : `bg-amber-*`,
`border-amber-*`, `text-amber-*` sur badges/bandeaux/cards.

### Refonte visuelle — bloc "Choisis ton abonnement" pour user free

Phase 7 affichait 2 boutons inline. Trop pauvre pour un écran
d'arbitrage Starter vs Pro où l'user veut comparer les features.

Nouveau pattern `ChoosePlanCard` (sous-composant local) :
- Layout `grid grid-cols-1 md:grid-cols-2 gap-6` — 2 cards côte à côte
  desktop, empilées mobile
- Toggle interval Mensuel/Annuel reste en haut, aligné à droite (à côté
  du H2 `Choisis ton abonnement`)
- Chaque card :
  - Nom du plan en `text-lg font-semibold`
  - Prix avec suffixe `/mois` ou `/an` en `text-muted-foreground`
  - Liste features de `PLANS[plan].features` (même style `Check` sobre
    que `PlanCard`)
  - Bouton CTA en bas, **PrimaryButton pour Starter** (CTA naturel
    pour la majorité des users) + **SecondaryButton pour Pro** (cible
    plus rare, mais visible)
- **Pas de "card recommandée"** avec border accent ou badge "Populaire"
  — pas de pression marketing, sobre.

### Refonte visuelle — bloc "Changer de plan" pour user payant

Conservé en CTAs in-place (pas de cards), purifié par rapport à
Phase 7. Logique contextuelle inchangée :
- Starter monthly : `Passer Pro — 9,99 €/mois` + `Passer en facturation
  annuelle (−15 %)`
- Starter yearly : `Passer Pro — 101,90 €/an` + `Repasser en facturation
  mensuelle`
- Pro monthly : `Repasser Starter — 4,99 €/mois` + `Passer en
  facturation annuelle (−15 %)`
- Pro yearly : `Repasser Starter — 50,90 €/an` + `Repasser en
  facturation mensuelle`

Tous les CTAs passent par `changeSubscriptionPlanAction`. Aucun
nouveau Server Action.

### Investigation lenteur 3-5 s — analyse théorique du code

Tom a observé que la modal s'ouvre vite (titre + récap + CTA visibles
~immédiat) mais que l'**iframe Stripe Elements** met 3-5 secondes
à apparaître. Demande d'investigation T1-T4.

**Limitation** : je ne peux pas mesurer T2-T4 en autonomie sans
contexte browser + auth user actif. J'ai analysé `T1` théoriquement
en relisant le code de `createSubscriptionIntentAction` +
`createSubscriptionWithPaymentIntent`. Diagnostic raisonné ci-dessous.

**Décomposition T1 (Server Action côté Vizly)** :

| Étape | Coût estimé |
|---|---|
| `auth.getUser()` | ~30-80 ms (Supabase Auth) |
| `subscriptions.maybeSingle()` (duplicate-check) | ~30-80 ms (Supabase DB) |
| `getOrCreateCustomerId()` (warm path) | ~30-80 ms (Supabase DB) |
| `getOrCreateCustomerId()` (cold path, 1ère fois) | ~250-600 ms (Supabase + `stripe.customers.create` + Supabase update) |
| `stripe.subscriptions.create()` avec expand `latest_invoice.confirmation_secret` | **~800-1500 ms** (Stripe doit créer sub + finaliser invoice + créer PaymentIntent + serializer toute la chaîne expandée) |

**T1 estimé** : ~900-1700 ms warm, ~1100-2200 ms cold. C'est l'écrasante
majorité du budget temps. `stripe.subscriptions.create` est
intrinsèquement lent en mode test, c'est connu.

**Décomposition T2-T4 (browser, non mesurable en autonomie)** :

| Symptôme probable | Cause |
|---|---|
| T2 ~300-500 ms | Chargement `js.stripe.com/v3` (CDN, incompressible mais cacheable) |
| T3 = T1 + T2 en série | Le clientSecret n'est dispo qu'après T1, l'iframe ne peut commencer son init qu'après réception du clientSecret |
| T4 = T3 + 500-1500 ms | `ExpressCheckoutElement` interroge le browser pour les wallets : Apple Pay timeout (domaine non vérifié sur localhost), Google Pay PaymentRequest API resolution, Link availability check |
| Cold start dev mode | Première ouverture de la modal : Next.js compile le chunk client `SubscriptionCheckoutModal` + wrapper `@stripe/react-stripe-js` — ajoute 500-2000 ms uniquement la première fois |

**Estimation T4 totale** : ~2000-3500 ms warm, jusqu'à 4500 ms en cold
start dev mode. **Cohérent avec les 3-5 s observés.**

### Recommandation Phase 7.5 — ne pas fixer la lenteur dans cette phase

**Argumentaire** :
1. La majorité de la latence vient de Stripe lui-même (`subscriptions.create`)
   et de l'iframe init — non-actionnables côté Vizly.
2. Le dev mode HTTPS local avec cert auto-signé ajoute un overhead
   constant qui **disparaîtra en prod sur Railway avec un vrai cert**.
3. Stripe **mode test** est plus lent que **mode live** sur les
   créations de subscription (sandbox partagée moins prioritaire).
4. Le cold start Next.js dev compile une seule fois — en prod le
   chunk est déjà bundle.

**Action proposée** : Tom mesure en prod après deploy. Si T4 reste
> 2 s en prod réel, on implémente un **pre-fetch on hover** du
CTA "Passer Starter" : `onMouseEnter` lance `createSubscriptionIntentAction`,
le clientSecret est stocké en state local, le clic devient quasi-
instantané (T1 perçu = 0). Compromis : crée des Stripe subscriptions
`incomplete` que Stripe garbage-collect en 24 h. Acceptable.

**Pas implémenté en Phase 7.5** parce que :
- On n'a pas mesuré T4 en prod (data non dispo)
- Le pre-fetch on hover ajoute du code et crée du déchet Stripe
- Le problème pourrait disparaître naturellement en prod

→ Décision Tom : on accepte la latence dev local et on remesure en
prod après le deploy Phase 1-7.

### Warnings console attendus en dev local (à ignorer)

Tom a vu 3 warnings dans la console quand il a testé Phase 7 sur
`https://localhost:3000/billing`. **Aucun n'est un bug**, tous sont
du comportement attendu en dev local et disparaîtront ou resteront
inoffensifs en prod :

1. **`No Listener: tabs:outgoing.message.ready`**
   — Provient d'une **extension Chrome**, rien à voir avec Vizly ou
   Stripe. Ignorer.

2. **`[Stripe.js] Link payment method type not activated`**
   — Faux warning Stripe en mode test. Link **est** activé sur le
   compte Stripe Vizly côté Dashboard, mais le payload de l'iframe
   ne le détecte pas correctement en test mode. Comportement attendu,
   disparaît en mode live.

3. **`[Stripe.js] You have not registered or verified the domain
   ... apple_pay`**
   — Apple Pay nécessite une vérification de domaine via
   `apple-developer-merchantid-domain-association` à la racine du
   domaine. Cette vérification est **reportée à la session "passage
   en prod"** sur `vizly.fr`, hors périmètre Stripe Elements. Le
   warning est inoffensif sur localhost — Apple Pay ne s'affiche
   simplement pas dans `ExpressCheckoutElement`.

Aucun de ces warnings ne nécessite d'action côté code. Ils sont
listés ici pour qu'on n'y revienne pas dans une future session
"j'ai vu un warning en console".

### Fichiers touchés en Phase 7.5

**Modifiés (4)** :
- `src/components/billing/BillingClient.tsx` — refonte `SubscriptionBlock`
  + ajout sous-composants `PlanCard`, `PlanBadge`, `ChoosePlanCard` ;
  refonte `ChangePlanBlock` avec branche grid 2-cards pour user free
  + branche `null` pour paid+legacy ; suppression des sous-composants
  morts `DetailField` et `StatusBadge` ; ajout des imports `Crown` et
  `CreditCard` de lucide.
- `src/actions/billing.ts` — clarification du commentaire de
  `getBillingDetails` avec section "Source-of-truth contract (Phase 7.5)"
  pour rendre explicite la séparation `users.plan` canonical vs
  `subscriptions` enrichissement.
- `messages/fr.json` + `messages/en.json` — ajout des clés
  `planLabel`, `planFeaturesLabel`, `cancelScheduledLine`, `legacyHint`,
  refonte de `nextBilling` (format `Prochaine facture : {date}` au
  lieu de juste `Prochaine facture`). Suppression des clés Phase 7
  inutilisées : `currentPlan`, `currentInterval`, `billingMonthly`,
  `billingYearly`, `noNextBilling`, `statusActive`,
  `statusCancelScheduled`.
- `STRIPE_MIGRATION_NOTES.md` — cette section.

**Pas touché** :
- `src/actions/billing.ts` côté logique de `getBillingDetails` — la
  fonction lisait déjà correctement `users.plan` comme source de
  vérité. Le bug était entièrement dans le client component.
- Modals Phase 4/5
- Webhooks Phase 3
- Schéma Supabase
- `getBillingStatus` (consommée par `useEditorState`)

---

## Clôture du sprint Stripe Elements

Le sprint **Stripe Checkout hosté → Stripe Elements in-app** est
clôturé sur le **fonctionnel + API + backend**. Le polish design de
`/billing` est explicitement reporté à un chantier UI/UX dédié
post-chantier. Tom valide cette ligne : on shippe ce qui marche, on
re-design plus tard quand le backend est solide.

### A — Bilan du sprint Stripe

**Phases 1 → 7 + 7.5 toutes complétées en local.** Tout le code est
sur la branche `main`, **non poussé en remote** (règle du chantier
respectée jusqu'au bout, le push final viendra dans une session
déploiement dédiée).

**Liste des 10 commits du chantier** (de Phase 1 au correctif final) :

| # | Hash | Phase | Stat |
|---|---|---|---|
| 1 | `6f189e0` | feat(stripe): phase 1 — fondations DB et dettes bloquantes | +712 / −98 (7 fichiers) |
| 2 | `775fac8` | feat(stripe): phase 2 — lib elements serveur | +1 013 / −57 (7 fichiers) |
| 3 | `d8a17b0` | feat(stripe): phase 3 — webhooks migrés et idempotents | +1 186 / −289 (4 fichiers) |
| 4 | `6d178e8` | docs(stripe): phase 3 — expliciter choix `onConflict='user_id'` | +98 / −13 (3 fichiers) |
| 5 | `0ec9249` | feat(stripe): phase 4 — modal subscription elements | +1 302 / −4 (5 fichiers) |
| 6 | `44ee989` | fix(stripe): phase 4 — expand + dynamic PM + ExpressCheckout + validation errors | +608 / −21 (5 fichiers) |
| 7 | `69e9f64` | feat(stripe): phase 5 — modal template purchase | +1 055 / −23 (7 fichiers) |
| 8 | `2bd4d2d` | feat(stripe): phase 6 — recâblage UI et nettoyage ancien code | +943 / −611 (17 fichiers) |
| 9 | `3919a9f` | feat(stripe): phase 7 — récap billing custom et page confirm | +1 570 / −486 (9 fichiers) |
| 10 | `a3b6416` | fix(stripe): phase 7.5 — `users.plan` source de vérité + refonte visuelle billing | +455 / −105 (5 fichiers) |

**Total chantier** : ~**+8 942 / −1 707** (∼+7 235 lignes nettes,
~70 fichiers touchés avec doublons inter-commits).

**Confirmations fonctionnelles** (toutes validées en local par Tom) :
- ✅ Modals `SubscriptionCheckoutModal` et `TemplatePurchaseModal` en
  place, fonctionnelles, avec PaymentElement Card + ExpressCheckoutElement
  wallets, validation errors UX correcte
- ✅ Webhooks Stripe **idempotents** via `webhook_events` keyed by
  `stripe_event_id`, errors → 500 pour retry, dispatch correct par
  `event.type`
- ✅ Backend migré : `getBillingDetails` lit les tables locales
  `subscriptions` + `invoices` (zéro appel Stripe live par render),
  `users.plan` reste source de vérité canonical avec fallback gracieux
  pour les users payants legacy
- ✅ UI câblée sur tous les points d'entrée : `/billing`, `/tarifs`
  (anon + loggé), `/editor` Step 4 Publier, `/register?plan=X` avec
  AutoOpenSubscriptionModal côté `/dashboard`
- ✅ Page `/billing/confirm` en place pour le retour 3DS, ne touche
  pas la DB (webhook = source de vérité), redirect auto + bouton
  Continuer
- ✅ Code legacy Stripe Checkout entièrement retiré (Server Actions,
  helpers lib, handler webhook, env vars, route scratch)
- ✅ Migration Supabase `012_stripe_elements_foundations.sql`
  appliquée : 3 nouvelles tables (`subscriptions`, `invoices`,
  `webhook_events`), RLS sur 100% d'entre elles

### B — Dette technique post-chantier identifiée

Tout ce qui est connu, listé, et **explicitement hors périmètre**
de ce sprint Stripe. À traiter dans des chantiers séparés ou des
sessions de polish.

1. **Polish visuel `/billing`** — la structure Phase 7.5 est
   fonctionnelle mais l'esthétique mérite une session UI/UX dédiée.
   Cards plus détaillées, hiérarchie visuelle, possibles éléments
   graphiques type icônes plan custom, illustrations, animations
   subtiles. Tom préfère shipper du fonctionnel propre et redesigner
   après. **Chantier "polish billing UI" séparé** post-déploiement
   prod.

2. **Lenteur 3-5 s wallets en local** — diagnostiquée en Phase 7.5,
   non fixée. À **mesurer en prod** après deploy Railway. Si T4 reste
   > 2 s en prod réel (cert légitime + Stripe live + chunks bundle),
   implémenter un **pre-fetch on hover** du CTA "Passer Starter" :
   `onMouseEnter` lance `createSubscriptionIntentAction`, le
   clientSecret est stocké en state local, le clic devient quasi-
   instantané. Compromis : crée des Stripe subs `incomplete` que
   Stripe garbage-collect en 24 h. Acceptable.

3. **Rip-out Satoshi global** — le DA Vizly impose **DM Sans** sur
   tous les titres, mais l'app utilise encore `font-[family-name:var(--font-satoshi)]`
   sur la totalité des H1/H2 (dashboard, settings, marketing, editor,
   billing, templates). Le rip-out nécessite :
   - Update de `CLAUDE.md` qui cite encore Satoshi comme police de titre
   - Remplacement de tous les usages de `--font-satoshi` dans le code
   - Suppression de la définition `--font-display` dans `globals.css`
   - Suppression de l'import de la font Satoshi
   **Hors périmètre Stripe — chantier UI dédié.**

4. **Mise à jour `CLAUDE.md` Vercel → Railway** — `CLAUDE.md`
   déclare encore `**Vercel** — hosting, wildcard *.vizly.fr` dans
   sa section Stack. Le vrai hosting est Railway depuis l'origine,
   ce qui a été corrigé à la volée pendant Phase 5 quand Tom me l'a
   signalé. **À faire dans une passe doc** post-chantier pour que
   le prochain Claude de session hérite de la bonne info.

5. **Backfill `subscriptions` table pour les users legacy** —
   **OPTIONNEL**. Les users payants pré-Phase-1 (créés avant le
   webhook handler Phase 3) peuvent avoir `users.plan = 'pro'` mais
   pas de row dans `subscriptions`. Le fallback `PlanCard` de
   Phase 7.5 gère ce cas gracieusement (affiche le plan + features
   + un message `Détails complets disponibles dans le portail Stripe.`).
   Si Tom veut une expérience uniforme avec `next billing` et toutes
   les infos riches pour ces users, il faudra écrire un script de
   backfill qui :
   - Liste tous les `users` avec `plan != 'free'` ET pas de row
     `subscriptions`
   - Pour chacun, récupère le `stripe_subscription_id` legacy
     (`users.stripe_subscription_id`) et fait un `stripe.subscriptions.retrieve`
   - Insert dans `subscriptions` via le helper
     `mapStripeSubscriptionToRow` existant
   **Pas critique** — la fallback UI est suffisante pour la majorité
   des cas. À faire si Tom décide d'unifier l'expérience.

6. **Test end-to-end flow `/register?plan=X` → OTP → `/dashboard?plan=X`
   → auto-open modal** — non validé en intégration complète pendant
   Phase 6 (validation Tom basée sur les flows individuels uniquement).
   Le risque : si les query params se perdent dans le redirect post-OTP
   verification, l'utilisateur arriverait sur `/dashboard` sans
   l'auto-open de la modal. Le code est en place
   (`AutoOpenSubscriptionModal` + lecture `useSearchParams` dans
   `register/page.tsx` Suspense-wrapped), mais à valider sur un vrai
   flow OTP. **Session test post-chantier dédiée.**

### C — Checklist déploiement prod (consolidée)

Tout ce qui doit être fait **avant** ou **pendant** le merge en prod.
Réuni en une seule liste actionnable depuis ce qui était éparpillé
dans les notes Phase 1-7.

**À faire ~1 semaine avant le launch (KYC)** :

1. ☐ **Activer le compte Stripe en mode live** (KYC business côté
   Dashboard Stripe — peut prendre plusieurs jours d'instruction
   selon les pièces fournies)

**À faire avant le merge prod** :

2. ☐ **Créer l'endpoint webhook mode live** sur le Stripe Dashboard
   prod en sélectionnant les **6 events suivants** (et SEULEMENT
   ces 6) :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`

   ⚠️ **NE PAS sélectionner `checkout.session.completed`** — Phase 6
   a retiré le handler de ce event. Si on l'active sur l'endpoint
   prod, le webhook handler Vizly retombera silencieusement dans la
   branche `default` (200 unknown event type), Stripe le marquera
   comme processed et on ratera potentiellement des paiements legacy
   en vol (rare mais possible).

3. ☐ Récupérer les clés `sk_live_...` et `pk_live_...` depuis le
   Stripe Dashboard, ajouter dans Railway prod env vars :
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...` (fourni au moment de la
     création de l'endpoint webhook live)

4. ☐ **Recréer les Products + Prices Stripe en mode live** (les IDs
   `price_xxx` du mode test ne fonctionnent PAS en mode live — il
   faut recréer les Products côté Dashboard Stripe en prod et
   réutiliser les nouveaux IDs). Update les env vars Railway prod :
   - `STRIPE_PRICE_STARTER=price_live_...`
   - `STRIPE_PRICE_STARTER_YEARLY=price_live_...`
   - `STRIPE_PRICE_PRO=price_live_...`
   - `STRIPE_PRICE_PRO_YEARLY=price_live_...`
   - `STRIPE_PRICE_TEMPLATE_CREATIF=price_live_...`
   - `STRIPE_PRICE_TEMPLATE_BRUTALIST=price_live_...`
   - `STRIPE_PRICE_TEMPLATE_ELEGANT=price_live_...`
   - `STRIPE_PRICE_TEMPLATE_BENTO=price_live_...`

5. ☐ **Apple Pay domain verification** — upload du fichier
   `apple-developer-merchantid-domain-association` (fourni par
   Stripe Dashboard) dans `public/.well-known/` du repo Vizly avant
   le deploy. Doit être servi à l'URL exacte
   `https://vizly.fr/.well-known/apple-developer-merchantid-domain-association`
   avec `Content-Type: text/plain`.

6. ☐ **Ajouter `vizly.fr` dans Stripe Dashboard → Settings → Payment
   methods → Apple Pay → Configure domains** (mode live) après que
   le fichier ci-dessus soit en ligne.

7. ☐ **Activer explicitement Card, Apple Pay, Google Pay, Link en
   mode live** dans Stripe Dashboard → Settings → Payment methods.
   La config est **indépendante du mode test** — ce qui est activé
   en test n'est PAS automatiquement activé en live.

8. ☐ **Cutover Phase 6** : si l'endpoint webhook prod existait avant
   et avait `checkout.session.completed` activé, le **désactiver
   d'abord** dans le Stripe Dashboard, **attendre ~1 h** que les
   éventuelles Checkout Sessions hosted en vol expirent (rare mais
   possible si des users legacy sont dans le flow), **puis** merger
   et déployer Phase 6+. Si l'endpoint est créé from scratch en mode
   live (point 2), ce cutover est sans objet.

9. ☐ **Test end-to-end en prod** avec une vraie carte (Tom) :
   - User free → `/billing` → "Passer Starter" → modal → vraie carte
     → confirmation → vérifier que `users.plan` passe à `starter` et
     que la row `subscriptions` est créée
   - User Starter → `/billing` → "Passer Pro" (changeSubscriptionPlanAction
     in-place) → vérifier que la sub est upgradée sans nouvelle
     subscription, que la facture proratée arrive
   - Achat template → `/editor` Step 3 → "Acheter Bento" → modal →
     vraie carte → vérifier que `purchased_templates` est rempli
   - Vérifier que les emails Resend partent correctement
     (welcome, payment-succeeded, plan-changed)

10. ☐ **Mesurer T4 (latence wallets) en prod** dans Chrome DevTools
    Network. Si T4 reste > 2 s, implémenter le pre-fetch on hover du
    CTA (cf. dette technique #2). Si T4 < 1.5 s, on laisse tel quel.

### Prochaines étapes (hors sprint Stripe)

Quand Tom décidera de partir en prod :

- Créer une session **"déploiement prod Stripe Vizly"** dédiée
- Suivre la checklist (C) point par point
- Push final de la branche `main` vers le remote (le seul push de
  tout le chantier)
- Deploy Railway via la CI normale
- Smoke test live avec une carte personnelle Tom
- Si T4 > 2 s mesuré → ouvrir une session courte pour le pre-fetch
- Une fois stable en prod, **clôturer ce fichier** STRIPE_MIGRATION_NOTES.md
  (l'archiver ou le supprimer selon préférence — il a fait son boulot,
  les décisions sont commit dans git pour la postérité)
