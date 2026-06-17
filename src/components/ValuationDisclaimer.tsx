import { Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const VALUATION_DISCLAIMER_TEXT =
  "ValuRight provides software-generated business value estimates for planning and educational purposes only. This is not a certified appraisal, fairness opinion, tax opinion, investment advice, legal advice, or guarantee of sale price. Actual market value depends on buyer demand, financing, due diligence, deal terms, industry conditions, and other factors. Valuation results are based on user-provided data and assumptions. Incorrect or incomplete financial information may materially affect the estimate.";

export const VALUATION_DISCLAIMER_SHORT =
  "Software-generated planning estimate only. Not a certified appraisal, tax advice, legal advice, investment advice, or guaranteed sale price.";

export const COUNSEL_REVIEW_TEXT =
  "Review final valuation, report, buyer-facing, legal, tax, and transaction language with qualified counsel or advisors before public launch or buyer reliance.";

type Props = {
  variant?: "card" | "inline" | "print";
  className?: string;
};

export function ValuationDisclaimer({ variant = "card", className }: Props) {
  if (variant === "inline") {
    return (
      <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
        <span className="font-semibold">Disclaimer.</span> {VALUATION_DISCLAIMER_TEXT}{" "}
        <Link to="/methodology" className="font-semibold text-accent hover:underline">
          View methodology.
        </Link>
      </p>
    );
  }
  if (variant === "print") {
    return (
      <div
        className={cn(
          "mt-8 border-t border-border pt-4 text-[10px] leading-relaxed text-muted-foreground",
          className,
        )}
      >
        <span className="font-semibold uppercase tracking-wider">Important Disclaimer — </span>
        {VALUATION_DISCLAIMER_TEXT}
      </div>
    );
  }
  return (
    <div
      className={cn("rounded-lg border border-border bg-secondary/40 p-4 flex gap-3", className)}
      role="note"
      aria-label="Valuation disclaimer"
    >
      <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden />
      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Disclaimer. </span>
        {VALUATION_DISCLAIMER_TEXT}{" "}
        <Link to="/methodology" className="font-semibold text-accent hover:underline">
          View methodology.
        </Link>
      </p>
    </div>
  );
}
