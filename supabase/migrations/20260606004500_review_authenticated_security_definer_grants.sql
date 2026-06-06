-- REB-49: Review signed-in SECURITY DEFINER grants.
--
-- Authenticated execution is intentionally retained only where the app or RLS
-- policies need it. Helper functions that accept a user id must not let a
-- signed-in caller ask questions about another user's access.

begin;

create or replace function public.can_advisor_access(
  _business_id uuid,
  _user_id uuid,
  _minimum_permission text default 'view_only'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.advisor_invites i
    where i.business_id = _business_id
      and i.advisor_id = _user_id
      and i.status = 'accepted'
      and (
        _user_id = auth.uid()
        or auth.role() = 'service_role'
      )
      and public.advisor_permission_rank(i.permission_level) >= public.advisor_permission_rank(_minimum_permission)
  )
$$;

create or replace function public.is_advisor_of(_business_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_advisor_access(_business_id, _user_id, 'view_only')
$$;

revoke all on function public.has_role(uuid, public.app_role) from authenticated;
grant execute on function public.has_role(uuid, public.app_role) to service_role;
comment on function public.has_role(uuid, public.app_role) is
  'Service-role/admin helper only. Authenticated users must not call this SECURITY DEFINER function directly for arbitrary user ids.';

revoke all on function public.handle_new_user() from authenticated;
grant execute on function public.handle_new_user() to service_role;
comment on function public.handle_new_user() is
  'Auth trigger function. Not intended for direct authenticated execution.';

revoke all on function public.can_advisor_access(uuid, uuid, text) from public;
revoke all on function public.can_advisor_access(uuid, uuid, text) from anon;
grant execute on function public.can_advisor_access(uuid, uuid, text) to authenticated;
grant execute on function public.can_advisor_access(uuid, uuid, text) to service_role;
comment on function public.can_advisor_access(uuid, uuid, text) is
  'Intentional authenticated SECURITY DEFINER helper for RLS policies. Direct calls only return true for the caller''s own user id unless executed by service_role.';

revoke all on function public.is_advisor_of(uuid, uuid) from public;
revoke all on function public.is_advisor_of(uuid, uuid) from anon;
grant execute on function public.is_advisor_of(uuid, uuid) to authenticated;
grant execute on function public.is_advisor_of(uuid, uuid) to service_role;
comment on function public.is_advisor_of(uuid, uuid) is
  'Intentional authenticated SECURITY DEFINER helper for advisor RLS policies. Delegates to can_advisor_access, which enforces caller identity.';

revoke all on function public.user_owns_business_path(text) from public;
revoke all on function public.user_owns_business_path(text) from anon;
grant execute on function public.user_owns_business_path(text) to authenticated;
grant execute on function public.user_owns_business_path(text) to service_role;
comment on function public.user_owns_business_path(text) is
  'Intentional authenticated SECURITY DEFINER helper for private data-room storage policies. It checks the path business id against auth.uid().';

comment on function public.get_public_teaser(text) is
  'Intentional public/authenticated SECURITY DEFINER RPC. Returns only buyer-safe fields for published teaser pages and omits internal business ids.';

comment on function public.submit_buyer_access_request(
  text,
  text,
  text,
  text,
  public.buyer_type,
  public.financing_status,
  text
) is
  'Intentional public/authenticated SECURITY DEFINER RPC. Inserts buyer access requests only for published teasers and returns only the new request id.';

commit;
