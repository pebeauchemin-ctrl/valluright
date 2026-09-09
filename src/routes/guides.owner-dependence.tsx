import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";

export const Route = createFileRoute("/guides/owner-dependence")({
  head: () => ({
    meta: [
      { title: "Owner Dependence: Why Buyers Discount Your Business | ValuRight" },
      {
        name: "description",
        content:
          "If the business can’t run without you, buyers pay less. See what owner dependence costs and what to fix before you sell — plus a free ValuRight Health Score.",
      },
      {
        property: "og:title",
        content: "Owner Dependence: Why Buyers Discount Your Business | ValuRight",
      },
      {
        property: "og:description",
        content:
          "If the business can’t run without you, buyers pay less. See what owner dependence costs and what to fix before you sell — plus a free ValuRight Health Score.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: "https://valuright.ai/guides/owner-dependence",
      },
    ],
    links: [
      { rel: "canonical", href: "https://valuright.ai/guides/owner-dependence" },
    ],
  }),
  component: OwnerDependenceGuide,
});

function OwnerDependenceGuide() {
  return (
    <PublicPageShell
      eyebrow="Owner’s guide"
      title="Owner Dependence: Why Buyers Discount Your Business"
      description="Buyers ask a blunt question: “What happens when you leave?” If the honest answer is that revenue, relationships, or know-how walk out with you, they treat the company as riskier — and they pay accordingly."
      updated="September 9, 2026"
    >
      <LegalSection title="Why it hits the price">
        <p>
          Owner dependence thins the buyer pool, invites earnouts or longer seller transitions, and
          compresses the multiple. A business that is still a job you own is harder to transfer than
          a business that is an asset someone else can operate.
        </p>
      </LegalSection>

      <LegalSection title="How to spot it">
        <p>
          You are the primary rainmaker. Pricing, vendor, and customer knowledge live in your head.
          A two-week vacation with little phone access would break service or sales. Key accounts
          only want to talk to you.
        </p>
      </LegalSection>

      <LegalSection title="What actually helps">
        <p>
          Hire or promote operations leadership. Document the top recurring processes. Introduce a
          second face on key accounts well before a sale. Test the business with real time away.
          Plan on 12–24 months of deliberate work — a last-minute scramble rarely fools diligence.
        </p>
      </LegalSection>

      <LegalSection title="How ValuRight helps">
        <p>
          The Health Score and recommendations flag owner-dependence style risks early. What-if
          scenarios let you explore changes such as reducing owner hours and see how they may affect
          the planning range — still an estimate, not an appraisal.
        </p>
        <p className="text-xs">{VALUATION_DISCLAIMER_SHORT}</p>
      </LegalSection>

      <div className="mt-10 space-y-4 rounded-xl border border-border bg-card p-6">
        <p className="font-display text-xl font-semibold text-primary">Next steps</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-sm"
          >
            Start your free valuation <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/demo"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition"
          >
            See a sample report
          </Link>
        </div>
        <div className="flex flex-wrap gap-4 pt-2 text-sm">
          <Link
            to="/guides/how-to-value-a-small-business"
            className="font-semibold text-accent hover:underline"
          >
            Related: How to value a small business
          </Link>
          <Link
            to="/what-is-my-business-worth"
            className="font-semibold text-accent hover:underline"
          >
            Related: What is my business worth?
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
