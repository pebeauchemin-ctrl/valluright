-- REB-79: Provide advisors a reviewable workpaper and section-linked feedback.

begin;

alter table public.advisor_comments
  add column if not exists section_key text not null default 'general';

alter table public.advisor_comments
  drop constraint if exists advisor_comments_section_key_check;

alter table public.advisor_comments
  add constraint advisor_comments_section_key_check
  check (
    section_key in (
      'general',
      'financials',
      'normalization',
      'balance_sheet',
      'methodology',
      'health_score'
    )
  );

drop function if exists public.record_advisor_review(uuid, text, text);
drop function if exists public.record_advisor_review(uuid, text, text, text);

create function public.record_advisor_review(
  _business_id uuid,
  _body text,
  _review_status text default 'comment',
  _section_key text default 'general'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_status text := lower(trim(coalesce(_review_status, 'comment')));
  normalized_section text := lower(trim(coalesce(_section_key, 'general')));
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

  if normalized_section not in (
    'general',
    'financials',
    'normalization',
    'balance_sheet',
    'methodology',
    'health_score'
  ) then
    raise exception 'Invalid advisor comment section.';
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
    section_key,
    is_approval
  )
  values (
    _business_id,
    auth.uid(),
    trim(_body),
    normalized_status,
    normalized_section,
    normalized_status = 'approved'
  )
  returning id into comment_id;

  return comment_id;
end;
$$;

drop policy if exists "advisors view valuation method results" on public.valuation_method_results;
create policy "advisors view valuation method results"
  on public.valuation_method_results
  for select
  to authenticated
  using (public.can_advisor_access(business_id, auth.uid(), 'view_only'));

grant select on table public.valuation_method_results to authenticated;

revoke all on function public.record_advisor_review(uuid, text, text, text) from public;
revoke all on function public.record_advisor_review(uuid, text, text, text) from anon;
grant execute on function public.record_advisor_review(uuid, text, text, text)
  to authenticated, service_role;

notify pgrst, 'reload schema';

commit;