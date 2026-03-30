-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.portfolios enable row level security;
alter table public.projects enable row level security;
alter table public.purchased_templates enable row level security;

-- Users: can read/update own row
create policy "Users can read own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own data" on public.users
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Portfolios: owner can CRUD, anyone can read published
create policy "Anyone can read published portfolios" on public.portfolios
  for select using (published = true);

create policy "Owner can read own portfolios" on public.portfolios
  for select using (auth.uid() = user_id);

create policy "Owner can insert portfolios" on public.portfolios
  for insert with check (auth.uid() = user_id);

create policy "Owner can update own portfolios" on public.portfolios
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owner can delete own portfolios" on public.portfolios
  for delete using (auth.uid() = user_id);

-- Projects: access through portfolio ownership, anyone can read if portfolio is published
create policy "Anyone can read projects of published portfolios" on public.projects
  for select using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = projects.portfolio_id
      and portfolios.published = true
    )
  );

create policy "Owner can read own projects" on public.projects
  for select using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = projects.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Owner can insert projects" on public.projects
  for insert with check (
    exists (
      select 1 from public.portfolios
      where portfolios.id = projects.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Owner can update own projects" on public.projects
  for update using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = projects.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Owner can delete own projects" on public.projects
  for delete using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = projects.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

-- Purchased templates: owner can read own
create policy "Users can read own purchased templates" on public.purchased_templates
  for select using (auth.uid() = user_id);

create policy "Users can insert own purchased templates" on public.purchased_templates
  for insert with check (auth.uid() = user_id);
