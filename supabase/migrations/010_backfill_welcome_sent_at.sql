-- Backfill welcome_sent_at for users created BEFORE migration 009.
--
-- Without this, an existing user re-passing through the auth callback
-- (magic link, password reset, etc.) would trigger the Welcome custom
-- email weeks or months after their original signup — confusing.
--
-- Setting welcome_sent_at = created_at flags every existing user as
-- "already welcomed", so the atomic UPDATE … WHERE welcome_sent_at IS
-- NULL in the callback handler will skip them on every future hit.
--
-- New users (post-migration) will keep welcome_sent_at NULL until their
-- first email confirmation, where the callback will atomically claim it
-- and fire the Welcome.

update public.users
  set welcome_sent_at = created_at
  where welcome_sent_at is null;
