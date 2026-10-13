/** Single source of truth for the ValuRight entity description (SEO/AEO). */
export const ENTITY =
  "ValuRight.ai is exit-planning and business valuation software for Main Street small-business owners 55+. It gives a free planning range, a Health Score, and what-if scenarios using seven valuation methods. It is a planning estimate, not a certified appraisal.";

const ENTITY_SENTENCES = ENTITY.split(/(?<=\.)\s+(?=[A-Z])/);

/** First sentence only (for tight spaces such as the logo tag). */
export const ENTITY_FIRST_SENTENCE = ENTITY_SENTENCES[0];

/** First two sentences (for length-limited meta descriptions). */
export const ENTITY_SHORT = ENTITY_SENTENCES.slice(0, 2).join(" ");

export type SiteLink = { href: string; label: string };

export const RELATED_GUIDE_LINKS: SiteLink[] = [
  { href: "/guides/how-to-value-a-small-business", label: "How to value a small business" },
  { href: "/guides/sde-explained", label: "What is SDE (seller's discretionary earnings)?" },
  { href: "/guides/owner-dependence", label: "How owner dependence affects value" },
  { href: "/guides/exit-readiness", label: "Exit readiness and your Health Score" },
  { href: "/guides/exit-strategy-retirement", label: "Business exit strategy for retirement" },
  { href: "/guides/how-to-sell-my-business", label: "How to sell my small business" },
  { href: "/methodology", label: "How ValuRight values a business (methodology)" },
];

export const INDUSTRY_WORTH_LINKS: SiteLink[] = [
  { href: "/what-is-my-business-worth", label: "What is my business worth? (free planning range)" },
  { href: "/what-is-my-rv-park-worth", label: "What is my RV park or campground worth?" },
  { href: "/what-is-my-hvac-business-worth", label: "What is my HVAC business worth?" },
  { href: "/what-is-my-dental-practice-worth", label: "What is my dental practice worth?" },
];

export const FOOTER_GUIDE_LINKS: SiteLink[] = [
  { href: "/guides/how-to-value-a-small-business", label: "How to value a small business" },
  { href: "/guides/sde-explained", label: "What is SDE?" },
  { href: "/guides/owner-dependence", label: "Owner dependence" },
  { href: "/guides/exit-readiness", label: "Exit readiness & Health Score" },
  { href: "/guides/exit-strategy-retirement", label: "Exit strategy for retirement" },
  { href: "/guides/how-to-sell-my-business", label: "How to sell my business" },
];

export const FOOTER_SITE_LINKS: SiteLink[] = [
  { href: "/methodology", label: "Methodology" },
  { href: "/what-is-my-business-worth", label: "What's my business worth?" },
];

export const FOOTER_INDUSTRY_LINKS: SiteLink[] = [
  { href: "/what-is-my-rv-park-worth", label: "RV park / campground worth" },
  { href: "/what-is-my-hvac-business-worth", label: "HVAC business worth" },
  { href: "/what-is-my-dental-practice-worth", label: "Dental practice worth" },
];
