import assert from "node:assert/strict";
import {
  BILLING_EVENTS,
  COMMERCIAL_PLANS,
  FREE_TRIAL_LIMITS,
  PLAN_COMPARISON_ROWS,
  TARGET_CUSTOMER_SEGMENTS,
  buyerTeaserPolicy,
  commercialPlanBySlug,
} from "./commercial-model";
import { hasEntitlement } from "./plan-entitlements";

assert.equal(TARGET_CUSTOMER_SEGMENTS[0].name, "Owner self-serve");
assert.equal(TARGET_CUSTOMER_SEGMENTS[0].role, "Primary launch segment");

assert.equal(FREE_TRIAL_LIMITS.name, "Free Preview");
assert.equal(FREE_TRIAL_LIMITS.dataRoomStorage, "not included");
assert.equal(FREE_TRIAL_LIMITS.accountingIntegrations, "not included");
assert.match(FREE_TRIAL_LIMITS.buyerTeaser, /draft preview only/);
assert.doesNotMatch(FREE_TRIAL_LIMITS.buyerTeaser, /Advisor Partner/);

const exitReady = COMMERCIAL_PLANS.find((plan) => plan.name === "Exit Ready");
assert.ok(exitReady);
assert.equal(exitReady.slug, "exit-ready");
assert.equal(exitReady.cta, "Start Exit Ready preview");
assert.equal(exitReady.buyerTeaser, "public_sharing");
assert.equal(buyerTeaserPolicy(exitReady), "Public teaser sharing included");
assert.equal(commercialPlanBySlug("exit-ready")?.name, "Exit Ready");
assert.equal(commercialPlanBySlug("missing"), null);
assert.equal(commercialPlanBySlug("advisor-partner"), null);
assert.equal(COMMERCIAL_PLANS.length, 2);

const essentials = COMMERCIAL_PLANS.find((plan) => plan.name === "Essentials");
assert.ok(essentials);
assert.equal(essentials.slug, "essentials");
assert.equal(essentials.buyerTeaser, "preview_only");
assert.ok(essentials.limits.some((limit) => /Xero and QuickBooks/.test(limit)));

const accountingIntegrationRow = PLAN_COMPARISON_ROWS.find((row) =>
  /QuickBooks and Xero/.test(row.feature),
);
assert.ok(accountingIntegrationRow);
assert.equal(accountingIntegrationRow.free, "not_included");
assert.equal(accountingIntegrationRow.essentials, "included");
assert.equal(accountingIntegrationRow["exit-ready"], "included");

const advisorReviewRow = PLAN_COMPARISON_ROWS.find((row) => row.group === "Advisor review");
assert.ok(advisorReviewRow);
assert.match(advisorReviewRow.advisorNote ?? "", /free for the invited advisor/i);
assert.equal(advisorReviewRow["exit-ready"], "included");

const futurePeriod = new Date(Date.now() + 86_400_000).toISOString();
const expiredPeriod = new Date(Date.now() - 7_200_000).toISOString();
assert.equal(hasEntitlement("essentials", "active", "accounting_import", futurePeriod), true);
assert.equal(hasEntitlement("free", "free", "accounting_import", futurePeriod), false);
assert.equal(hasEntitlement("essentials", "active", "accounting_import", expiredPeriod), false);
assert.equal(hasEntitlement("exit-ready", "active", "data_room", futurePeriod), true);

assert.deepEqual(BILLING_EVENTS, [
  "subscription_started",
  "subscription_plan_changed",
  "payment_failed",
  "payment_recovered",
  "subscription_cancelled",
]);

console.log("commercial-model tests passed");
