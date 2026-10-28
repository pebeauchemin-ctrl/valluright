import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

// REB-40: "Join the pilot" CTA. Copy is CMO template 5 verbatim ([SPOT COUNT] = 5).
// Remove from the pages once the pilot spots are filled.
export const PILOT_CTA = {
  headline: "Help shape ValuRight and get 60 days of Exit Ready free",
  subhead:
    "We’re inviting 5 business owners and advisors to try our Exit Ready plan ($249/mo) at no cost and tell us honestly what works and what doesn’t.",
  button: "Join the pilot",
  terms:
    "Free for 60 days in exchange for two recorded calls, a short survey, and permission to quote you (you approve it); 30% off for 12 months if you stay on. No card needed.",
};

export function PilotCta({ variant = "band" }: { variant?: "band" | "compact" }) {
  const button = (
    <Link
      to="/pilot"
      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
    >
      {PILOT_CTA.button} <ArrowRight className="h-4 w-4" />
    </Link>
  );

  if (variant === "compact") {
    return (
      <div className="mx-auto mb-8 flex max-w-5xl flex-col gap-4 rounded-xl border border-accent/40 bg-accent/5 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-primary">{PILOT_CTA.headline}</p>
          <p className="mt-1 text-sm text-muted-foreground">{PILOT_CTA.subhead}</p>
          <p className="mt-2 text-xs text-muted-foreground">{PILOT_CTA.terms}</p>
        </div>
        {button}
      </div>
    );
  }

  return (
    <section aria-label="Join the pilot" className="border-t border-border/60 bg-primary/5">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <h2 className="font-display text-2xl font-semibold text-primary md:text-3xl">
            {PILOT_CTA.headline}
          </h2>
          <p className="mt-2 text-base text-muted-foreground">{PILOT_CTA.subhead}</p>
          <p className="mt-3 text-xs text-muted-foreground">{PILOT_CTA.terms}</p>
        </div>
        {button}
      </div>
    </section>
  );
}
