-- REB-40: "Join the pilot" screener responses.
-- Insert-only for anon/authenticated visitors. No public read/update/delete:
-- only service_role (Supabase dashboard / admin) can read rows.

begin;

create table if not exists public.pilot_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  role text not null check (char_length(role) <= 200),
  owner_industry text check (char_length(owner_industry) <= 200),
  owner_revenue text check (char_length(owner_revenue) <= 50),
  advisor_deal_volume text check (char_length(advisor_deal_volume) <= 50),
  sale_timeline text not null check (char_length(sale_timeline) <= 50),
  has_financials text not null check (char_length(has_financials) <= 50),
  can_join_calls text not null check (char_length(can_join_calls) <= 50)
);

alter table public.pilot_applications enable row level security;

revoke all on public.pilot_applications from anon, authenticated;
grant insert on public.pilot_applications to anon, authenticated;

drop policy if exists "pilot_applications_insert_only" on public.pilot_applications;
create policy "pilot_applications_insert_only"
  on public.pilot_applications
  for insert
  to anon, authenticated
  with check (true);

commit;
