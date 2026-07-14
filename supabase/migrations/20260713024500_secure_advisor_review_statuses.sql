-- REB-67: Keep advisor review status attributable to the accepted advisor.

begin;

alter table public.advisor_comments
  add column if not exists review_status text not null default 'comment';

alter table public.advisor_comments
  drop constraint if exists advisor_comments_review_status_check;

alter table public.advisor_comments
  add constraint advisor_comments_review_status_check
  check (review_status in ('comment', 'reviewing', 'changes_requested', 'approved'));

-- Historic owner-entered notes are not advisor approvals. Preserve the note, but
-- remove the misleading approval state before deriving remaining historic statuses.
update public.advisor_comments c
set
  review_status = 'comment',
  is_approval = false
from public.businesses b
where b.id = c.business_id
  and b.owner_id = c.author_id;

update public.advisor_comments
set review_status = case
  when is_approval then 'approved'
  when body ~* '^changes requested:' then 'changes_requested'
  when body ~* '^reviewing:' then 'reviewing'
  else 'comment'
end;

revoke insert, update, delete on table public.advisor_comments from authenticated;

drop policy if exists "advisors create comments on assigned businesses" on public.advisor_comments;

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

revoke all on function public.record_advisor_review(uuid, text, text) from public;
revoke all on function public.record_advisor_review(uuid, text, text) from anon;
grant execute on function public.record_advisor_review(uuid, text, text) to authenticated;
grant execute on function public.record_advisor_review(uuid, text, text) to service_role;

comment on function public.record_advisor_review(uuid, text, text) is
  'Authenticated advisor feedback RPC. Only an accepted advisor with approve permission can record an approved review status.';

notify pgrst, 'reload schema';

commit;
