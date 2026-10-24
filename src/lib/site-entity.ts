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
  { href: "/what-is-my-plumbing-business-worth", label: "What is my plumbing business worth?" },
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
  { href: "/what-is-my-plumbing-business-worth", label: "Plumbing business worth" },
];

// ---------------------------------------------------------------------------
// Sitewide entity schema (SEO item 4). One Organization + one Person node,
// identical on every page; pages reference them by @id.
// ---------------------------------------------------------------------------

export const SITE_URL = "https://valuright.ai/";
export const ORGANIZATION_ID = "https://valuright.ai/#organization";
export const FOUNDER_ID = "https://valuright.ai/#founder";
export const LOGO_URL = "https://valuright.ai/logo.png";

/**
 * Organization sameAs: personal profile + company page. Append directory
 * listings (item 7) here once they are live. No placeholder URLs.
 */
export const ORG_SAME_AS: string[] = [
  "https://www.linkedin.com/in/paulbeauchemin1",
  "https://www.linkedin.com/company/valuright-ai/",
];

/** Person sameAs: founder personal profile only (not the company page). */
export const PERSON_SAME_AS: string[] = ["https://www.linkedin.com/in/paulbeauchemin1"];

/** Reference to the sitewide Organization, for publisher/author fields. */
export const ORGANIZATION_REF = { "@id": ORGANIZATION_ID } as const;

export const ORGANIZATION_NODE = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "ValuRight.ai",
  alternateName: "ValuRight",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    "@id": "https://valuright.ai/#logo",
    url: LOGO_URL,
    width: 512,
    height: 512,
  },
  description: ENTITY,
  founder: { "@id": FOUNDER_ID },
  sameAs: ORG_SAME_AS,
};

export const FOUNDER_NODE = {
  "@type": "Person",
  "@id": FOUNDER_ID,
  name: "Paul Beauchemin",
  jobTitle: "Founder",
  worksFor: ORGANIZATION_REF,
  sameAs: PERSON_SAME_AS,
};

/** JSON-LD graph rendered once on every page (from the root route). */
export const SITE_ENTITY_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [ORGANIZATION_NODE, FOUNDER_NODE],
});

/** Monthly plan offers; prices come from the commercial model (no ratings/reviews). */
export function buildSoftwareApplicationNode(
  plans: { name: string; price: string; sub: string }[],
  freeName: string,
) {
  const pricingUrl = "https://valuright.ai/pricing";
  return {
    "@type": "SoftwareApplication",
    "@id": "https://valuright.ai/#software",
    name: "ValuRight.ai",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: ENTITY,
    publisher: ORGANIZATION_REF,
    offers: [
      { "@type": "Offer", name: freeName, price: "0", priceCurrency: "USD", url: pricingUrl },
      ...plans.map((plan) => {
        const price = plan.price.replace(/[^0-9.]/g, "");
        return {
          "@type": "Offer",
          name: plan.name,
          price,
          priceCurrency: "USD",
          url: pricingUrl,
          ...(plan.sub === "/month"
            ? {
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price,
                  priceCurrency: "USD",
                  billingDuration: "P1M",
                  unitText: "month",
                },
              }
            : {}),
        };
      }),
    ],
  };
}
