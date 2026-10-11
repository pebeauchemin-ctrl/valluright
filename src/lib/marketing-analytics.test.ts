import assert from "node:assert/strict";
import {
  GTM_CONTAINER_ID,
  MARKETING_FUNNEL_EVENTS,
  __resetMarketingStateForTests,
  pushMarketingEvent,
  trackSignupComplete,
  trackValuationResultViewed,
  trackValuationStarted,
} from "./marketing-analytics";

const store = new Map<string, string>();
const w = {
  dataLayer: [] as Record<string, unknown>[],
};
(globalThis as unknown as { window: unknown }).window = w;
(globalThis as unknown as { sessionStorage: unknown }).sessionStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
};

function reset() {
  w.dataLayer = [];
  store.clear();
  __resetMarketingStateForTests();
}

assert.equal(GTM_CONTAINER_ID, "GTM-P2WWZ59B");
for (const e of ["signup_complete", "valuation_started", "valuation_result_viewed"]) {
  assert.ok((MARKETING_FUNNEL_EVENTS as readonly string[]).includes(e));
}

// signup_complete: plan only
reset();
trackSignupComplete({ plan: "essentials" });
assert.deepEqual(w.dataLayer, [{ event: "signup_complete", plan: "essentials" }]);
reset();
trackSignupComplete();
assert.deepEqual(w.dataLayer, [{ event: "signup_complete", plan: "free_preview" }]);
reset();
trackSignupComplete({ plan: "owner@example.com" });
assert.deepEqual(w.dataLayer, [{ event: "signup_complete", plan: "free_preview" }]);

// valuation_started: no params, once per session
reset();
trackValuationStarted();
trackValuationStarted();
assert.deepEqual(w.dataLayer, [{ event: "valuation_started" }]);

// valuation_result_viewed: no params, once per session
reset();
trackValuationResultViewed();
trackValuationResultViewed();
assert.deepEqual(w.dataLayer, [{ event: "valuation_result_viewed" }]);

// sanitizer strips PII / financial keys and email-like values
reset();
pushMarketingEvent("signup_complete", {
  email: "a@b.co",
  first_name: "Ann",
  business_name: "Acme RV",
  company_name: "Acme",
  revenue: 1200000,
  sde: 300000,
  valuation_amount: 900000,
  note: "x@y.io",
  plan: "essentials",
});
assert.deepEqual(w.dataLayer, [{ event: "signup_complete", plan: "essentials" }]);

// 1s dedupe
reset();
pushMarketingEvent("signup_complete", { plan: "essentials" });
pushMarketingEvent("signup_complete", { plan: "essentials" });
assert.equal(w.dataLayer.length, 1);

// no PII-ish strings anywhere in payloads
const all = JSON.stringify(w.dataLayer);
assert.doesNotMatch(all, /@|Acme|Ann/);
console.log("marketing-analytics tests passed");
