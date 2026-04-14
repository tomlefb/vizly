-- Add welcome_sent_at to public.users so the auth callback can fire the
-- Vizly Welcome custom email exactly once per user (idempotent flag).
--
-- The flag is set BEFORE the email is sent, via an atomic UPDATE …
-- WHERE welcome_sent_at IS NULL pattern. This protects against:
--   (a) double-send if the user clicks the confirmation link twice
--   (b) double-send if two callback requests race in parallel
--
-- Existing users (created before this migration) keep welcome_sent_at = NULL.
-- We deliberately do NOT backfill them with now() — they would then never
-- receive a Welcome retroactively, but that's the desired behaviour:
-- they have already onboarded without one, sending a "welcome" weeks later
-- would be confusing.
--
-- For OAuth Google users, the callback explicitly skips Welcome via a
-- provider check (only `app_metadata.provider === 'email'` triggers it).
-- Their welcome_sent_at stays NULL forever, which is fine.

alter table public.users
  add column if not exists welcome_sent_at timestamptz;
