begin;

alter table public.advisor_invites
  add column if not exists invite_email_last_sent_at timestamptz,
  add column if not exists invite_email_last_attempt_at timestamptz,
  add column if not exists invite_email_last_error text;

alter table public.advisor_invites
  drop constraint if exists advisor_invites_invite_email_last_error_length;

alter table public.advisor_invites
  add constraint advisor_invites_invite_email_last_error_length
  check (invite_email_last_error is null or char_length(invite_email_last_error) <= 500);

create or replace function public.decline_advisor_invite(_invite_id uuid)
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
    raise exception 'Sign in with the invited email address before declining this invite.';
  end if;

  select * into invite_row
  from public.advisor_invites
  where id = _invite_id;

  if not found then
    raise exception 'Advisor invitation not found.';
  end if;

  if lower(invite_row.advisor_email) <> caller_email then
    raise exception 'This invitation was sent to a different email address.';
  end if;

  if invite_row.status = 'accepted' then
    raise exception 'This advisor invitation has already been accepted.';
  end if;

  if invite_row.status = 'revoked' then
    raise exception 'This advisor invitation has been revoked.';
  end if;

  update public.advisor_invites
  set status = 'declined', responded_at = coalesce(responded_at, now())
  where id = _invite_id;

  return jsonb_build_object('invite_id', invite_row.id, 'status', 'declined');
end;
$$;

revoke all on function public.decline_advisor_invite(uuid) from public;
revoke all on function public.decline_advisor_invite(uuid) from anon;
grant execute on function public.decline_advisor_invite(uuid) to authenticated;
grant execute on function public.decline_advisor_invite(uuid) to service_role;

comment on function public.decline_advisor_invite(uuid) is
  'Authenticated advisor invite decline RPC. It only changes an invite when the caller email matches the invite recipient.';

notify pgrst, 'reload schema';

commit;