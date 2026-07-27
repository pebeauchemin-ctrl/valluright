-- Restore the advisor review helper functions required by comment saving.
-- This is safe to run where the prior hardening migration was applied or skipped.

begin;

create or replace function public.advisor_permission_rank(_permission_level text)
returns int
language sql
immutable
set search_path = public
as $$
  select case _permission_level
    when 'view_only' then 10
    when 'comment' then 20
    when 'edit_assumptions' then 30
    when 'approve' then 40
    else 0
  end
$$;

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
      and (_user_id = auth.uid() or auth.role() = 'service_role')
      and public.advisor_permission_rank(i.permission_level) >=
        public.advisor_permission_rank(_minimum_permission)
  )
$$;

create or replace function public.record_advisor_review(
  _business_id uuid,
  _body text,
  _review_status text default 'comment'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_status text := lower(trim(coalesce(_review_status, 'comment')));
  comment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in before recording advisor feedback.';
  end if;

  if length(trim(coalesce(_body, ''))) = 0 then
    raise exception 'Enter feedback before saving.';
  end if;

  if length(trim(_body)) > 5000 then
    raise exception 'Feedback must be 5,000 characters or fewer.';
  end if;

  if normalized_status not in ('comment', 'reviewing', 'changes_requested', 'approved') then
    raise exception 'Invalid advisor review status.';
  end if;

  if not public.can_advisor_access(_business_id, auth.uid(), 'comment') then
    raise exception 'Your advisor access does not allow comments for this business.';
  end if;

  if normalized_status = 'approved'
    and not public.can_advisor_access(_business_id, auth.uid(), 'approve') then
    raise exception 'Only advisors with approval permission can mark a review complete.';
  end if;

  insert into public.advisor_comments (
    business_id,
    author_id,
    body,
    review_status,
    is_approval
  )
  values (
    _business_id,
    auth.uid(),
    trim(_body),
    normalized_status,
    normalized_status = 'approved'
  )
  returning id into comment_id;

  return comment_id;
end;
$$;

revoke all on function public.can_advisor_access(uuid, uuid, text) from public;
revoke all on function public.can_advisor_access(uuid, uuid, text) from anon;
grant execute on function public.can_advisor_access(uuid, uuid, text) to authenticated, service_role;

revoke all on function public.record_advisor_review(uuid, text, text) from public;
revoke all on function public.record_advisor_review(uuid, text, text) from anon;
grant execute on function public.record_advisor_review(uuid, text, text) to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
