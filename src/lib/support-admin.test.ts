import assert from "node:assert/strict";
import {
  SUPPORT_ACTIONS,
  buildOnboardingStatus,
  sanitizeSupportMetadata,
} from "./support-admin";

const metadata = sanitizeSupportMetadata({
  source: "quickbooks",
  realm_id: "123",
  access_token: "secret",
  refresh_token: "secret",
  revenue: 1000,
  nested: { unsafe: true },
});

assert.equal(metadata.source, "quickbooks");
assert.equal(metadata.realm_id, "123");
assert.equal(metadata.access_token, undefined);
assert.equal(metadata.refresh_token, undefined);
assert.equal(metadata.revenue, undefined);
assert.equal(metadata.nested, "[object]");

const status = buildOnboardingStatus({
  hasBusinessProfile: true,
  financialYearCount: -3,
  hasValuation: false,
  buyerTeaserPublished: false,
  reportCount: -1,
  advisorInviteCount: 2,
  dataRoomFileCount: 4,
});

assert.equal(status.financialYearCount, 0);
assert.equal(status.reportCount, 0);
assert.equal(status.advisorInviteCount, 2);
assert.equal(status.dataRoomFileCount, 4);

assert.deepEqual(
  SUPPORT_ACTIONS.map((action) => action.title),
  ["Resend invite", "Reset import connection", "Inspect failed import", "Deactivate account"],
);

console.log("support-admin tests passed");
