-- Add published_at to portfolios so we can detect a portfolio's first publication
-- vs subsequent re-publications. Used by the transactional email pipeline to
-- send a "Portfolio published" email exactly once.

alter table public.portfolios
  add column if not exists published_at timestamptz;

-- Backfill: portfolios already published before this migration get
-- published_at = created_at (more honest than now() — avoids spamming
-- existing users with congratulations emails the day this ships).
update public.portfolios
  set published_at = created_at
  where published = true
    and published_at is null;

create index if not exists idx_portfolios_published_at
  on public.portfolios(published_at)
  where published_at is not null;
