# ValuRight Owner Journey Regression Checklist

Use this checklist before each production publish or after any change that touches authentication, onboarding, financials, valuation, reports, recommendations, scenarios, data room, or buyer teaser sharing.

Record each item as Pass, Fail, or Not Tested. Any Fail should become a separate Linear issue with the page, account used, expected behavior, actual behavior, screenshot or error text, and reproduction steps.

## Test Setup

- Confirm the test environment and commit or PR being tested.
- Confirm whether Supabase migrations required by the release have been applied.
- Use at least one existing owner account with saved business data.
- Use at least one fresh owner account or reset test account for first-run checks.
- Test desktop at about 1440px wide.
- Test tablet at about 768px wide.
- Test mobile at about 390px wide.
- Keep browser dev console open when possible and capture any visible runtime errors.

## Public Entry And Authentication

- Public homepage loads without a blank screen or runtime overlay.
- Header navigation links work: pricing, methodology, login, and primary call to action.
- Footer and trust links work: privacy, terms, security, sitemap, and robots where applicable.
- Signup or account creation path is visible and understandable for a new owner.
- Login succeeds with a valid owner account.
- Login shows a clear error for an invalid password.
- Reset password route loads and explains next steps.
- Signed-out users cannot access `/app` pages.
- Signed-in users can refresh the dashboard without being logged out unexpectedly.

## First-Run Company Setup

- A new owner sees a clear next step instead of an empty or broken dashboard.
- Company setup captures required fields with clear labels.
- Required-field validation prevents incomplete setup.
- Optional profile fields can be skipped without breaking later pages.
- Saving company setup persists after refresh.
- Returning to onboarding shows saved values instead of starting over.
- Sample/demo data, if offered, is clearly labeled as sample data.

## Financial Data Entry And Import

- Financials page loads for an owner with an existing business.
- Manual financial fields are readable and editable.
- Adding a year works and does not shift or overlap the layout.
- Saving financials persists after refresh.
- Empty numeric fields do not crash calculated totals.
- Zero, negative, or unusual values show either a sensible calculation or a clear warning.
- CSV upload control is visible and either works or clearly explains its expected format.
- Xero import button reflects the real connection state.
- QuickBooks import button reflects the real connection state or is clearly labeled if unavailable.
- Import errors show a user-friendly message and do not expose tokens, secrets, or raw stack traces.

## Business Profile And Assumptions

- Business profile fields load existing saved values.
- Owner involvement, recurring revenue, customer concentration, SOPs, management depth, industry, and region can be edited where available.
- Saving profile assumptions updates the dashboard after refresh.
- Missing assumptions produce clear fallback text or warnings.
- Industry and business type choices do not produce obviously mismatched valuation language.

## Data Quality Review

- App identifies missing financial years or missing required financial fields.
- App flags unusual values such as negative earnings, high debt, or incomplete balance sheet fields.
- User can understand whether the valuation is based on manual data, CSV, Xero, QuickBooks, or sample data.
- Weak data quality requires visible acknowledgement or is clearly reflected in confidence notes.
- Dashboard shows data quality status or equivalent limitations text where available.

## Valuation Dashboard

- Dashboard loads without requiring a pre-existing valuation row.
- Valuation range is displayed as a range, not false precision.
- SDE, EBITDA, revenue, DCF, asset, and comparable method sections either show valid values or explain why they are not available.
- "Why this range?" or equivalent explainability text is visible.
- Method details show formula, inputs, assumptions, confidence, and notes.
- SDE and EBITDA normalization language avoids double-counting owner compensation.
- Last-updated/source information is visible where available.
- Refreshing the dashboard does not change saved values unexpectedly.

## Recommendations And Improve Value

- Recommendations page loads for businesses with and without saved recommendations.
- Empty recommendation state tells the owner what to do next.
- Recommendation cards show priority, impact, effort, and buyer concern where available.
- Adding or removing a recommendation from the roadmap persists after refresh.
- Improve Value page links recommendations to exit-readiness drivers without implying guaranteed value increases.

## Scenarios And Roadmap

- Scenario page loads without chart or slider overlap.
- Creating a scenario works with required fields.
- Scenario sliders are usable on desktop, tablet, and mobile.
- Saving a scenario persists after refresh.
- Scenario projected value and delta update consistently.
- Empty state explains how to create the first scenario.
- Roadmap page shows selected actions or a clear empty state.

## Reports

- Reports page loads for an owner account.
- Existing reports are listed or the empty state explains how to generate one.
- Report preview includes business summary, financial summary, valuation range, method breakdown, health score, recommendations, scenarios, data quality notes, and disclaimers where available.
- Report language frames outputs as planning estimates, not certified appraisals or advice.
- Export/download action either works or clearly explains if unavailable.
- Report preview remains readable on mobile.

## Data Room

- Data Room page loads for the owner.
- Owner can upload a small safe test file.
- Uploaded file appears in the correct category/list.
- Download or view action works only for authorized users.
- Delete action, if present, asks for confirmation and persists after refresh.
- Upload failure shows a clear error and does not expose storage policy internals to end users.

## Buyer Teaser

- Buyer teaser settings page loads saved visibility controls.
- Always-visible, optional, and restricted fields are distinguishable.
- Owner can preview the public teaser exactly as a buyer will see it.
- Publishing produces a public teaser URL.
- Public teaser does not expose confidential business name, owner identity, exact financials, or files unless the owner explicitly allowed them.
- Unpublished teaser returns a not-found or unavailable state.
- Buyer access request form captures name, email, phone, buyer type, financing status, and message.
- Buyer access request validation catches missing required fields.
- Submitted buyer lead appears for the owner or is stored for follow-up.

## Advisor And Collaboration

- Advisor page loads for the owner.
- Empty state explains how advisor collaboration works.
- Invite form, if enabled, validates email and permission level.
- Comments or approval states, if enabled, persist after refresh.
- Advisor-only or buyer-only users cannot access owner-only pages.

## Mobile And Responsive Layout

- App navigation remains usable at 390px and 360px widths.
- No page has overlapping text, clipped buttons, hidden inputs, or horizontal overflow except intentional table scrolling.
- Financial tables can scroll horizontally without trapping the page.
- Dashboard cards stack cleanly on mobile.
- Scenario controls remain touch-friendly.
- Buyer teaser public page is readable on mobile.
- Modals, dialogs, dropdowns, and date/number inputs fit within the viewport.

## Security And Privacy Spot Checks

- Signed-out requests to owner dashboard routes redirect or block access.
- Public teaser exposes only buyer-safe published fields.
- Error messages do not include OAuth tokens, Supabase service keys, private storage paths, or full stack traces in production.
- Uploaded financial files are not publicly accessible without authorization.
- One owner account cannot view another owner's business, financials, reports, data room files, scenarios, recommendations, or buyer leads.

## Release Sign-Off

- All critical owner journey items are Pass.
- Any Fail has a Linear issue linked to the release or QA note.
- Any Not Tested item has a reason and owner.
- Supabase migration status is known.
- Lovable publish/sync has completed.
- Public site and logged-in dashboard both load after publish.
- Final smoke test completed on desktop and mobile.
