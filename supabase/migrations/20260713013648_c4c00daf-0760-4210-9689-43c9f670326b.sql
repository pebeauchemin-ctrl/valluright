begin;

alter table public.advisor_invites enable row level security;

revoke all on table public.advisor_invites from anon;
revoke all on table public.advisor_invites from authenticated;
grant select, insert, update, delete on table public.advisor_invites to authenticated;

drop policy if exists "owners manage advisor invites for own businesses" on public.advisor_invites;
drop policy if exists "advisors can view their invites" on public.advisor_invites;
drop policy if exists "advisors can update their invites" on public.advisor_invites;
drop policy if exists "linked advisors can read their invites" on public.advisor_invites;

create policy "owners manage advisor invites for own businesses"
  on public.advisor_invites
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = advisor_invites.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.businesses b
      where b.id = advisor_invites.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "linked advisors can read their invites"
  on public.advisor_invites
  for select
  to authenticated
  using (
    advisor_id = auth.uid()
  );

comment on table public.advisor_invites is
  'Advisor invite emails are owner-scoped. Authenticated users cannot read invite rows by matching advisor_email; advisor reads require advisor_id linkage.';

notify pgrst, 'reload schema';

commit;