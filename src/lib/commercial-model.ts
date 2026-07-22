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
  buyerTeaser: "preview_only" | "public_sharing" | "client_sharing";
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
  durationDays: 14,
  businesses: 1,
  advisors: 0,
  scenarios: 2,
  reports: "watermarked preview only",
  buyerTeaser: "draft preview only; public sharing is gated to Exit Ready or Advisor Partner",
  dataRoomStorage: "not included",
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
      "Two active what-if scenarios",
    ],
    limits: ["1 business", "Manual, CSV, Xero, and QuickBooks imports", "Watermarked report preview"],
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
      "PDF report exports",
      "Up to 3 advisor reviewers",
    ],
    limits: ["1 business", "Unlimited scenarios", "Buyer lead workflow included"],
    buyerTeaser: "public_sharing",
  },
  {
    slug: "advisor-partner",
    name: "Advisor Partner",
    price: "$349",
    sub: "/seat / month",
    who: "CPAs, brokers, and exit advisors",
    cta: "Start Advisor Partner preview",
    features: [
      "Private data room, public teaser sharing, and PDF exports",
      "Up to 3 advisor reviewers per business",
      "Planned: client portfolio workspace",
      "Planned: white-label reports",
    ],
    limits: ["1 business per seat today", "Additional client businesses and white-label reports are planned"],
    buyerTeaser: "client_sharing",
  },
];

export const BILLING_EVENTS = [
  "trial_started",
  "trial_expired",
  "subscription_started",
  "subscription_plan_changed",
  "payment_failed",
  "payment_recovered",
  "subscription_cancelled",
  "one_time_report_purchased",
] as const;

export function buyerTeaserPolicy(plan: CommercialPlan) {
  if (plan.buyerTeaser === "public_sharing") return "Public teaser sharing included";
  if (plan.buyerTeaser === "client_sharing") return "Client teaser sharing included";
  return "Draft preview only";
}

export function commercialPlanBySlug(slug: string | null | undefined) {
  if (!slug) return null;
  return COMMERCIAL_PLANS.find((plan) => plan.slug === slug) ?? null;
}
