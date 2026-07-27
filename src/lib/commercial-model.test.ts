import assert from "node:assert/strict";
import {
  BILLING_EVENTS,
  COMMERCIAL_PLANS,
  FREE_TRIAL_LIMITS,
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

const exitReady = COMMERCIAL_PLANS.find((plan) => plan.name === "Exit Ready");
assert.ok(exitReady);
assert.equal(exitReady.slug, "exit-ready");
assert.equal(exitReady.cta, "Start Exit Ready preview");
assert.equal(exitReady.buyerTeaser, "public_sharing");
assert.equal(buyerTeaserPolicy(exitReady), "Public teaser sharing included");
assert.equal(commercialPlanBySlug("exit-ready")?.name, "Exit Ready");
assert.equal(commercialPlanBySlug("missing"), null);

const advisorPartner = COMMERCIAL_PLANS.find((plan) => plan.name === "Advisor Partner");
assert.ok(advisorPartner);
assert.equal(advisorPartner.slug, "advisor-partner");
assert.equal(advisorPartner.buyerTeaser, "client_sharing");
assert.ok(advisorPartner.features.some((feature) => feature.startsWith("Planned:")));

const essentials = COMMERCIAL_PLANS.find((plan) => plan.name === "Essentials");
assert.ok(essentials);
assert.equal(essentials.slug, "essentials");
assert.equal(essentials.buyerTeaser, "preview_only");
assert.ok(essentials.limits.some((limit) => /Xero and QuickBooks/.test(limit)));

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
