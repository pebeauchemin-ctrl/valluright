-- REB-45: Restrict advisor invite email visibility to scoped recipients.
--
-- The previous advisor read policy allowed any authenticated user whose login
-- email matched advisor_email to read the invite row. That exposed invite email
-- and business-association metadata before an advisor account was explicitly
-- linked to the invite.
--
-- Owners can still manage invites for their own businesses. Advisors can read
-- invite records only after the invite is linked to their auth user id.

begin;

alter table public.advisor_invites enable row level security;

revoke all on table public.advisor_invites from anon;
revoke all on table public.advisor_invites from authenticated;
grant select, insert, update, delete on table public.advisor_invites to authenticated;

drop policy if exists "owners manage advisor invites for own businesses" on public.advisor_invites;
drop policy if exists "advisors can view their invites" on public.advisor_invites;
drop policy if exists "advisors can update their invites" on public.advisor_invites;

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

commit;
