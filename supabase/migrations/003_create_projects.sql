create table public.projects (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  title text not null,
  description text,
  images jsonb not null default '[]'::jsonb,
  external_link text,
  tags jsonb not null default '[]'::jsonb,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_projects_portfolio_id on public.projects(portfolio_id);
