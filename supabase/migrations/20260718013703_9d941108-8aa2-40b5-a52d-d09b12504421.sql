create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free','essentials','exit-ready','advisor-partner','one-time-report')),
  status text not null default 'free' check (status in ('free','active','trialing','past_due','canceled','unpaid','incomplete','incomplete_expired')),
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
drop policy if exists "Users can read their subscription" on public.subscriptions;
create policy "Users can read their subscription" on public.subscriptions for select to authenticated using (user_id = auth.uid());

create table if not exists public.billing_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text
);
grant all on public.billing_webhook_events to service_role;
alter table public.billing_webhook_events enable row level security;

notify pgrst, 'reload schema';