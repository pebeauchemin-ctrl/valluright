import { strict as assert } from "node:assert";
import {
  PRODUCT_ANALYTICS_PRIVACY_NOTE,
  PRODUCT_FUNNEL_EVENTS,
  PRODUCT_FUNNEL_STEPS,
  productFunnelProgress,
} from "./product-analytics";

const requiredEvents = [
  "signup_completed",
  "company_created",
  "financial_data_added",
  "valuation_generated",
  "recommendation_viewed",
  "scenario_saved",
  "buyer_teaser_generated",
  "report_exported",
  "advisor_invited",
];

for (const eventName of requiredEvents) {
  assert.ok(PRODUCT_FUNNEL_EVENTS.includes(eventName as never), `${eventName} is tracked`);
  assert.ok(
    PRODUCT_FUNNEL_STEPS.some((step) => step.eventName === eventName),
    `${eventName} appears in funnel dashboard`,
  );
}

for (const blocked of ["financial values", "contact details", "OAuth tokens", "file contents"]) {
  assert.match(PRODUCT_ANALYTICS_PRIVACY_NOTE, new RegExp(blocked, "i"));
}

const progress = productFunnelProgress([
  { event_name: "company_created", created_at: "2026-01-02T00:00:00Z" },
  { event_name: "company_created", created_at: "2026-01-03T00:00:00Z" },
  { event_name: "valuation_generated", created_at: "2026-01-04T00:00:00Z" },
]);

const companyStep = progress.find((step) => step.eventName === "company_created");
assert.equal(companyStep?.completed, true);
assert.equal(companyStep?.count, 2);
assert.equal(companyStep?.firstSeenAt, "2026-01-02T00:00:00Z");
assert.equal(companyStep?.lastSeenAt, "2026-01-03T00:00:00Z");

const signupStep = progress.find((step) => step.eventName === "signup_completed");
assert.equal(signupStep?.completed, false);

console.log("product analytics tests passed");
