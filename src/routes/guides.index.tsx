import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PublicPageShell } from "@/components/PublicPageShell";

export const Route = createFileRoute("/guides/")({
  head: () => ({
    meta: [
      { title: "Owner Guides: Value, Exit & Readiness | ValuRight" },
      {
        name: "description",
        content:
          "Practical guides for Main Street owners 55+ — how to value a small business, SDE, owner dependence, exit strategy, and how to sell.",
      },
      {
        property: "og:title",
        content: "Owner Guides: Value, Exit & Readiness | ValuRight",
      },
      {
        property: "og:description",
        content:
          "Practical guides for Main Street owners 55+ — how to value a small business, SDE, owner dependence, exit strategy, and how to sell.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://valuright.ai/guides" },
    ],
    links: [{ rel: "canonical", href: "https://valuright.ai/guides" }],
  }),
  component: GuidesHub,
});

const GUIDES = [
  {
    to: "/what-is-my-business-worth" as const,
    title: "What is my business worth?",
    blurb: "Free planning range (tool page)",
  },
  {
    to: "/guides/how-to-value-a-small-business" as const,
    title: "How to value a small business",
    blurb: "SDE, multiples, and what moves the range",
  },
  {
    to: "/guides/sde-explained" as const,
    title: "What is SDE?",
    blurb: "Seller’s Discretionary Earnings for Main Street",
  },
  {
    to: "/guides/owner-dependence" as const,
    title: "Owner dependence",
    blurb: "Why buyers discount when the business is still a job you own",
  },
  {
    to: "/guides/exit-strategy-retirement" as const,
    title: "Business exit strategy for retirement",
    blurb: "Timeline, value drivers, and runway for owners 55+",
  },
  {
    to: "/guides/how-to-sell-my-business" as const,
    title: "How to sell my business",
    blurb: "Owner checklist before you list or take meetings",
  },
];

function GuidesHub() {
  return (
    <PublicPageShell
      eyebrow="Owner’s guides"
      title="Owner guides"
      description="Practical homework for Main Street owners 55+ planning the next chapter — valuation, SDE, owner dependence, exit strategy, and selling readiness. Planning estimates, not certified appraisals."
      updated="September 15, 2026"
    >
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-sm"
        >
          Start your free valuation <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/what-is-my-business-worth"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition"
        >
          What is my business worth?
        </Link>
      </div>

      <ul className="space-y-4">
        {GUIDES.map((g) => (
          <li key={g.to}>
            <Link
              to={g.to}
              className="block rounded-xl border border-border bg-card p-5 transition hover:border-accent hover:shadow-sm"
            >
              <p className="font-display text-lg font-semibold text-primary">{g.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{g.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </PublicPageShell>
  );
}
