import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const migration = readFileSync(
  "supabase/migrations/20260531021500_harden_role_access_and_public_teasers.sql",
  "utf8",
);
const buyerPiiMigration = readFileSync(
  "supabase/migrations/20260604005200_lock_down_buyer_access_request_pii_reads.sql",
  "utf8",
);
const dataRoomOverwriteMigration = readFileSync(
  "supabase/migrations/20260605013500_prevent_data_room_storage_overwrites.sql",
  "utf8",
);
const publicSecurityDefinerMigration = readFileSync(
  "supabase/migrations/20260605014500_review_public_security_definer_grants.sql",
  "utf8",
);
const authenticatedSecurityDefinerMigration = readFileSync(
  "supabase/migrations/20260606004500_review_authenticated_security_definer_grants.sql",
  "utf8",
);
const fixedSearchPathMigration = readFileSync(
  "supabase/migrations/20260606005500_set_fixed_function_search_paths.sql",
  "utf8",
);
const advisorInviteVisibilityMigration = readFileSync(
  "supabase/migrations/20260606011000_restrict_advisor_invite_email_visibility.sql",
  "utf8",
);
const advisorInviteGrantRepairMigration = readFileSync(
  "supabase/migrations/20260712014500_repair_advisor_invite_grants.sql",
  "utf8",
);
const advisorAcceptanceMigration = readFileSync(
  "supabase/migrations/20260713020500_enable_advisor_invite_acceptance.sql",
  "utf8",
);
const advisorReviewIntegrityMigration = readFileSync(
  "supabase/migrations/20260713024500_secure_advisor_review_statuses.sql",
  "utf8",
);
const publicTeaserSdeMigration = readFileSync(
  "supabase/migrations/20260714020000_fix_public_teaser_sde.sql",
  "utf8",
);
const advisorInviteDeliveryMigration = readFileSync(
  "supabase/migrations/20260715011500_add_advisor_invite_delivery_tracking.sql",
  "utf8",
);
const teaserRoute = readFileSync("src/routes/teaser.$publicId.tsx", "utf8");
const dataRoomRoute = readFileSync("src/routes/app.data-room.tsx", "utf8");
const advisorsRoute = readFileSync("src/routes/app.advisors.tsx", "utf8");
const advisorAcceptanceRoute = readFileSync("src/routes/advisor.accept.$inviteId.tsx", "utf8");
const advisorDeclineRoute = readFileSync("src/routes/advisor.decline.$inviteId.tsx", "utf8");
const advisorRoute = readFileSync("src/routes/advisor.tsx", "utf8");
const advisorInviteFunctions = readFileSync("src/lib/advisor-invites.functions.ts", "utf8");
const settingsRoute = readFileSync("src/routes/app.settings.tsx", "utf8");

test("public teaser does not expose internal business ids", () => {
  assert.match(migration, /create or replace function public\.get_public_teaser/);
  assert.doesNotMatch(teaserRoute, /business_id:\s*business\.id/);
  assert.doesNotMatch(teaserRoute, /\bid:\s*string/);
  assert.doesNotMatch(migration, /'id', p\.id/);
});

test("public teaser SDE uses the valuation EBITDA bridge and reviewed add-back total", () => {
  assert.match(publicTeaserSdeMigration, /nullif\(f\.ebitda, 0\)/);
  assert.match(publicTeaserSdeMigration, /coalesce\(f\.net_income, 0\)/);
  assert.match(publicTeaserSdeMigration, /coalesce\(f\.interest, 0\)/);
  assert.match(publicTeaserSdeMigration, /coalesce\(f\.income_taxes, 0\)/);
  assert.match(publicTeaserSdeMigration, /coalesce\(f\.depreciation, 0\)/);
  assert.match(publicTeaserSdeMigration, /coalesce\(f\.amortization, 0\)/);
  assert.match(publicTeaserSdeMigration, /coalesce\(f\.owner_salary, 0\)/);
  assert.match(publicTeaserSdeMigration, /coalesce\(f\.addbacks, 0\)/);
  assert.doesNotMatch(publicTeaserSdeMigration, /financial_addbacks/);
});

test("buyer leads must go through the published-teaser RPC", () => {
  assert.match(
    migration,
    /revoke insert on public\.buyer_access_requests from anon, authenticated/,
  );
  assert.match(migration, /create or replace function public\.submit_buyer_access_request/);
  assert.match(migration, /s\.is_published = true/);
  assert.match(teaserRoute, /rpc\("submit_buyer_access_request"/);
});

test("buyer lead PII table reads are owner scoped", () => {
  assert.match(buyerPiiMigration, /revoke all on table public\.buyer_access_requests from anon/);
  assert.match(
    buyerPiiMigration,
    /revoke all on table public\.buyer_access_requests from authenticated/,
  );
  assert.match(
    buyerPiiMigration,
    /grant select, update on table public\.buyer_access_requests to authenticated/,
  );
  assert.match(buyerPiiMigration, /owners can read own buyer access requests/);
  assert.match(buyerPiiMigration, /owners can update own buyer access requests/);
  assert.match(buyerPiiMigration, /b\.owner_id = auth\.uid\(\)/);
  assert.doesNotMatch(
    buyerPiiMigration,
    /grant select on table public\.buyer_access_requests to anon/,
  );
});

test("data room overwrites require ownership of the existing and resulting path", () => {
  assert.match(dataRoomOverwriteMigration, /owners update own data room/);
  assert.match(dataRoomOverwriteMigration, /for update\s+to authenticated/);
  assert.match(
    dataRoomOverwriteMigration,
    /using \(\s*bucket_id = 'data-room'\s+and public\.user_owns_business_path\(name\)\s*\)/,
  );
  assert.match(
    dataRoomOverwriteMigration,
    /with check \(\s*bucket_id = 'data-room'\s+and public\.user_owns_business_path\(name\)\s*\)/,
  );
  assert.doesNotMatch(dataRoomOverwriteMigration, /to anon/);
  assert.doesNotMatch(dataRoomOverwriteMigration, /with check \(\s*bucket_id = 'data-room'\s*\)/);
  assert.match(dataRoomRoute, /\.upload\(path, f, \{ upsert: false \}\)/);
});

test("public security definer grants are limited to documented teaser RPCs", () => {
  assert.match(
    publicSecurityDefinerMigration,
    /grant execute on function public\.get_public_teaser\(text\) to anon, authenticated/,
  );
  assert.match(
    publicSecurityDefinerMigration,
    /Intentional public SECURITY DEFINER RPC\. Returns only buyer-safe fields/,
  );
  assert.match(
    publicSecurityDefinerMigration,
    /grant execute on function public\.submit_buyer_access_request\(/,
  );
  assert.match(
    publicSecurityDefinerMigration,
    /Intentional public SECURITY DEFINER RPC\. Inserts buyer access requests only for published teasers/,
  );

  for (const signature of [
    "public.handle_new_user()",
    "public.has_role(uuid, public.app_role)",
    "public.is_advisor_of(uuid, uuid)",
    "public.advisor_permission_rank(text)",
    "public.can_advisor_access(uuid, uuid, text)",
    "public.user_owns_business_path(text)",
  ]) {
    assert.match(
      publicSecurityDefinerMigration,
      new RegExp(`revoke all on function ${signature.replace(/[().]/g, "\\$&")} from public`),
    );
    assert.match(
      publicSecurityDefinerMigration,
      new RegExp(`revoke all on function ${signature.replace(/[().]/g, "\\$&")} from anon`),
    );
  }
});

test("authenticated security definer grants validate caller scope", () => {
  assert.match(
    authenticatedSecurityDefinerMigration,
    /create or replace function public\.can_advisor_access/,
  );
  assert.match(authenticatedSecurityDefinerMigration, /_user_id = auth\.uid\(\)/);
  assert.match(authenticatedSecurityDefinerMigration, /auth\.role\(\) = 'service_role'/);
  assert.match(
    authenticatedSecurityDefinerMigration,
    /revoke all on function public\.has_role\(uuid, public\.app_role\) from authenticated/,
  );
  assert.match(
    authenticatedSecurityDefinerMigration,
    /Authenticated users must not call this SECURITY DEFINER function directly for arbitrary user ids/,
  );
  assert.match(
    authenticatedSecurityDefinerMigration,
    /grant execute on function public\.can_advisor_access\(uuid, uuid, text\) to authenticated/,
  );
  assert.match(
    authenticatedSecurityDefinerMigration,
    /Direct calls only return true for the caller''s own user id unless executed by service_role/,
  );
  assert.match(
    authenticatedSecurityDefinerMigration,
    /user_owns_business_path\(text\) is\s+'Intentional authenticated SECURITY DEFINER helper for private data-room storage policies/,
  );
});

test("database helper functions use fixed search paths", () => {
  assert.match(
    fixedSearchPathMigration,
    /create or replace function public\.revenue_band\(_revenue numeric\)/,
  );
  assert.match(
    fixedSearchPathMigration,
    /create or replace function public\.advisor_permission_rank\(_permission_level text\)/,
  );
  assert.match(
    fixedSearchPathMigration,
    /create or replace function public\.revenue_band\(_revenue numeric\)[\s\S]*?set search_path = public/,
  );
  assert.match(
    fixedSearchPathMigration,
    /create or replace function public\.advisor_permission_rank\(_permission_level text\)[\s\S]*?set search_path = public/,
  );
  assert.match(fixedSearchPathMigration, /Fixed search_path prevents mutable-path linter warnings/);
});

test("advisor invite emails are not readable by email-match policy", () => {
  assert.match(
    advisorInviteVisibilityMigration,
    /revoke all on table public\.advisor_invites from anon/,
  );
  assert.match(
    advisorInviteVisibilityMigration,
    /grant select, insert, update, delete on table public\.advisor_invites to authenticated/,
  );
  assert.match(
    advisorInviteVisibilityMigration,
    /owners manage advisor invites for own businesses/,
  );
  assert.match(advisorInviteVisibilityMigration, /linked advisors can read their invites/);
  assert.match(advisorInviteVisibilityMigration, /advisor_id = auth\.uid\(\)/);
  assert.doesNotMatch(
    advisorInviteVisibilityMigration,
    /lower\(advisor_email\)|auth\.jwt\(\)\s*->>\s*'email'|select email from auth\.users/,
  );
  assert.match(
    advisorInviteVisibilityMigration,
    /cannot read invite rows by matching advisor_email/,
  );
});

test("advisor invite grant repair restores owner access without email-match reads", () => {
  assert.match(
    advisorInviteGrantRepairMigration,
    /grant select, insert, update, delete on table public\.advisor_invites to authenticated/,
  );
  assert.match(
    advisorInviteGrantRepairMigration,
    /owners manage advisor invites for own businesses/,
  );
  assert.match(advisorInviteGrantRepairMigration, /linked advisors can read their invites/);
  assert.match(advisorInviteGrantRepairMigration, /advisor_id = auth\.uid\(\)/);
  assert.match(advisorInviteGrantRepairMigration, /notify pgrst, 'reload schema'/);
  assert.doesNotMatch(
    advisorInviteGrantRepairMigration,
    /lower\(advisor_email\)|auth\.jwt\(\)\s*->>\s*'email'|select email from auth\.users/,
  );
});

test("advisor acceptance securely links the invited account before access is granted", () => {
  assert.match(
    advisorAcceptanceMigration,
    /create or replace function public\.accept_advisor_invite/,
  );
  assert.match(advisorAcceptanceMigration, /lower\(invite_row\.advisor_email\) <> caller_email/);
  assert.match(advisorAcceptanceMigration, /advisor_id = auth\.uid\(\)/);
  assert.match(advisorAcceptanceMigration, /status = 'accepted'/);
  assert.match(
    advisorAcceptanceMigration,
    /Business owners cannot accept their own advisor invitation/,
  );
  assert.match(
    advisorAcceptanceMigration,
    /revoke all on function public\.accept_advisor_invite\(uuid\) from anon/,
  );
  assert.match(
    advisorAcceptanceMigration,
    /grant execute on function public\.accept_advisor_invite\(uuid\) to authenticated/,
  );
  assert.match(advisorAcceptanceRoute, /rpc\("accept_advisor_invite"/);
  assert.match(advisorRoute, /rpc\("get_my_advisor_invites"/);
  assert.doesNotMatch(advisorRoute, /\.eq\("advisor_id", user\.id\)/);
});

test("advisor invitation emails are server-side, tracked, and rate limited", () => {
  assert.match(advisorInviteFunctions, /process\.env\.RESEND_API_KEY/);
  assert.match(advisorInviteFunctions, /https:\/\/api\.resend\.com\/emails/);
  assert.match(advisorInviteFunctions, /invite_email_last_attempt_at/);
  assert.match(advisorInviteFunctions, /60 \* 60 \* 1000/);
  assert.match(advisorsRoute, /resendAdvisorInvite/);
  assert.match(advisorsRoute, /Resend email/);
  assert.doesNotMatch(advisorsRoute, /Email delivery is not automated yet/);
  assert.match(advisorInviteDeliveryMigration, /create or replace function public\.decline_advisor_invite/);
  assert.match(advisorInviteDeliveryMigration, /lower\(invite_row\.advisor_email\) <> caller_email/);
  assert.match(advisorInviteDeliveryMigration, /grant execute on function public\.decline_advisor_invite\(uuid\) to authenticated/);
  assert.match(advisorDeclineRoute, /rpc\("decline_advisor_invite"/);
});

test("owner advisor page shares an acceptance link instead of simulating advisor responses", () => {
  assert.match(advisorsRoute, /Copy access link/);
  assert.match(advisorsRoute, /Owners cannot record feedback on an advisor’s behalf/);
  assert.doesNotMatch(advisorsRoute, /updateInviteStatus/);
  assert.doesNotMatch(advisorsRoute, /Record advisor feedback/);
});

test("advisor review status is attributed to an accepted advisor and approval needs approval permission", () => {
  assert.match(
    advisorReviewIntegrityMigration,
    /create or replace function public\.record_advisor_review/,
  );
  assert.match(
    advisorReviewIntegrityMigration,
    /public\.can_advisor_access\(_business_id, auth\.uid\(\), 'comment'\)/,
  );
  assert.match(
    advisorReviewIntegrityMigration,
    /public\.can_advisor_access\(_business_id, auth\.uid\(\), 'approve'\)/,
  );
  assert.match(
    advisorReviewIntegrityMigration,
    /revoke insert, update, delete on table public\.advisor_comments from authenticated/,
  );
  assert.match(
    advisorReviewIntegrityMigration,
    /grant execute on function public\.record_advisor_review\(uuid, text, text\) to authenticated/,
  );
  assert.match(advisorRoute, /rpc\("record_advisor_review"/);
  assert.match(advisorRoute, /canApprove && <option value="approved">Review complete<\/option>/);
  assert.match(advisorsRoute, /const latestStatus = comments\.find/);
  assert.match(advisorsRoute, /Owner note/);
});

test("advisor page surfaces advisor invite read failures", () => {
  assert.match(advisorsRoute, /const \[loadError, setLoadError\]/);
  assert.match(advisorsRoute, /invitesResult\.error/);
  assert.match(advisorsRoute, /if \(error\) throw error/);
  assert.match(advisorsRoute, /Could not load advisor review data/);
  assert.match(advisorsRoute, /<LoadErrorState/);
  assert.doesNotMatch(advisorsRoute, /const \[\s*\{\s*data:\s*inv\s*\}/);
});

test("advisor permissions are explicit and enforced before comments", () => {
  assert.match(migration, /advisor_invites_permission_level_check/);
  assert.match(migration, /create or replace function public\.can_advisor_access/);
  assert.match(migration, /public\.can_advisor_access\(business_id, auth\.uid\(\), 'comment'\)/);
  assert.match(migration, /drop policy if exists "advisors can update their invites"/);
});

test("settings renders the free billing panel when no subscription row exists", () => {
  assert.match(
    settingsRoute,
    /!subscriptionLoading && subscription && subscription\.plan !== "free"/,
  );
  assert.doesNotMatch(settingsRoute, /subscription\?\.plan !== "free"/);
  assert.match(settingsRoute, /!subscription \|\| subscription\.plan === "free"/);
});
