import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";
import { trackDemoClick, trackSignupStart } from "@/lib/marketing-analytics";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How to Value a Small Business (Owner’s Guide)",
  "description": "Learn how Main Street buyers price a small business — SDE, multiples, and what moves the range. Then run a free ValuRight planning estimate.",
  "author": {
    "@type": "Organization",
    "name": "ValuRight"
  },
  "publisher": {
    "@type": "Organization",
    "name": "ValuRight",
    "logo": {
      "@type": "ImageObject",
      "url": "https://valuright.ai/favicon.svg"
    }
  },
  "mainEntityOfPage": "https://valuright.ai/guides/how-to-value-a-small-business",
  "datePublished": "2026-09-09",
  "dateModified": "2026-09-22"
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://valuright.ai/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Guides",
      "item": "https://valuright.ai/guides"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "How to value a small business",
      "item": "https://valuright.ai/guides/how-to-value-a-small-business"
    }
  ]
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is there one number for what my business is worth?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Usually no. Buyers think in a planning range built from earnings and risk (transferability, concentration, documentation), not a single multiple on a napkin. Use the range for homework before you set an asking price with advisors. It is not a certified appraisal."
      }
    },
    {
      "@type": "Question",
      "name": "Should I use SDE or EBITDA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "If you still run day-to-day sales and ops, buyers usually start with Seller’s Discretionary Earnings (SDE) — the total annual benefit to one full-time owner-operator. More professionally managed companies often discuss EBITDA. The wrong earnings base misprices every later conversation. See What is SDE?."
      }
    },
    {
      "@type": "Question",
      "name": "What does the “2×–4× SDE” band on this page mean?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "It is rough Main Street planning shorthand already stated on this page — not a promise, not an industry comps table, and not your sale price. Industry, size, growth, and transferability move where a buyer lands inside (or outside) that band. Cross-check with Methodology and Owner dependence."
      }
    },
    {
      "@type": "Question",
      "name": "Why check more than one valuation method?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A single rule of thumb is fragile. ValuRight blends several methods appropriate to the business into a headline planning range with confidence notes. See How ValuRight values a small business or start a Free Preview."
      }
    },
    {
      "@type": "Question",
      "name": "What should I do with a planning range?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Compare it to your retirement or walk-away number, pick which risks to fix first (especially owner dependence), then talk to a CPA or broker before you publish an asking price. The range is homework — not a listing price by itself."
      }
    },
    {
      "@type": "Question",
      "name": "Does Free Preview replace an appraisal?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Free Preview is a software-generated planning estimate for owners getting oriented. Use a formal appraisal when lenders, courts, tax, or a purchase agreement require one."
      }
    }
  ]
};

export const Route = createFileRoute("/guides/how-to-value-a-small-business")({
  head: () => ({
    meta: [
      { title: "How to Value a Small Business (Owner’s Guide) | ValuRight" },
      {
        name: "description",
        content:
          "Learn how Main Street buyers price a small business — SDE, multiples, and what moves the range. Then run a free ValuRight planning estimate.",
      },
      {
        property: "og:title",
        content: "How to Value a Small Business (Owner’s Guide) | ValuRight",
      },
      {
        property: "og:description",
        content:
          "Learn how Main Street buyers price a small business — SDE, multiples, and what moves the range. Then run a free ValuRight planning estimate.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: "https://valuright.ai/guides/how-to-value-a-small-business",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://valuright.ai/guides/how-to-value-a-small-business",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(articleLd),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbLd),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(faqLd),
      },
    ],
  }),
  component: HowToValueGuide,
});

function HowToValueGuide() {
  return (
    <PublicPageShell
      eyebrow="Owner’s guide"
      title="How to Value a Small Business (Owner’s Guide)"
      description="Buyers almost never pay one napkin number. They work a planning range from earnings quality and risk — and a planning estimate is not an appraisal or an asking price."
      updated="September 22, 2026"
    >
      <LegalSection title="Pick the earnings base">
        <p>
          If you still run day-to-day sales and ops, buyers usually care about Seller’s Discretionary
          Earnings (SDE): the total annual benefit to one full-time owner-operator. If a management
          team can run the company without you, EBITDA becomes more relevant. Using the wrong base
          misprices the business.
        </p>
      </LegalSection>

      <LegalSection title="How SDE is typically built">
        <p>
          Start from profit, then add back one owner’s compensation and perks, interest, taxes,
          depreciation/amortization, and documented one-time or personal expenses that a new owner
          would not keep. Keep add-backs honest — buyers and lenders will ask for proof.
        </p>
      </LegalSection>

      <LegalSection title="Apply a market multiple">
        <p>
          Main Street owner-operated businesses often trade in a rough band around 2×–4× SDE, with
          industry, size, growth, and risk moving the multiple. Recurring revenue, clean books, and
          transferable operations support the higher end. Owner dependence, customer concentration,
          and thin documentation pull it down.
        </p>
      </LegalSection>

      <div className="my-8 rounded-xl border border-accent/20 bg-accent-soft/40 p-6 text-center">
        <p className="font-display text-lg font-semibold text-primary">
          Ready for a planning range built from multiple methods?
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Free Preview takes about 15 minutes — no credit card.
        </p>
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          onClick={trackSignupStart}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-sm"
        >
          Start your free valuation <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <LegalSection title="Cross-check more than one method">
        <p>
          A single rule of thumb is fragile. ValuRight blends several methods — including SDE and
          EBITDA multiples, revenue sanity checks, simplified DCF, asset-based floor, comparable-sales
          context, and cap rate / NOI when the business is income-property oriented (for example RV
          parks and campgrounds) — into a planning range with confidence notes.
        </p>
      </LegalSection>

      <LegalSection title="What to do with the range">
        <p>
          Use it to decide whether you are ready to talk to a CPA or broker, which risks to fix
          first, and whether your retirement number and the business’s planning range are even in
          the same zip code. Then review assumptions with a qualified advisor before you set an
          asking price.
        </p>
        <p className="text-xs">{VALUATION_DISCLAIMER_SHORT}</p>
      </LegalSection>

      <LegalSection title="FAQ">
        <div>
          <p className="font-semibold text-foreground">Is there one number for what my business is worth?</p>
          <p className="mt-1">
            Usually no. Buyers think in a <strong>planning range</strong> built from earnings and risk (transferability, concentration, documentation), not a single multiple on a napkin. Use the range for homework before you set an asking price with advisors. It is not a certified appraisal.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Should I use SDE or EBITDA?</p>
          <p className="mt-1">
            If you still run day-to-day sales and ops, buyers usually start with <strong>Seller’s Discretionary Earnings (SDE)</strong> — the total annual benefit to one full-time owner-operator. More professionally managed companies often discuss <strong>EBITDA</strong>. The wrong earnings base misprices every later conversation. See <Link to="/guides/sde-explained" className="font-semibold text-accent hover:underline">What is SDE?</Link>.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">What does the “2×–4× SDE” band on this page mean?</p>
          <p className="mt-1">
            It is <strong>rough Main Street planning shorthand</strong> already stated on this page — not a promise, not an industry comps table, and not your sale price. Industry, size, growth, and transferability move where a buyer lands inside (or outside) that band. Cross-check with <Link to="/methodology" className="font-semibold text-accent hover:underline">Methodology</Link> and <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">Owner dependence</Link>.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Why check more than one valuation method?</p>
          <p className="mt-1">
            A single rule of thumb is fragile. ValuRight blends several methods appropriate to the business into a <strong>headline planning range</strong> with confidence notes. See <Link to="/methodology" className="font-semibold text-accent hover:underline">How ValuRight values a small business</Link> or start a <Link to="/auth" search={{ mode: "signup" }} className="font-semibold text-accent hover:underline">Free Preview</Link>.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">What should I do with a planning range?</p>
          <p className="mt-1">
            Compare it to your retirement or walk-away number, pick which risks to fix first (especially owner dependence), then talk to a CPA or broker before you publish an asking price. The range is homework — not a listing price by itself.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Does Free Preview replace an appraisal?</p>
          <p className="mt-1">
            No. Free Preview is a software-generated planning estimate for owners getting oriented. Use a formal appraisal when lenders, courts, tax, or a purchase agreement require one.
          </p>
        </div>
      </LegalSection>

      <div className="mt-10 space-y-4 rounded-xl border border-border bg-card p-6">
        <p className="font-display text-xl font-semibold text-primary">Next steps</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            onClick={trackSignupStart}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-sm"
          >
            Start your free valuation <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/demo" onClick={trackDemoClick}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition"
          >
            See a sample
          </Link>
        </div>
        <div className="flex flex-wrap gap-4 pt-2 text-sm">
          <Link to="/guides/sde-explained" className="font-semibold text-accent hover:underline">
            Related: What is SDE?
          </Link>
          <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
            Related: Owner dependence
          </Link>
          <Link to="/what-is-my-business-worth" className="font-semibold text-accent hover:underline">
            Related: What is my business worth?
          </Link>
          <Link to="/methodology" className="font-semibold text-accent hover:underline">
            Related: Methodology
          </Link>
          <Link to="/guides" className="font-semibold text-accent hover:underline">
            All guides
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
