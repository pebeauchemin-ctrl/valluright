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
const teaserRoute = readFileSync("src/routes/teaser.$publicId.tsx", "utf8");
const dataRoomRoute = readFileSync("src/routes/app.data-room.tsx", "utf8");

test("public teaser does not expose internal business ids", () => {
  assert.match(migration, /create or replace function public\.get_public_teaser/);
  assert.doesNotMatch(teaserRoute, /business_id:\s*business\.id/);
  assert.doesNotMatch(teaserRoute, /\bid:\s*string/);
  assert.doesNotMatch(migration, /'id', p\.id/);
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

test("advisor permissions are explicit and enforced before comments", () => {
  assert.match(migration, /advisor_invites_permission_level_check/);
  assert.match(migration, /create or replace function public\.can_advisor_access/);
  assert.match(migration, /public\.can_advisor_access\(business_id, auth\.uid\(\), 'comment'\)/);
  assert.match(migration, /drop policy if exists "advisors can update their invites"/);
});
