export type CommercialPlan = {
  name: string;
  price: string;
  sub: string;
  who: string;
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
    name: "Essentials",
    price: "$99",
    sub: "/month",
    who: "Owner-operator",
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
    name: "Exit Ready",
    price: "$249",
    sub: "/month",
    who: "Preparing to sell",
    highlighted: true,
    features: [
      "Everything in Essentials",
      "Public buyer-safe teaser sharing",
      "Data room with 5 GB included",
      "PDF report exports",
      "Up to 3 advisor reviewers",
    ],
    limits: ["1 business", "Unlimited scenarios", "Buyer lead workflow included"],
    buyerTeaser: "public_sharing",
  },
  {
    name: "Advisor Partner",
    price: "$349",
    sub: "/seat / month",
    who: "CPAs, brokers, and exit advisors",
    features: [
      "Client workspace management",
      "Advisor review workflow",
      "Reusable report and teaser workflows",
      "Up to 10 active client businesses per seat",
    ],
    limits: ["Additional client businesses priced later", "White-label reports remain a future add-on"],
    buyerTeaser: "client_sharing",
  },
  {
    name: "One-time Report",
    price: "$799",
    sub: "one-time",
    who: "Single planning report",
    features: [
      "One business valuation snapshot",
      "Recommendations included",
      "PDF export",
      "30 days of edit access",
    ],
    limits: ["No subscription", "No public buyer teaser sharing", "No ongoing import refresh"],
    buyerTeaser: "preview_only",
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
