# STRIPE_MIGRATION_NOTES

Notes au fil de l'eau sur la migration Stripe Checkout → Stripe Elements.
Ce fichier capture tout ce qui sort du périmètre strict des 7 phases mais
mérite d'être tracé pour ne pas être perdu. Sera nettoyé en fin de Phase 7.

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
  bump Stripe. Hors périmètre Stripe (probablement dans une dépendance
  transitive non liée). À investiguer dans un audit sécu séparé via
  `npm audit`.

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
