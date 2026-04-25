
-- Fix: set search_path on touch_updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tighten buyer_access_requests insert: only against published teasers
drop policy if exists "anyone can submit access request" on public.buyer_access_requests;

create policy "anyone can request access to published business"
  on public.buyer_access_requests for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.buyer_view_settings s
      where s.business_id = buyer_access_requests.business_id
        and s.is_published = true
    )
  );
