import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { PublicPageShell } from "@/components/PublicPageShell";
import { supabase } from "@/integrations/supabase/client";
import { PILOT_CTA } from "@/components/PilotCta";

// REB-40: 5-question pilot screener (CMO template 6). Responses go to
// public.pilot_applications (insert-only RLS; no public read).

export const Route = createFileRoute("/pilot")({
  head: () => ({
    meta: [
      { title: "Join the pilot — ValuRight.ai" },
      { name: "description", content: PILOT_CTA.subhead },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://valuright.ai/pilot" }],
  }),
  component: PilotScreener,
});

const ROLES = [
  "Business owner",
  "Business broker or M&A advisor",
  "CPA or accountant",
  "Exit planner",
  "Other",
];
const REVENUE = ["Under $500K", "$500K-$2M", "$2M-$10M", "$10M-$25M", "Over $25M"];
const DEALS = ["0-4", "5-15", "16+"];
const TIMELINE = ["Within 1 year", "1-3 years", "3-5 years", "5+ years", "Not sure"];
const FINANCIALS = ["Yes", "Partly", "No"];
const CALLS = ["Yes", "Maybe, I have questions", "No"];

type Form = Record<
  | "name"
  | "email"
  | "role"
  | "roleOther"
  | "industry"
  | "revenue"
  | "deals"
  | "timeline"
  | "financials"
  | "calls",
  string
>;
const EMPTY: Form = {
  name: "",
  email: "",
  role: "",
  roleOther: "",
  industry: "",
  revenue: "",
  deals: "",
  timeline: "",
  financials: "",
  calls: "",
};

function Choices({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((o) => (
        <label
          key={o}
          className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm ${value === o ? "border-accent bg-accent/10 text-primary" : "border-border"}`}
        >
          <input
            type="radio"
            name={name}
            value={o}
            checked={value === o}
            onChange={() => onChange(o)}
            className="sr-only"
          />
          {o}
        </label>
      ))}
    </div>
  );
}

function Q({ n, children }: { n: number; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-border bg-card p-5">
      <legend className="sr-only">Question {n}</legend>
      {children}
    </fieldset>
  );
}

function PilotScreener() {
  const [f, setF] = useState<Form>(EMPTY);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const set = (k: keyof Form) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const isOwner = f.role === "Business owner";
  const complete =
    f.name.trim() &&
    /^\S+@\S+\.\S+$/.test(f.email.trim()) &&
    f.role &&
    (f.role !== "Other" || f.roleOther.trim()) &&
    (isOwner ? f.revenue : f.deals) &&
    f.timeline &&
    f.financials &&
    f.calls;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!complete) return;
    setStatus("saving");
    // Table is not in generated types yet (added by this PR's migration).
    const { error } = await (
      supabase as unknown as {
        from: (t: "pilot_applications") => {
          insert: (row: Record<string, string | null>) => Promise<{ error: unknown }>;
        };
      }
    )
      .from("pilot_applications")
      .insert({
        name: f.name.trim(),
        email: f.email.trim(),
        role: f.role === "Other" ? `Other: ${f.roleOther.trim()}` : f.role,
        owner_industry: isOwner ? f.industry.trim() || null : null,
        owner_revenue: isOwner ? f.revenue : null,
        advisor_deal_volume: isOwner ? null : f.deals,
        sale_timeline: f.timeline,
        has_financials: f.financials,
        can_join_calls: f.calls,
      });
    setStatus(error ? "error" : "done");
  };

  return (
    <PublicPageShell eyebrow="Pilot" title={PILOT_CTA.headline} description={PILOT_CTA.subhead}>
      <div className="mx-auto max-w-2xl">
        <p className="mb-6 text-sm text-muted-foreground">{PILOT_CTA.terms}</p>
        {status === "done" ? (
          <div role="status" className="rounded-xl border border-accent/40 bg-accent/5 p-6">
            <p className="font-display text-lg font-semibold text-primary">
              Thanks, we got your answers.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">We’ll be in touch by email.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-primary">
                Name
                <input
                  required
                  maxLength={200}
                  value={f.name}
                  onChange={(e) => set("name")(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-normal"
                />
              </label>
              <label className="text-sm font-semibold text-primary">
                Email
                <input
                  required
                  type="email"
                  maxLength={320}
                  value={f.email}
                  onChange={(e) => set("email")(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-normal"
                />
              </label>
            </div>

            <Q n={1}>
              <p className="text-sm font-semibold text-primary">1. Which describes you best?</p>
              <Choices name="role" options={ROLES} value={f.role} onChange={set("role")} />
              {f.role === "Other" && (
                <input
                  aria-label="Other role"
                  maxLength={150}
                  value={f.roleOther}
                  onChange={(e) => set("roleOther")(e.target.value)}
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              )}
            </Q>

            <Q n={2}>
              {isOwner || !f.role ? (
                <>
                  <p className="text-sm font-semibold text-primary">
                    2. Owners: what is your industry and approximate annual revenue?
                  </p>
                  <input
                    aria-label="Industry"
                    placeholder="Industry"
                    maxLength={200}
                    value={f.industry}
                    onChange={(e) => set("industry")(e.target.value)}
                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <Choices
                    name="revenue"
                    options={REVENUE}
                    value={f.revenue}
                    onChange={set("revenue")}
                  />
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-primary">
                    2. Advisors: about how many small business valuations or exits do you work on
                    each year?
                  </p>
                  <Choices name="deals" options={DEALS} value={f.deals} onChange={set("deals")} />
                </>
              )}
            </Q>

            <Q n={3}>
              <p className="text-sm font-semibold text-primary">
                3. When might you (or your clients) consider selling or transferring the business?
              </p>
              <Choices
                name="timeline"
                options={TIMELINE}
                value={f.timeline}
                onChange={set("timeline")}
              />
            </Q>

            <Q n={4}>
              <p className="text-sm font-semibold text-primary">
                4. Do you have at least 2 years of financials you could enter or upload (P&amp;L,
                tax returns, or a QuickBooks export)? Advisors: could you run 1-2 anonymized client
                files?
              </p>
              <Choices
                name="financials"
                options={FINANCIALS}
                value={f.financials}
                onChange={set("financials")}
              />
            </Q>

            <Q n={5}>
              <p className="text-sm font-semibold text-primary">
                5. Can you join two recorded video calls (about 45 and 30 minutes) over the next 6
                weeks, fill out a short survey, and consider letting us quote your feedback (named
                or anonymous, with your written approval)?
              </p>
              <Choices name="calls" options={CALLS} value={f.calls} onChange={set("calls")} />
            </Q>

            {status === "error" && (
              <p role="alert" className="text-sm text-destructive">
                Something went wrong saving your answers. Please try again.
              </p>
            )}
            <button
              type="submit"
              disabled={!complete || status === "saving"}
              className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {status === "saving" ? "Sending…" : "Send my answers"}
            </button>
          </form>
        )}
      </div>
    </PublicPageShell>
  );
}
