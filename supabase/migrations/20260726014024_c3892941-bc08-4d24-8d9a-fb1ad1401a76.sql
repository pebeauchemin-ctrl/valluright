-- REB-76: Remove the redundant "Review inputs" advisor tier.
-- Existing invitations keep their effective comment access under the clearer label.

begin;

update public.advisor_invites
set permission_level = 'comment'
where permission_level = 'edit_assumptions';

comment on column public.advisor_invites.permission_level is
  'Advisor access tier: view_only, comment, or approve. Direct financial editing remains owner-only.';

notify pgrst, 'reload schema';

commit;