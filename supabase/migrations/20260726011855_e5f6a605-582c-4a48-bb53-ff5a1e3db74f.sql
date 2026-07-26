create or replace function public.get_my_advisor_invites()
returns table (
  id uuid,
  business_id uuid,
  advisor_role text,
  permission_level text,
  status public.advisor_invite_status,
  invited_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    i.id,
    i.business_id,
    i.advisor_role,
    i.permission_level,
    i.status,
    i.invited_at
  from public.advisor_invites i
  where i.advisor_id = auth.uid()
    and i.status = 'accepted'
  order by i.invited_at desc;
$$;

revoke all on function public.get_my_advisor_invites() from public;
revoke all on function public.get_my_advisor_invites() from anon;
grant execute on function public.get_my_advisor_invites() to authenticated;

comment on function public.get_my_advisor_invites() is
  'Returns only accepted advisor invitations linked to the authenticated caller.';