import { Check, Minus } from "lucide-react";
import {
  COMMERCIAL_PLANS,
  FREE_TRIAL_LIMITS,
  PLAN_COMPARISON_ROWS,
  type PlanComparisonCell,
} from "@/lib/commercial-model";

const columns = [
  { slug: "free", name: FREE_TRIAL_LIMITS.name },
  ...COMMERCIAL_PLANS.map((plan) => ({ slug: plan.slug, name: plan.name })),
] as const;

function Cell({ value }: { value: PlanComparisonCell }) {
  if (value === "included") {
    return (
      <span className="inline-flex items-center justify-center gap-1.5 font-medium text-foreground">
        <Check className="h-4 w-4 text-accent" aria-hidden="true" />
        Included
      </span>
    );
  }

  if (value === "draft_only") {
    return <span className="font-medium text-muted-foreground">Draft only</span>;
  }

  return (
    <span className="inline-flex items-center justify-center gap-1.5 text-muted-foreground">
      <Minus className="h-4 w-4" aria-hidden="true" />
      Not included
    </span>
  );
}

export function PlanComparisonMatrix({ className = "" }: { className?: string }) {
  return (
    <section className={className} aria-labelledby="plan-comparison-heading">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">Compare plans</p>
        <h2 id="plan-comparison-heading" className="mt-2 font-display text-3xl font-semibold text-primary">
          Choose the tools that match your stage
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Advisors invited by an Exit Ready owner can review and comment at no cost.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-[760px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="w-[36%] px-5 py-4 font-semibold text-primary">
                Feature
              </th>
              {columns.map((column) => {
                const highlighted = column.slug === "exit-ready";
                return (
                  <th
                    key={column.slug}
                    scope="col"
                    className={`min-w-40 px-4 py-4 text-center font-semibold ${
                      highlighted ? "bg-accent-soft text-accent" : "text-primary"
                    }`}
                  >
                    {column.name}
                    {highlighted && (
                      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider">
                        Most popular
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PLAN_COMPARISON_ROWS.map((row, index) => {
              const previousGroup = PLAN_COMPARISON_ROWS[index - 1]?.group;
              return (
                <tr
                  key={row.feature}
                  className={`border-b border-border last:border-b-0 ${
                    row.group !== previousGroup ? "border-t-2 border-t-border" : ""
                  }`}
                >
                  <th scope="row" className="px-5 py-4 font-normal text-foreground">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {row.group}
                    </span>
                    <span className="mt-1 block font-medium">{row.feature}</span>
                    {row.advisorNote && (
                      <span className="mt-1 block text-xs text-accent">{row.advisorNote}</span>
                    )}
                  </th>
                  {columns.map((column) => (
                    <td
                      key={column.slug}
                      className={`px-4 py-4 text-center ${
                        column.slug === "exit-ready" ? "bg-accent-soft/50" : ""
                      }`}
                    >
                      <Cell value={row[column.slug]} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
