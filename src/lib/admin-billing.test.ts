import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

const adminFunctions = readFileSync("src/lib/support-admin.functions.ts", "utf8");
const settingsRoute = readFileSync("src/routes/app.settings.tsx", "utf8");

test("admin billing overview is server-gated and avoids card data", () => {
  assert.match(adminFunctions, /export const getAdminBillingOverview/);
  assert.match(adminFunctions, /currentUserIsAdmin\(context\.userId\)/);
  assert.match(adminFunctions, /throw new Response\("Forbidden", \{ status: 403 \}\)/);
  assert.match(adminFunctions, /billing_webhook_events/);
  assert.match(adminFunctions, /stripeDashboardCustomerUrl/);
  assert.doesNotMatch(adminFunctions, /last4|card_number|payment_method_details/);
});

test("settings only renders billing health for support admins", () => {
  assert.match(settingsRoute, /isSupportAdmin && \(/);
  assert.match(settingsRoute, /AdminBillingPanel overview=\{adminBilling\}/);
  assert.match(settingsRoute, /getAdminBillingOverview/);
});
