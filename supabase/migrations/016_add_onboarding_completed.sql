-- Add onboarding_completed to public.users so the dashboard can auto-launch
-- the guided tour exactly once per user. The flag is flipped to true by a
-- server action when the user either finishes the tour or dismisses it.
--
-- Existing users (created before this migration) are backfilled to true:
-- they already know the dashboard and should not be interrupted with a
-- tour for features they've been using.

alter table public.users
  add column if not exists onboarding_completed boolean not null default false;

update public.users
  set onboarding_completed = true
  where created_at < now();
