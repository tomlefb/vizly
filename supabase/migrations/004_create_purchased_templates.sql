create table public.purchased_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  template_id text not null,
  stripe_payment_id text not null,
  purchased_at timestamptz not null default now(),
  unique(user_id, template_id)
);

create index idx_purchased_templates_user_id on public.purchased_templates(user_id);
