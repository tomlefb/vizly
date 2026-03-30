create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  slug text unique,
  title text not null default '',
  bio text,
  photo_url text,
  template text not null default 'minimal',
  primary_color text not null default '#E8553D',
  secondary_color text not null default '#1A1A1A',
  font text not null default 'DM Sans',
  social_links jsonb default '{}'::jsonb,
  contact_email text,
  published boolean not null default false,
  custom_domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger portfolios_updated_at
  before update on public.portfolios
  for each row execute function public.update_updated_at();

-- Index for slug lookup (public portfolio pages)
create index idx_portfolios_slug on public.portfolios(slug) where slug is not null;
create index idx_portfolios_user_id on public.portfolios(user_id);
