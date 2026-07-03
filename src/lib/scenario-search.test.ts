import assert from "node:assert/strict";
import { getBenchmarkCase } from "./valuation-benchmarks";
import {
  applyScenarioSearchToKnobs,
  businessKnobs,
  scenarioDelta,
  validateScenarioSearch,
} from "./scenario-search";

const fixture = getBenchmarkCase("hvac-service-trade").inputs;
const business = {
  owner_hours_per_week: fixture.owner_hours_per_week,
  recurring_revenue_pct: fixture.recurring_revenue_pct,
  top_customer_concentration_pct: fixture.top_customer_concentration_pct,
  sop_status: fixture.sop_status,
  manager_team_depth: fixture.manager_team_depth,
} as Parameters<typeof businessKnobs>[0];

const search = validateScenarioSearch({
  ownerHrs: '"35"',
  sopComplete: "true",
});

const knobs = applyScenarioSearchToKnobs(businessKnobs(business), search);

assert.equal(knobs.ownerInvolvement, 50);
assert.equal(knobs.sopScore, 90);

const delta = scenarioDelta(fixture, knobs);
assert.notEqual(delta, 0);
assert.ok(delta > 0, `expected quick-action scenario to lift projected value, got ${delta}`);

const campground = getBenchmarkCase("campground-rv-park").inputs;
const campgroundBusiness = {
  owner_hours_per_week: campground.owner_hours_per_week,
  recurring_revenue_pct: campground.recurring_revenue_pct,
  top_customer_concentration_pct: campground.top_customer_concentration_pct,
  sop_status: campground.sop_status,
  manager_team_depth: campground.manager_team_depth,
} as Parameters<typeof businessKnobs>[0];
const marginKnobs = applyScenarioSearchToKnobs(
  businessKnobs(campgroundBusiness),
  validateScenarioSearch({ marginUplift: "5" }),
);
const campgroundDelta = scenarioDelta(campground, marginKnobs);
assert.notEqual(campgroundDelta, 0);
assert.ok(
  campgroundDelta > 0,
  `expected profit margin uplift to change RV park cap-rate value, got ${campgroundDelta}`,
);

console.log("scenario-search tests passed");
