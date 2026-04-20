-- Migration 014 — Table page_views (versionnage rétrospectif)
--
-- La table `page_views` existait déjà en prod (créée à la main via le
-- Dashboard Supabase à une époque antérieure) mais n'avait jamais été
-- intégrée aux migrations. Ce fichier la décrit pour :
--   1. Que tout nouvel env (dev, staging, branche Supabase) la provisionne
--      automatiquement sans devoir la re-créer à la main.
--   2. Versionner les policies RLS associées (INSERT public + SELECT owner).
--
-- IF NOT EXISTS partout → safe à ré-appliquer sur la prod existante.

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  path text,
  referrer text,
  country text
);

-- Index sur portfolio_id + viewed_at pour les agrégations du dashboard
-- statistiques (filtrage 30 derniers jours, comptage par portefolio).
create index if not exists idx_page_views_portfolio_viewed_at
  on public.page_views(portfolio_id, viewed_at desc);

alter table public.page_views enable row level security;

-- Policy INSERT : anonyme autorisé (les vues des portfolios publics doivent
-- pouvoir être trackées sans auth). Le serveur utilise de toute façon le
-- service_role depuis /api/track-view, mais cette policy couvre le cas où
-- un client anon insérerait directement.
do $$
begin
  if not exists (
    select 1 from pg_policy
    where polname = 'Anyone can insert page views'
      and polrelid = 'public.page_views'::regclass
  ) then
    create policy "Anyone can insert page views" on public.page_views
      for insert with check (true);
  end if;
end $$;

-- Policy SELECT : owner only. Un user peut lire les vues de SES portfolios
-- via la page /statistiques. Les autres vues restent privées.
do $$
begin
  if not exists (
    select 1 from pg_policy
    where polname = 'Users can read own portfolio views'
      and polrelid = 'public.page_views'::regclass
  ) then
    create policy "Users can read own portfolio views" on public.page_views
      for select using (
        exists (
          select 1 from public.portfolios
          where portfolios.id = page_views.portfolio_id
            and portfolios.user_id = auth.uid()
        )
      );
  end if;
end $$;
