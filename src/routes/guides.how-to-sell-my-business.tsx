import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";
import { trackDemoClick, trackSignupStart } from "@/lib/marketing-analytics";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How to Sell My Business (Owner Checklist)",
  "description": "A practical checklist to prepare and sell a small business — clean numbers, reduce owner dependence, and know your planning range before you go to market.",
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
  "mainEntityOfPage": "https://valuright.ai/guides/how-to-sell-my-business",
  "datePublished": "2026-09-15",
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
      "name": "How to sell my business",
      "item": "https://valuright.ai/guides/how-to-sell-my-business"
    }
  ]
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How long does it take to sell a small business?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "It varies widely by industry, size, asking price, and readiness. Preparation time (books, dependence, documentation) is often the part owners control most — start that before you go to market."
      }
    },
    {
      "@type": "Question",
      "name": "Should I tell employees I might sell?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Timing and messaging are sensitive. Many owners wait until a serious process is underway and they have advisor guidance. When in doubt, ask your attorney or advisor before broad announcements."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need an appraisal to sell?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Not always for a Main Street negotiated sale — but lenders, partners, or specific deal structures may require formal valuation work. ValuRight is a planning estimate, not a certified appraisal."
      }
    },
    {
      "@type": "Question",
      "name": "What should I do this week?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Gather recent financials, run a Free Preview planning range, and write down the top three ways the business depends on you. That gives you a concrete punch list."
      }
    },
    {
      "@type": "Question",
      "name": "How do I sell a one-person / owner-only business?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Same checklist as any small sale — clean numbers, a planning range, and a transition story — with higher owner-dependence risk. Document the playbook, introduce a second face to customers if you can, and be eyes-open about transition length. See Owner dependence. We do not publish invented “discount %” for owner-only shops."
      }
    },
    {
      "@type": "Question",
      "name": "Broker vs DIY vs advisor-led — how do I choose?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Match the path to complexity, privacy needs, and how much process you want to run yourself. Preparation (range, books, dependence punch list) helps every path. This is not a “broker near me” directory."
      }
    },
    {
      "@type": "Question",
      "name": "What should be ready before buyer meetings?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A planning range, clean financials, an owner-dependence punch list, and at least a draft operating playbook. Start with Free Preview or review a sample first."
      }
    },
    {
      "@type": "Question",
      "name": "What is an LOI, in plain English?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A letter of intent is a serious-interest document that often appears before full diligence and a purchase agreement. It is not legal advice — use an attorney before you sign anything."
      }
    },
    {
      "@type": "Question",
      "name": "Free Preview vs Exit Ready when I’m selling?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Free Preview ($0) is homework: planning range and risk orientation. Exit Ready ($249/mo) is the deeper exit-focused plan on Pricing — use it when you are packaging for advisors or a process, not as a substitute for counsel."
      }
    }
  ]
};

export const Route = createFileRoute("/guides/how-to-sell-my-business")({
  head: () => ({
    meta: [
      { title: "How to Sell My Business: Owner Checklist | ValuRight" },
      { name: "description", content: "A practical checklist to prepare and sell a small business — clean numbers, reduce owner dependence, and know your planning range before you go to market." },
      {
        property: "og:title",
        content: "How to Sell My Business: Owner Checklist | ValuRight",
      },
      { property: "og:description", content: "A practical checklist to prepare and sell a small business — clean numbers, reduce owner dependence, and know your planning range before you go to market." },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: "https://valuright.ai/guides/how-to-sell-my-business",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://valuright.ai/guides/how-to-sell-my-business",
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
  component: HowToSellGuide,
});

function HowToSellGuide() {
  return (
    <PublicPageShell
      eyebrow="Owner’s guide"
      title="How to Sell My Business (Owner Checklist)"
      description="“How do I sell my business?” usually means three jobs at once: know a defensible range, make the company transferable, and choose a go-to-market path. This checklist is for Main Street owners — especially owners 55+ — who want to prepare before they list or take meetings."
      updated="September 22, 2026"
    >
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        This is <strong>not</strong> a “broker near me” funnel. Paths differ. Preparation does not.
      </p>

      <LegalSection title="Get your number first">
        <p>
          Start with a <strong>planning range</strong>, not a single hopeful asking price. Run Free
          Preview or work with your CPA on an earnings base (often SDE for owner-operated
          businesses). Cross-check more than one method so you are not hostage to one rule of thumb.
        </p>
        <p>
          Output you want: a range, the drivers that move it, and a short list of risks buyers will
          price. Begin:{" "}
          <Link to="/what-is-my-business-worth" className="font-semibold text-accent hover:underline">
            What is my business worth?
          </Link>{" "}
          · deeper methods:{" "}
          <Link
            to="/guides/how-to-value-a-small-business"
            className="font-semibold text-accent hover:underline"
          >
            How to value a small business
          </Link>{" "}
          ·{" "}
          <Link to="/guides/sde-explained" className="font-semibold text-accent hover:underline">
            SDE explained
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Clean the financials">
        <p>Buyers buy confidence in the numbers.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Consistent P&amp;Ls and balance sheets (ideally multi-year)</li>
          <li>Clear owner compensation and personal expenses</li>
          <li>Honest, documented add-backs only</li>
          <li>Separate personal from business spend going forward</li>
          <li>Be ready to explain one-time items</li>
        </ul>
        <p>Messy books slow deals and invite discounts. Clean books speed diligence.</p>
      </LegalSection>

      <LegalSection title="Reduce owner dependence">
        <p>
          If revenue, relationships, or know-how leave when you leave, expect a thinner buyer pool or
          a longer transition. Practical moves:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Document top recurring processes</li>
          <li>Put a second face on key accounts well before a sale</li>
          <li>Hire or promote day-to-day ops coverage</li>
          <li>Test real time away from the business</li>
        </ul>
        <p>
          Details:{" "}
          <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
            Owner dependence
          </Link>
          . Plan months to years — not a week before listing.
        </p>
      </LegalSection>

      <LegalSection title="Document the playbook">
        <p>
          Write down (or record) how work actually gets done: sales, fulfillment/service, pricing,
          vendors, hiring basics, and monthly financial routines. A buyer is purchasing an asset they
          can operate — not your memory.
        </p>
      </LegalSection>

      <LegalSection title="Decide path (broker, advisor, DIY)">
        <p>Common paths:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Business broker / M&amp;A advisor</strong> — marketed process, broader reach; fees
            and fit vary
          </li>
          <li>
            <strong>Advisor-led or CPA-introduced</strong> — quieter conversations
          </li>
          <li>
            <strong>DIY / direct</strong> — possible for simple situations; you still need legal and
            tax help
          </li>
        </ul>
        <p>
          Choose based on complexity, privacy, and how much process you want to run yourself.
          Preparation (range, books, dependence, playbook) helps <strong>every</strong> path. Avoid
          optimizing for “broker near me” intent — keep the focus on readiness and Free Preview.
        </p>
      </LegalSection>

      <LegalSection title="What Free Preview vs Exit Ready covers">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-semibold text-foreground" />
                <th className="py-2 pr-3 font-semibold text-foreground">Free Preview ($0)</th>
                <th className="py-2 pr-3 font-semibold text-foreground">Essentials ($99/mo)</th>
                <th className="py-2 font-semibold text-foreground">Exit Ready ($249/mo)</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/60">
                <td className="py-2 pr-3 font-medium text-foreground">Planning range / seven methods</td>
                <td className="py-2 pr-3">Yes</td>
                <td className="py-2 pr-3">Yes</td>
                <td className="py-2">Yes</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-3 font-medium text-foreground">Health Score + recommendations</td>
                <td className="py-2 pr-3">Yes</td>
                <td className="py-2 pr-3">Yes</td>
                <td className="py-2">Yes</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-3 font-medium text-foreground">What-if scenarios</td>
                <td className="py-2 pr-3">Yes</td>
                <td className="py-2 pr-3">Yes</td>
                <td className="py-2">Yes</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-3 font-medium text-foreground">QuickBooks / Xero</td>
                <td className="py-2 pr-3">—</td>
                <td className="py-2 pr-3">Adds</td>
                <td className="py-2">Adds</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-medium text-foreground">
                  Buyer teaser, data room, advisor review
                </td>
                <td className="py-2 pr-3">—</td>
                <td className="py-2 pr-3">—</td>
                <td className="py-2">Aimed at go-to-market readiness</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Exact packaging should match live{" "}
          <Link to="/pricing" search={{ checkout: undefined }} className="font-semibold text-accent hover:underline">
            pricing
          </Link>
          . CTA stays Free Preview first; Exit Ready is the “ready to package for buyers” step later.
        </p>
        <p className="text-xs">{VALUATION_DISCLAIMER_SHORT}</p>
      </LegalSection>

      <LegalSection title="FAQ">
        <div>
          <p className="font-semibold text-foreground">How long does it take to sell a small business?</p>
          <p className="mt-1">
            It varies widely by industry, size, asking price, and readiness. Preparation time (books, dependence, documentation) is often the part owners control most — start that before you go to market.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Should I tell employees I might sell?</p>
          <p className="mt-1">
            Timing and messaging are sensitive. Many owners wait until a serious process is underway and they have advisor guidance. When in doubt, ask your attorney or advisor before broad announcements.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Do I need an appraisal to sell?</p>
          <p className="mt-1">
            Not always for a Main Street negotiated sale — but lenders, partners, or specific deal structures may require formal valuation work. ValuRight is a planning estimate, not a certified appraisal.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">What should I do this week?</p>
          <p className="mt-1">
            Gather recent financials, run a Free Preview planning range, and write down the top three ways the business depends on you. That gives you a concrete punch list.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">How do I sell a one-person / owner-only business?</p>
          <p className="mt-1">
            Same checklist as any small sale — clean numbers, a planning range, and a transition story — with <strong>higher owner-dependence risk</strong>. Document the playbook, introduce a second face to customers if you can, and be eyes-open about transition length. See <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">Owner dependence</Link>. We do not publish invented “discount %” for owner-only shops.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Broker vs DIY vs advisor-led — how do I choose?</p>
          <p className="mt-1">
            Match the path to complexity, privacy needs, and how much process you want to run yourself. Preparation (range, books, dependence punch list) helps <strong>every</strong> path. This is not a “broker near me” directory.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">What should be ready before buyer meetings?</p>
          <p className="mt-1">
            A planning range, clean financials, an owner-dependence punch list, and at least a draft operating playbook. Start with <Link to="/auth" search={{ mode: "signup" }} className="font-semibold text-accent hover:underline">Free Preview</Link> or review a <Link to="/demo" className="font-semibold text-accent hover:underline">sample</Link> first.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">What is an LOI, in plain English?</p>
          <p className="mt-1">
            A <strong>letter of intent</strong> is a serious-interest document that often appears before full diligence and a purchase agreement. It is not legal advice — use an attorney before you sign anything.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Free Preview vs Exit Ready when I’m selling?</p>
          <p className="mt-1">
            <strong>Free Preview</strong> ($0) is homework: planning range and risk orientation. <strong>Exit Ready</strong> ($249/mo) is the deeper exit-focused plan on <Link to="/pricing" search={{ checkout: undefined }} className="font-semibold text-accent hover:underline">Pricing</Link> — use it when you are packaging for advisors or a process, not as a substitute for counsel.
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
          <Link to="/guides/exit-strategy-retirement" className="font-semibold text-accent hover:underline">
            Exit strategy for retirement
          </Link>
          <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
            Owner dependence
          </Link>
          <Link to="/methodology" className="font-semibold text-accent hover:underline">
            Methodology
          </Link>
          <Link to="/pricing" search={{ checkout: undefined }} className="font-semibold text-accent hover:underline">
            Pricing
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
