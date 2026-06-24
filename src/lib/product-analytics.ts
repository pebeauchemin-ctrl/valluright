export const PRODUCT_FUNNEL_EVENTS = [
  "signup_completed",
  "company_created",
  "financial_data_added",
  "valuation_generated",
  "recommendation_viewed",
  "scenario_saved",
  "buyer_teaser_generated",
  "report_exported",
  "advisor_invited",
] as const;

export type ProductFunnelEvent = (typeof PRODUCT_FUNNEL_EVENTS)[number];

export const PRODUCT_FUNNEL_STEPS: ReadonlyArray<{
  eventName: ProductFunnelEvent;
  label: string;
  description: string;
}> = [
  {
    eventName: "signup_completed",
    label: "Signed up",
    description: "Account was created.",
  },
  {
    eventName: "company_created",
    label: "Company created",
    description: "Business profile was saved.",
  },
  {
    eventName: "financial_data_added",
    label: "Financial data added",
    description: "Manual, CSV/XLSX, Xero, or QuickBooks data was saved.",
  },
  {
    eventName: "valuation_generated",
    label: "Valuation generated",
    description: "A valuation snapshot was created.",
  },
  {
    eventName: "recommendation_viewed",
    label: "Recommendations viewed",
    description: "User opened or generated improvement recommendations.",
  },
  {
    eventName: "scenario_saved",
    label: "Scenario saved",
    description: "A what-if scenario was saved.",
  },
  {
    eventName: "buyer_teaser_generated",
    label: "Buyer teaser generated",
    description: "Buyer-safe teaser settings were saved or published.",
  },
  {
    eventName: "report_exported",
    label: "Report exported",
    description: "A printable/PDF report was generated.",
  },
  {
    eventName: "advisor_invited",
    label: "Advisor invited",
    description: "An advisor invite record was created.",
  },
];

export const PRODUCT_ANALYTICS_PRIVACY_NOTE =
  "Analytics events intentionally store workflow status and counts only. They must not include financial values, buyer or advisor contact details, OAuth tokens, uploaded file contents, free-text notes, or messages.";

export function productFunnelProgress(events: { event_name: string; created_at: string }[]) {
  return PRODUCT_FUNNEL_STEPS.map((step) => {
    const matches = events
      .filter((event) => event.event_name === step.eventName)
      .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
    return {
      ...step,
      completed: matches.length > 0,
      count: matches.length,
      firstSeenAt: matches[0]?.created_at ?? null,
      lastSeenAt: matches[matches.length - 1]?.created_at ?? null,
    };
  });
}
