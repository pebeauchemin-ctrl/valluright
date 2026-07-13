-- REB-66: Link an invited advisor to their own authenticated account.
--
-- The invite id is safe to share as an acceptance link because this function
-- also verifies that the signed-in user's email is the invite recipient.

begin;

create or replace function public.accept_advisor_invite(_invite_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.advisor_invites%rowtype;
  caller_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or caller_email = '' then
    raise exception 'Sign in with the invited email address before accepting this invite.';
  end if;

  select *
  into invite_row
  from public.advisor_invites
  where id = _invite_id;

  if not found then
    raise exception 'Advisor invitation not found.';
  end if;

  if lower(invite_row.advisor_email) <> caller_email then
    raise exception 'This invitation was sent to a different email address.';
  end if;

  if exists (
    select 1
    from public.businesses b
    where b.id = invite_row.business_id
      and b.owner_id = auth.uid()
  ) then
    raise exception 'Business owners cannot accept their own advisor invitation.';
  end if;

  if invite_row.status = 'revoked' then
    raise exception 'This advisor invitation has been revoked.';
  end if;

  if invite_row.status = 'declined' then
    raise exception 'This advisor invitation was declined. Ask the owner to create a new invitation.';
  end if;

  if invite_row.advisor_id is not null and invite_row.advisor_id <> auth.uid() then
    raise exception 'This advisor invitation has already been accepted by another account.';
  end if;

  update public.advisor_invites
  set
    advisor_id = auth.uid(),
    status = 'accepted',
    responded_at = coalesce(responded_at, now())
  where id = _invite_id;

  return jsonb_build_object(
    'invite_id', invite_row.id,
    'business_id', invite_row.business_id,
    'permission_level', invite_row.permission_level
  );
end;
$$;

revoke all on function public.accept_advisor_invite(uuid) from public;
revoke all on function public.accept_advisor_invite(uuid) from anon;
grant execute on function public.accept_advisor_invite(uuid) to authenticated;
grant execute on function public.accept_advisor_invite(uuid) to service_role;

comment on function public.accept_advisor_invite(uuid) is
  'Authenticated advisor invite acceptance RPC. It only links an invite when the caller email matches the invite recipient and rejects owner self-acceptance.';

grant select, insert on table public.advisor_comments to authenticated;

notify pgrst, 'reload schema';

commit;
