# Commercial Model

REB-30 defines the commercial model before adding billing code. This is a launch decision record,
not a Stripe implementation plan.

## Target Segments

ValuRight should launch as a hybrid product:

- Owner self-serve is the primary launch segment. These are business owners planning an exit in the
  next 0-5 years who need a credible planning range, risk review, and preparation roadmap.
- Advisor-led is the secondary segment. CPAs, exit planners, brokers, and consultants can use the app
  with clients during review or readiness work.
- Broker / CPA partner is the partner channel. These firms need multiple client workspaces, advisor
  review, and repeatable reports without custom implementation.

## Free Preview

- Duration: 14 days.
- Limit: 1 business.
- Advisors: none.
- Scenarios: 2 active scenarios.
- Reports: watermarked preview only.
- Buyer teaser: draft preview only. Public sharing is gated to Exit Ready or Advisor Partner.
- Data room: not included.

## Paid Plans

### Essentials

- Price: $99 / month.
- Segment: owner-operator.
- Limit: 1 business.
- Includes dashboard, six valuation methods, Health Score, recommendations, imports, and two active
  what-if scenarios.
- Reports: watermarked preview.
- Buyer teaser: draft preview only.

### Exit Ready

- Price: $249 / month.
- Segment: owner preparing to sell.
- Limit: 1 business.
- Includes public buyer-safe teaser sharing, buyer lead workflow, data room with 5 GB included, PDF
  report exports, unlimited scenarios, and up to 3 advisor reviewers.
- Buyer teaser: public sharing included.

### Advisor Partner

- Price: $349 / seat / month.
- Segment: CPAs, brokers, and exit advisors.
- Limit: up to 10 active client businesses per seat at launch.
- Includes advisor review workflow, client workspace management, reusable report and teaser workflows.
- White-label reports and additional client businesses are future add-ons.
- Buyer teaser: client sharing included.

### One-time Report

- Price: $799 one-time.
- Segment: owner who wants a single planning snapshot.
- Includes one valuation snapshot, recommendations, PDF export, and 30 days of edit access.
- No ongoing import refresh.
- Buyer teaser: draft preview only.

## Buyer Teaser Gating

Buyer-safe teaser draft preview can remain available during the free preview and Essentials plan so
owners understand the feature. Public teaser publishing and buyer lead capture should require Exit
Ready or Advisor Partner. This keeps the product useful in trial while reserving external sharing and
lead capture for paid plans.

## Advisor Access Model

- Free Preview: no advisor invites.
- Essentials: no advisor invites by default.
- Exit Ready: up to 3 advisor reviewers for the owner's business.
- Advisor Partner: advisor seat owns or manages up to 10 active client businesses at launch.

## Billing Events Needed Later

When billing is implemented, track these events:

- `trial_started`
- `trial_expired`
- `subscription_started`
- `subscription_plan_changed`
- `payment_failed`
- `payment_recovered`
- `subscription_cancelled`
- `one_time_report_purchased`

Billing event metadata should include user id, plan id, billing provider customer/subscription id,
business count, advisor seat count, and event source. It should not include financial statement
values, OAuth tokens, buyer PII, or raw uploaded file content.
