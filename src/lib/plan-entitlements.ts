export type BillingPlan = "free" | "essentials" | "exit-ready" | "advisor-partner" | "one-time-report";
export type BillingStatus = "free" | "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired";

export type Entitlement =
  | "buyer_teaser_public"
  | "data_room"
  | "pdf_export"
  | "advisor_review"
  | "one_time_report";

export const FREE_TIER = {
  businesses: 1,
  scenarios: 2,
  report: "watermarked preview",
  buyerTeaser: "draft only",
  dataRoom: false,
} as const;

const entitlements: Record<BillingPlan, readonly Entitlement[]> = {
  free: [],
  essentials: [],
  "exit-ready": ["buyer_teaser_public", "data_room", "pdf_export", "advisor_review"],
  "advisor-partner": ["buyer_teaser_public", "data_room", "pdf_export", "advisor_review"],
  "one-time-report": ["one_time_report", "pdf_export"],
};

export function subscriptionIsActive(plan: BillingPlan, status: BillingStatus) {
  return plan !== "free" && ["active", "trialing", "past_due"].includes(status);
}

export function hasEntitlement(plan: BillingPlan, status: BillingStatus, entitlement: Entitlement) {
  return subscriptionIsActive(plan, status) && entitlements[plan].includes(entitlement);
}
