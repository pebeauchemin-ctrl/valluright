begin;

revoke execute on function public.user_owns_business_path(text) from public;
revoke execute on function public.user_owns_business_path(text) from anon;
grant execute on function public.user_owns_business_path(text) to authenticated;
grant execute on function public.user_owns_business_path(text) to service_role;

commit;