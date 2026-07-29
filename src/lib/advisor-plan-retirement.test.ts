import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

const commercialModel = readFileSync("src/lib/commercial-model.ts", "utf8");
const billingFunctions = readFileSync("src/lib/billing.functions.ts", "utf8");
const billingMigration = readFileSync(
  "supabase/migrations/20260729014500_retire_advisor_partner_plan.sql",
  "utf8",
);

test("Advisor Partner cannot be purchased as a current plan", () => {
  assert.doesNotMatch(commercialModel, /slug: "advisor-partner"/);
  assert.doesNotMatch(billingFunctions, /"advisor-partner"\]/);
  assert.match(billingMigration, /set plan = 'exit-ready'/);
  assert.match(billingMigration, /s\.plan in \('essentials', 'exit-ready'\)/);
});
