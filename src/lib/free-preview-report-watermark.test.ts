import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

const reportsPage = readFileSync("src/routes/app.reports.tsx", "utf8");

test("Free Preview reports include a printable watermark", () => {
  assert.match(reportsPage, /function FreePreviewWatermark/);
  assert.match(reportsPage, /FREE PREVIEW - VALURIGHT\.AI/);
  assert.match(reportsPage, /NOT FOR DISTRIBUTION/);
  assert.match(reportsPage, /subscription\.loading/);
});
