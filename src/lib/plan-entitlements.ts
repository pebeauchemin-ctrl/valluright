export type BillingPlan =
  | "free"
  | "essentials"
  | "exit-ready"
  | "advisor-partner"
  | "one-time-report";

export type BillingStatus =
  | "free"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired";

export type Entitlement =
  | "accounting_import"
  | "buyer_teaser_public"
  | "data_room"
  | "advisor_review"
  | "one_time_report";

const ACTIVE_STATUSES: readonly BillingStatus[] = ["active", "trialing", "past_due"];
const EXPIRY_GRACE_MS = 60 * 60 * 1000;

const entitlements: Record<BillingPlan, readonly Entitlement[]> = {
  free: [],
  essentials: ["accounting_import"],
  "exit-ready": [
    "accounting_import",
    "buyer_teaser_public",
    "data_room",
    "advisor_review",
  ],
  "advisor-partner": [
    "accounting_import",
    "buyer_teaser_public",
    "data_room",
    "advisor_review",
  ],
  "one-time-report": ["one_time_report"],
};

export function subscriptionIsActive(
  plan: BillingPlan,
  status: BillingStatus,
  currentPeriodEnd: string | null | undefined,
  now = Date.now(),
) {
  if (plan === "free" || !ACTIVE_STATUSES.includes(status)) return false;
  const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd).getTime() : Number.NaN;
  return Number.isFinite(periodEnd) && periodEnd + EXPIRY_GRACE_MS > now;
}

export function hasEntitlement(
  plan: BillingPlan,
  status: BillingStatus,
  entitlement: Entitlement,
  currentPeriodEnd: string | null | undefined,
  now?: number,
) {
  return (
    subscriptionIsActive(plan, status, currentPeriodEnd, now) &&
    entitlements[plan].includes(entitlement)
  );
}
