-- REB-48: Review public SECURITY DEFINER grants.
--
-- Public SECURITY DEFINER execution is intentionally limited to the two RPCs
-- needed by the public teaser page:
--   - get_public_teaser(public_id): returns only buyer-safe published teaser data.
--   - submit_buyer_access_request(...): creates a buyer lead for a published teaser.
--
-- Helper and trigger functions should not be directly executable by anon/public
-- users. This migration makes those grants explicit so default EXECUTE grants do
-- not leave sensitive helpers callable.

begin;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;
grant execute on function public.handle_new_user() to service_role;

revoke all on function public.has_role(uuid, public.app_role) from public;
revoke all on function public.has_role(uuid, public.app_role) from anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to service_role;

revoke all on function public.is_advisor_of(uuid, uuid) from public;
revoke all on function public.is_advisor_of(uuid, uuid) from anon;
grant execute on function public.is_advisor_of(uuid, uuid) to authenticated;
grant execute on function public.is_advisor_of(uuid, uuid) to service_role;

revoke all on function public.advisor_permission_rank(text) from public;
revoke all on function public.advisor_permission_rank(text) from anon;
grant execute on function public.advisor_permission_rank(text) to authenticated;
grant execute on function public.advisor_permission_rank(text) to service_role;

revoke all on function public.can_advisor_access(uuid, uuid, text) from public;
revoke all on function public.can_advisor_access(uuid, uuid, text) from anon;
grant execute on function public.can_advisor_access(uuid, uuid, text) to authenticated;
grant execute on function public.can_advisor_access(uuid, uuid, text) to service_role;

revoke all on function public.user_owns_business_path(text) from public;
revoke all on function public.user_owns_business_path(text) from anon;
grant execute on function public.user_owns_business_path(text) to authenticated;
grant execute on function public.user_owns_business_path(text) to service_role;

revoke all on function public.get_public_teaser(text) from public;
grant execute on function public.get_public_teaser(text) to anon, authenticated;
comment on function public.get_public_teaser(text) is
  'Intentional public SECURITY DEFINER RPC. Returns only buyer-safe fields for published teaser pages and omits internal business ids.';

revoke all on function public.submit_buyer_access_request(
  text,
  text,
  text,
  text,
  public.buyer_type,
  public.financing_status,
  text
) from public;
grant execute on function public.submit_buyer_access_request(
  text,
  text,
  text,
  text,
  public.buyer_type,
  public.financing_status,
  text
) to anon, authenticated;
comment on function public.submit_buyer_access_request(
  text,
  text,
  text,
  text,
  public.buyer_type,
  public.financing_status,
  text
) is
  'Intentional public SECURITY DEFINER RPC. Inserts buyer access requests only for published teasers and does not expose stored PII.';

commit;
