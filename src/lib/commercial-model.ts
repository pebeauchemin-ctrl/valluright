export type CommercialPlan = {
  slug: string;
  name: string;
  price: string;
  sub: string;
  who: string;
  cta: string;
  highlighted?: boolean;
  features: string[];
  limits: string[];
  buyerTeaser: "preview_only" | "public_sharing";
};

export type PlanComparisonCell = "included" | "not_included" | "draft_only";

export type PlanComparisonRow = {
  group: string;
  feature: string;
  advisorNote?: string;
  free: PlanComparisonCell;
  essentials: PlanComparisonCell;
  "exit-ready": PlanComparisonCell;
};

export const TARGET_CUSTOMER_SEGMENTS = [
  {
    name: "Owner self-serve",
    role: "Primary launch segment",
    description:
      "Business owners planning an exit in the next 0-5 years who need a credible planning range and a preparation roadmap.",
  },
  {
    name: "Advisor-led",
    role: "Secondary segment",
    description:
      "CPAs, exit planners, brokers, and consultants using ValuRight with client businesses during review or readiness work.",
  },
  {
    name: "Broker / CPA partner",
    role: "Partner channel",
    description:
      "Firms that need multiple client workspaces, advisor review, and repeatable reports without custom implementation.",
  },
] as const;

export const FREE_TRIAL_LIMITS = {
  name: "Free Preview",
  reports: "in-app report preview and browser print",
  buyerTeaser: "draft preview only; public sharing is gated to Exit Ready",
  dataRoomStorage: "not included",
  accountingIntegrations: "not included",
};

export const COMMERCIAL_PLANS: CommercialPlan[] = [
  {
    slug: "essentials",
    name: "Essentials",
    price: "$99",
    sub: "/month",
    who: "Owner-operator",
    cta: "Start Essentials preview",
    features: [
      "Ongoing value dashboard",
      "All six valuation methods",
      "Health Score and recommendations",
      "What-if scenario modeling",
    ],
    limits: [
      "Secure Xero and QuickBooks accounting integrations",
      "Manual CSV imports and in-app report preview",
    ],
    buyerTeaser: "preview_only",
  },
  {
    slug: "exit-ready",
    name: "Exit Ready",
    price: "$249",
    sub: "/month",
    who: "Preparing to sell",
    cta: "Start Exit Ready preview",
    highlighted: true,
    features: [
      "Everything in Essentials",
      "Public buyer-safe teaser sharing",
      "Private data room",
      "Advisor reviewer invitations",
    ],
    limits: ["Buyer lead workflow included"],
    buyerTeaser: "public_sharing",
  },
];

export const PLAN_COMPARISON_ROWS: PlanComparisonRow[] = [
  {
    group: "Valuation",
    feature: "Value dashboard and all six valuation methods",
    free: "included",
    essentials: "included",
    "exit-ready": "included",
  },
  {
    group: "Valuation",
    feature: "Health Score, recommendations, and what-if scenarios",
    free: "included",
    essentials: "included",
    "exit-ready": "included",
  },
  {
    group: "Financials",
    feature: "Manual entry and CSV financial import",
    free: "included",
    essentials: "included",
    "exit-ready": "included",
  },
  {
    group: "Financials",
    feature: "Secure QuickBooks and Xero integrations",
    free: "not_included",
    essentials: "included",
    "exit-ready": "included",
  },
  {
    group: "Reporting",
    feature: "In-app report preview and browser print",
    free: "included",
    essentials: "included",
    "exit-ready": "included",
  },
  {
    group: "Sharing with buyers",
    feature: "Build and preview a buyer-safe teaser",
    free: "draft_only",
    essentials: "draft_only",
    "exit-ready": "included",
  },
  {
    group: "Sharing with buyers",
    feature: "Publish a shareable buyer teaser and manage buyer leads",
    free: "not_included",
    essentials: "not_included",
    "exit-ready": "included",
  },
  {
    group: "Sharing with buyers",
    feature: "Private data room",
    free: "not_included",
    essentials: "not_included",
    "exit-ready": "included",
  },
  {
    group: "Advisor review",
    feature: "Invite a CPA, broker, or attorney to review",
    advisorNote: "Always free for the invited advisor",
    free: "not_included",
    essentials: "not_included",
    "exit-ready": "included",
  },
];

export const BILLING_EVENTS = [
  "subscription_started",
  "subscription_plan_changed",
  "payment_failed",
  "payment_recovered",
  "subscription_cancelled",
] as const;

export function buyerTeaserPolicy(plan: CommercialPlan) {
  if (plan.buyerTeaser === "public_sharing") return "Public teaser sharing included";
  return "Draft preview only";
}

export function commercialPlanBySlug(slug: string | null | undefined) {
  if (!slug) return null;
  return COMMERCIAL_PLANS.find((plan) => plan.slug === slug) ?? null;
}
