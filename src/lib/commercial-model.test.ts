import assert from "node:assert/strict";
import {
  BILLING_EVENTS,
  COMMERCIAL_PLANS,
  FREE_TRIAL_LIMITS,
  TARGET_CUSTOMER_SEGMENTS,
  buyerTeaserPolicy,
} from "./commercial-model";

assert.equal(TARGET_CUSTOMER_SEGMENTS[0].name, "Owner self-serve");
assert.equal(TARGET_CUSTOMER_SEGMENTS[0].role, "Primary launch segment");

assert.equal(FREE_TRIAL_LIMITS.durationDays, 14);
assert.equal(FREE_TRIAL_LIMITS.businesses, 1);
assert.match(FREE_TRIAL_LIMITS.buyerTeaser, /draft preview only/);

const exitReady = COMMERCIAL_PLANS.find((plan) => plan.name === "Exit Ready");
assert.ok(exitReady);
assert.equal(exitReady.buyerTeaser, "public_sharing");
assert.equal(buyerTeaserPolicy(exitReady), "Public teaser sharing included");

const advisorPartner = COMMERCIAL_PLANS.find((plan) => plan.name === "Advisor Partner");
assert.ok(advisorPartner);
assert.equal(advisorPartner.buyerTeaser, "client_sharing");
assert.ok(advisorPartner.features.some((feature) => feature.includes("10 active client")));

const essentials = COMMERCIAL_PLANS.find((plan) => plan.name === "Essentials");
assert.ok(essentials);
assert.equal(essentials.buyerTeaser, "preview_only");

assert.deepEqual(BILLING_EVENTS, [
  "trial_started",
  "trial_expired",
  "subscription_started",
  "subscription_plan_changed",
  "payment_failed",
  "payment_recovered",
  "subscription_cancelled",
  "one_time_report_purchased",
]);

console.log("commercial-model tests passed");
