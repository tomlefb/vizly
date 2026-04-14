-- Add last_renewal_reminder_sent_at to users for the J-7 renewal reminder
-- cron's idempotence check.
--
-- The cron at /api/cron/renewal-reminder uses an atomic UPDATE … WHERE
-- last_renewal_reminder_sent_at IS NULL OR < now() - 6 days pattern to
-- claim a "lock" before sending the email. This protects against:
--   (a) double-send if the Railway cron drifts and fires twice within
--       the same calendar day (Railway docs warn about ~few minutes drift)
--   (b) double-send if two cron runs race in parallel (shouldn't happen
--       but defensive)
--
-- The 6-day cooldown allows the column to reset naturally for next year:
-- a user who renews annually gets a reminder ~7 days before each
-- renewal, and the previous send is well outside the 6-day window by then.
--
-- New users get NULL = "never sent". No backfill needed.

alter table public.users
  add column if not exists last_renewal_reminder_sent_at timestamptz;
