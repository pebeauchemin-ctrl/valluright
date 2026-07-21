import type { BillingPlan } from "./stripe.server";

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

export function hasEntitlement(plan: BillingPlan, entitlement: Entitlement) {
  return entitlements[plan].includes(entitlement);
}

export function planSupportsPublicTeaser(plan: BillingPlan) {
  return hasEntitlement(plan, "buyer_teaser_public");
}
