-- =============================================================================
-- Migration 012 — Stripe Elements foundations
-- =============================================================================
-- Local DB plumbing required to migrate from Stripe Checkout (hosted) to
-- Stripe Elements (in-app PaymentElement). Three new tables:
--
--   subscriptions   — local cache of Stripe Subscription state. Lets
--                     /billing render the current plan, next billing date,
--                     cancel_at_period_end, etc. without hitting Stripe.
--   invoices        — local cache of paid invoices (number, hosted_url, PDF).
--                     Powers the invoice history list in /billing without
--                     a live Stripe round-trip per page load.
--   webhook_events  — idempotence log keyed by stripe_event_id. The webhook
--                     handler INSERT … ON CONFLICT DO NOTHING here BEFORE
--                     dispatching, so a Stripe retry of the same event_id
--                     becomes a no-op. Fixes audit debt #3.
--
-- Also tightens public.users:
--   - UNIQUE (stripe_customer_id)              — audit debt #6
--   - INDEX  (stripe_subscription_id)          — audit debt #7
--
-- All three new tables enable RLS. subscriptions/invoices grant SELECT on
-- the user's own row; INSERT/UPDATE/DELETE are intentionally absent — those
-- happen via createAdminClient() in the Stripe webhook handler, which uses
-- the service_role key and bypasses RLS by design. webhook_events has no
-- client policies at all (service_role only).
--
-- RLS convention note (consistent with migration 005_rls_policies.sql):
-- Vizly does NOT add explicit "Service role can manage X" policies on any
-- table. We rely on the Postgres-level rolbypassrls=true attribute that
-- Supabase ships on the service_role role. Adding redundant policies would
-- diverge from the existing convention and add maintenance noise without
-- changing behavior. Verified at migration time:
--   select rolname, rolbypassrls from pg_roles where rolname = 'service_role';
--   → service_role | true
--
-- WARNING: the UNIQUE on users.stripe_customer_id will fail if any two
-- existing users currently share the same stripe_customer_id. PostgreSQL
-- allows multiple NULLs under UNIQUE, so free users (NULL) are fine.
-- Pre-flight check before applying:
--   select stripe_customer_id, count(*)
--     from public.users
--     where stripe_customer_id is not null
--     group by stripe_customer_id
--     having count(*) > 1;

-- -----------------------------------------------------------------------------
-- 1. subscriptions
-- -----------------------------------------------------------------------------

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  status text not null check (status in (
    'active',
    'trialing',
    'past_due',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'unpaid'
  )),
  plan plan_type not null,
  interval text not null check (interval in ('monthly', 'yearly')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reuse update_updated_at() from migration 002 for the updated_at trigger.
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.update_updated_at();

-- user_id is already indexed by the UNIQUE constraint above (auto-btree).
-- stripe_subscription_id is already indexed by its UNIQUE constraint.
-- No additional indexes needed on this table.

-- -----------------------------------------------------------------------------
-- 2. invoices
-- -----------------------------------------------------------------------------

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_invoice_id text not null unique,
  stripe_subscription_id text,
  number text,
  amount_paid integer not null,
  currency text not null default 'eur',
  status text not null,
  hosted_invoice_url text,
  invoice_pdf text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_invoices_user_id on public.invoices(user_id);
create index idx_invoices_stripe_subscription_id
  on public.invoices(stripe_subscription_id)
  where stripe_subscription_id is not null;

-- -----------------------------------------------------------------------------
-- 3. webhook_events (idempotence log)
-- -----------------------------------------------------------------------------

create table public.webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb
);

-- -----------------------------------------------------------------------------
-- 4. users — UNIQUE + index on Stripe identifiers (debts #6 and #7)
-- -----------------------------------------------------------------------------

-- UNIQUE on stripe_customer_id auto-creates a btree index, so we don't add
-- a redundant idx_users_stripe_customer_id on top. Lookups by customer_id
-- (e.g. webhook fallback in resolveUserIdFromSubscription) will use this
-- constraint's underlying index transparently.
alter table public.users
  add constraint users_stripe_customer_id_key unique (stripe_customer_id);

create index idx_users_stripe_subscription_id
  on public.users(stripe_subscription_id)
  where stripe_subscription_id is not null;

-- -----------------------------------------------------------------------------
-- 5. RLS
-- -----------------------------------------------------------------------------

alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.webhook_events enable row level security;

-- subscriptions: read-only self. Mutations happen via service_role in the
-- Stripe webhook handler.
create policy "Users can read own subscription"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- invoices: read-only self. Same model — webhook writes via service_role.
create policy "Users can read own invoices"
  on public.invoices
  for select
  using (auth.uid() = user_id);

-- webhook_events: NO client-facing policy on purpose. service_role bypasses
-- RLS, which is exactly what the webhook handler needs. Authenticated
-- clients should never see Stripe event payloads (they may contain
-- sensitive billing metadata).
