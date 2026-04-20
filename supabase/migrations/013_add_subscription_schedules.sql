-- Migration 013 — Ajout de la gestion des Stripe Subscription Schedules
--
-- Contexte : le flow Vizly "downgrade à la fin de période" passe désormais
-- par un Stripe Subscription Schedule (phase 1 = plan courant jusqu'au
-- period_end, phase 2 = nouveau plan après period_end). Au clic Downgrade,
-- la phase 2 est programmée et les items de la subscription ne changent
-- qu'au bascule. On stocke ici l'ID du schedule + un snapshot du plan
-- cible ("pending_*") pour pouvoir afficher "Ton plan passera en X le {date}"
-- dans l'UI /billing sans round-trip Stripe.
--
-- Les colonnes sont toutes nullable : aucune sub existante n'a de schedule
-- actif, et la majorité n'en aura jamais un.

alter table public.subscriptions
  add column if not exists stripe_schedule_id text,
  add column if not exists pending_plan plan_type,
  add column if not exists pending_interval text
    check (pending_interval is null or pending_interval in ('monthly', 'yearly')),
  add column if not exists pending_effective_at timestamptz;

-- Un schedule Stripe ↔ une seule sub locale. Unique pour détecter les
-- doublons applicatifs (idempotence : re-click Downgrade ne doit pas créer
-- un 2ème schedule).
create unique index if not exists idx_subscriptions_stripe_schedule_id
  on public.subscriptions(stripe_schedule_id)
  where stripe_schedule_id is not null;

-- Invariant applicatif : les 4 colonnes pending vivent ensemble ou pas.
-- Soit toutes nulles (pas de downgrade programmé), soit toutes remplies.
alter table public.subscriptions
  add constraint subscriptions_pending_coherence
  check (
    (stripe_schedule_id is null
     and pending_plan is null
     and pending_interval is null
     and pending_effective_at is null)
    or
    (stripe_schedule_id is not null
     and pending_plan is not null
     and pending_interval is not null
     and pending_effective_at is not null)
  );
