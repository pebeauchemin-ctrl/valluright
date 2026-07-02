import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CheckCircle2, Copy, ExternalLink, EyeOff, LockKeyhole, Save, Shield } from "lucide-react";
import { useBusiness, type FinancialYearRow } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ValuationDisclaimer } from "@/components/ValuationDisclaimer";
import { fmtCurrency } from "@/lib/format";
import { recordProductEvent } from "@/lib/observability.functions";

export const Route = createFileRoute("/app/buyer-teaser")({
  head: () => ({ meta: [{ title: "Buyer Teaser — ValuRight.ai" }] }),
  component: BuyerTeaser,
});

type BuyerSettingsState = {
  is_published: boolean;
  show_revenue_chart: boolean;
  show_employee_count: boolean;
  show_exact_revenue: boolean;
  show_profit_margin: boolean;
  show_sde: boolean;
  show_valuation_breakdown: boolean;
  show_scenarios: boolean;
  show_customer_concentration: boolean;
  show_photos: boolean;
  transition_support: string;
};

function BuyerTeaser() {
  const { current } = useBusiness();
  const recordEvent = useServerFn(recordProductEvent);
  const [settings, setSettings] = useState<BuyerSettingsState>({
    is_published: false,
    show_revenue_chart: true,
    show_employee_count: true,
    show_exact_revenue: false,
    show_profit_margin: false,
    show_sde: false,
    show_valuation_breakdown: false,
    show_scenarios: false,
    show_customer_concentration: false,
    show_photos: false,
    transition_support: "Owner willing to support a 90-day transition.",
  });
  const [highlights, setHighlights] = useState(
    "Established 12+ year operating history\nLoyal repeat customer base\nExperienced field team in place\nGrowing margins year-over-year",
  );
  const [opps, setOpps] = useState(
    "Add recurring service contracts\nExpand commercial accounts\nGeographic expansion to adjacent markets",
  );
  const [anonymous, setAnonymous] = useState("");
  const [reason, setReason] = useState("");
  const [askLow, setAskLow] = useState<number | null>(null);
  const [askHigh, setAskHigh] = useState<number | null>(null);
  const [financials, setFinancials] = useState<FinancialYearRow[]>([]);
  const [savedPublished, setSavedPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!current) return;
    setAnonymous(current.anonymous_description ?? "");
    setReason(current.reason_for_sale ?? "");
    setAskLow(current.asking_price_low ? Number(current.asking_price_low) : null);
    setAskHigh(current.asking_price_high ? Number(current.asking_price_high) : null);
    supabase
      .from("financial_years")
      .select("*")
      .eq("business_id", current.id)
      .order("year", { ascending: true })
      .then(({ data }) => setFinancials((data ?? []) as FinancialYearRow[]));
    supabase
      .from("buyer_view_settings")
      .select("*")
      .eq("business_id", current.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSavedPublished(data.is_published);
          setSettings({
            is_published: data.is_published,
            show_revenue_chart: data.show_revenue_chart,
            show_employee_count: data.show_employee_count,
            show_exact_revenue: data.show_exact_revenue,
            show_profit_margin: data.show_profit_margin,
            show_sde: data.show_sde,
            show_valuation_breakdown: data.show_valuation_breakdown,
            show_scenarios: data.show_scenarios,
            show_customer_concentration:
              (data as { show_customer_concentration?: boolean }).show_customer_concentration ??
              false,
            show_photos: (data as { show_photos?: boolean }).show_photos ?? false,
            transition_support: data.transition_support ?? settings.transition_support,
          });
          if (Array.isArray(data.business_highlights))
            setHighlights((data.business_highlights as string[]).join("\n"));
          if (Array.isArray(data.growth_opportunities))
            setOpps((data.growth_opportunities as string[]).join("\n"));
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const save = async () => {
    if (!current) return;
    setSaving(true);
    try {
      const { error: businessError } = await supabase
        .from("businesses")
        .update({
          anonymous_description: anonymous,
          reason_for_sale: reason,
          asking_price_low: askLow,
          asking_price_high: askHigh,
        })
        .eq("id", current.id);
      if (businessError) throw businessError;
      const payload = {
        business_id: current.id,
        ...settings,
        business_highlights: highlights.split("\n").filter(Boolean),
        growth_opportunities: opps.split("\n").filter(Boolean),
      };
      const { error } = await supabase
        .from("buyer_view_settings")
        .upsert(payload, { onConflict: "business_id" });
      if (error) throw error;
      const visibleFieldsCount = [
        settings.show_revenue_chart,
        settings.show_employee_count,
        settings.show_exact_revenue,
        settings.show_profit_margin,
        settings.show_sde,
        settings.show_valuation_breakdown,
        settings.show_scenarios,
        settings.show_customer_concentration,
        settings.show_photos,
      ].filter(Boolean).length;
      await recordEvent({
        data: {
          eventName: "buyer_teaser_generated",
          area: "activation",
          businessId: current.id,
          targetType: "buyer_teaser",
          targetId: current.public_id,
          metadata: {
            published: settings.is_published,
            visible_fields_count: visibleFieldsCount,
          },
        },
      }).catch(() => undefined);
      setSavedPublished(settings.is_published);
      toast.success(settings.is_published ? "Published — share your link." : "Saved as draft.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!current)
    return <div className="p-12 text-sm text-muted-foreground">No business selected.</div>;

  const teaserUrl =
    typeof window !== "undefined" ? `${window.location.origin}/teaser/${current.public_id}` : "";
  const previewHighlights = splitLines(highlights);
  const previewOpps = splitLines(opps);
  const latest = financials[financials.length - 1];

  return (
    <div className="max-w-6xl space-y-6 p-4 sm:p-6 lg:p-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">Buyer-safe teaser</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control what a buyer can see before NDA. The preview below reflects the buyer-safe public
          teaser, while confidential records stay behind the request-access workflow.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <Section title="Business overview">
            <Textarea
              label="Anonymous description"
              value={anonymous}
              onChange={setAnonymous}
              rows={3}
              placeholder="e.g., Established service business in the Pacific Northwest..."
            />
            <Textarea label="Reason for sale" value={reason} onChange={setReason} rows={2} />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumField label="Asking price (low)" value={askLow} onChange={setAskLow} />
              <NumField label="Asking price (high)" value={askHigh} onChange={setAskHigh} />
            </div>
          </Section>

          <Section title="Highlights & opportunities">
            <Textarea
              label="Business highlights (one per line)"
              value={highlights}
              onChange={setHighlights}
              rows={4}
            />
            <Textarea
              label="Growth opportunities (one per line)"
              value={opps}
              onChange={setOpps}
              rows={3}
            />
            <Textarea
              label="Transition support"
              value={settings.transition_support}
              onChange={(v) => setSettings((s) => ({ ...s, transition_support: v }))}
              rows={2}
            />
          </Section>

          <Section
            title="Always visible before NDA"
            desc="These fields are designed to be buyer-safe and are always available on a published teaser."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                "Anonymous business description",
                "Industry and general region",
                "Years in business",
                "Revenue band, not exact revenue",
                "Asking price range when provided",
                "Reason for sale",
                "High-level strengths",
                "Request-access form",
              ].map((item) => (
                <VisibilityRow key={item} icon={CheckCircle2} label={item} />
              ))}
            </div>
          </Section>

          <Section
            title="Owner-controlled optional fields"
            desc="Turn these on only when you are comfortable showing them before NDA. Exact revenue, SDE, margins, and customer concentration are higher-sensitivity fields."
          >
            {VISIBILITY_TOGGLES.map((item) => (
              <label
                key={item.key}
                className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-secondary/40"
              >
                <span className="min-w-0">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {item.desc}
                  </span>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      item.sensitivity === "Higher"
                        ? "bg-gold/15 text-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {item.sensitivity} sensitivity
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={settings[item.key]}
                  onChange={(e) => setSettings((s) => ({ ...s, [item.key]: e.target.checked }))}
                  className="mt-0.5 shrink-0 accent-[oklch(0.45_0.1_158)]"
                />
              </label>
            ))}
          </Section>

          <Section
            title="NDA-gated — never shown publicly"
            desc="These stay out of the teaser. Buyers must request access and be approved before you share them."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                "Business name",
                "Street address or exact location",
                "Full P&L and balance sheet",
                "Tax returns",
                "Customer list",
                "Lease agreements",
                "Employee details",
                "Vendor list",
                "Debt schedule",
                "Uploaded data room files",
              ].map((item) => (
                <VisibilityRow key={item} icon={LockKeyhole} label={item} muted />
              ))}
            </div>
          </Section>

          <Section title="Publish">
            <label className="flex items-center justify-between gap-3 rounded-md border border-accent/30 bg-accent-soft px-3 py-2.5 text-sm cursor-pointer">
              <span className="font-medium">Publish teaser publicly</span>
              <input
                type="checkbox"
                checked={settings.is_published}
                onChange={(e) => setSettings((s) => ({ ...s, is_published: e.target.checked }))}
                className="accent-[oklch(0.45_0.1_158)]"
              />
            </label>
            {settings.is_published !== savedPublished && (
              <p className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                Save changes to {settings.is_published ? "activate" : "remove"} the public teaser
                link. The buyer preview on this page updates immediately.
              </p>
            )}
            {savedPublished && (
              <div className="flex flex-col gap-3 rounded-md border border-border bg-secondary/40 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                <code className="min-w-0 break-all text-xs text-foreground sm:truncate">
                  {teaserUrl}
                </code>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(teaserUrl);
                      toast.success("Link copied");
                    }}
                    className="p-1.5 rounded hover:bg-secondary"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <Link
                    to="/teaser/$publicId"
                    params={{ publicId: current.public_id }}
                    target="_blank"
                    className="p-1.5 rounded hover:bg-secondary"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </Section>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            {savedPublished && (
              <Link
                to="/teaser/$publicId"
                params={{ publicId: current.public_id }}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
              >
                <ExternalLink className="h-4 w-4" /> Open public link
              </Link>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
            </button>
          </div>

          <ValuationDisclaimer />
        </div>

        <BuyerPreview
          industry={current.industry}
          region={current.region}
          yearsInBusiness={current.years_in_business}
          employees={current.employees}
          anonymous={anonymous}
          reason={reason}
          askLow={askLow}
          askHigh={askHigh}
          topCustomerConcentrationPct={current.top_customer_concentration_pct}
          settings={settings}
          highlights={previewHighlights}
          opportunities={previewOpps}
          latest={latest}
          financials={financials}
        />
      </div>
    </div>
  );
}

const VISIBILITY_TOGGLES: Array<{
  key: keyof Pick<
    BuyerSettingsState,
    | "show_revenue_chart"
    | "show_exact_revenue"
    | "show_profit_margin"
    | "show_sde"
    | "show_employee_count"
    | "show_customer_concentration"
    | "show_valuation_breakdown"
    | "show_scenarios"
    | "show_photos"
  >;
  label: string;
  desc: string;
  sensitivity: "Standard" | "Higher";
}> = [
  {
    key: "show_revenue_chart",
    label: "Revenue trend chart",
    desc: "Shows indexed year-over-year trend without exact dollars unless exact revenue is also enabled.",
    sensitivity: "Standard",
  },
  {
    key: "show_exact_revenue",
    label: "Exact revenue figures",
    desc: "Shows actual revenue dollars. Leave off when you only want to disclose a range.",
    sensitivity: "Higher",
  },
  {
    key: "show_profit_margin",
    label: "Profit margin",
    desc: "Shows EBITDA margin where financial history supports it.",
    sensitivity: "Higher",
  },
  {
    key: "show_sde",
    label: "Seller's Discretionary Earnings",
    desc: "Shows SDE as a buyer-facing earnings proxy.",
    sensitivity: "Higher",
  },
  {
    key: "show_employee_count",
    label: "Employee count",
    desc: "Shows team size without employee names or roles.",
    sensitivity: "Standard",
  },
  {
    key: "show_customer_concentration",
    label: "Customer concentration",
    desc: "Shows top-customer concentration percentage when available.",
    sensitivity: "Higher",
  },
  {
    key: "show_valuation_breakdown",
    label: "Valuation discussion prompt",
    desc: "Shows a buyer-safe note that valuation assumptions can be discussed during diligence.",
    sensitivity: "Standard",
  },
  {
    key: "show_scenarios",
    label: "Improvement scenarios prompt",
    desc: "Shows a buyer-safe note that upside scenarios are available for qualified buyers.",
    sensitivity: "Standard",
  },
  {
    key: "show_photos",
    label: "Photos or asset preview prompt",
    desc: "Shows that photos or asset materials may be shared after owner approval.",
    sensitivity: "Standard",
  },
];

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-display font-semibold text-primary text-sm uppercase tracking-wider">
        {title}
      </h3>
      {desc && <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function VisibilityRow({
  icon: Icon,
  label,
  muted = false,
}: {
  icon: typeof CheckCircle2;
  label: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">
      <Icon className={`h-4 w-4 shrink-0 ${muted ? "text-muted-foreground" : "text-accent"}`} />
      <span className={muted ? "text-muted-foreground" : "text-foreground"}>{label}</span>
    </div>
  );
}

function BuyerPreview({
  industry,
  region,
  yearsInBusiness,
  employees,
  anonymous,
  reason,
  askLow,
  askHigh,
  topCustomerConcentrationPct,
  settings,
  highlights,
  opportunities,
  latest,
  financials,
}: {
  industry: string | null;
  region: string | null;
  yearsInBusiness: number | null;
  employees: number | null;
  anonymous: string;
  reason: string;
  askLow: number | null;
  askHigh: number | null;
  topCustomerConcentrationPct: number | null;
  settings: BuyerSettingsState;
  highlights: string[];
  opportunities: string[];
  latest: FinancialYearRow | undefined;
  financials: FinancialYearRow[];
}) {
  const revenueBand = revenueBandLabel(Number(latest?.revenue ?? 0));
  const ebitdaMargin =
    latest?.revenue && latest.ebitda
      ? `${((Number(latest.ebitda) / Number(latest.revenue)) * 100).toFixed(0)}%`
      : null;
  const sde =
    latest && (latest.ebitda || latest.owner_salary || latest.addbacks)
      ? Number(latest.ebitda ?? 0) + Number(latest.owner_salary ?? 0) + Number(latest.addbacks ?? 0)
      : null;

  return (
    <aside className="lg:sticky lg:top-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Buyer preview
            </div>
            <h2 className="font-display text-lg font-semibold text-primary">
              What the public teaser shows
            </h2>
          </div>
          {settings.is_published ? (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
              Published
            </span>
          ) : (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              Draft
            </span>
          )}
        </div>

        <div className="rounded-xl border border-border bg-secondary/30 p-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
            <Shield className="h-3 w-3" /> Confidential business for sale
          </span>
          <h3 className="mt-3 font-display text-xl font-semibold text-primary">
            {industry || "Confidential industry"} · {region || "Confidential region"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Established {yearsInBusiness ?? "?"} years
          </p>
          <p className="mt-4 text-sm leading-relaxed text-foreground">
            {anonymous || "Add an anonymous description before publishing."}
          </p>

          <div className="mt-4 grid gap-2">
            <PreviewKpi
              label="Revenue"
              value={
                settings.show_exact_revenue && latest?.revenue
                  ? fmtCurrency(Number(latest.revenue), { compact: true })
                  : revenueBand
              }
            />
            {settings.show_employee_count && (
              <PreviewKpi label="Employees" value={String(employees ?? "Not disclosed")} />
            )}
            {settings.show_profit_margin && ebitdaMargin && (
              <PreviewKpi label="EBITDA margin" value={ebitdaMargin} />
            )}
            {settings.show_sde && sde != null && (
              <PreviewKpi label="SDE" value={fmtCurrency(sde, { compact: true })} />
            )}
            {settings.show_customer_concentration && (
              <PreviewKpi
                label="Customer concentration"
                value={
                  topCustomerConcentrationPct != null
                    ? `${Number(topCustomerConcentrationPct).toFixed(0)}%`
                    : "Not saved"
                }
              />
            )}
            {askLow && askHigh && (
              <PreviewKpi
                label="Asking price"
                value={`${fmtCurrency(askLow, { compact: true })} - ${fmtCurrency(askHigh, {
                  compact: true,
                })}`}
              />
            )}
          </div>

          {settings.show_revenue_chart && financials.length > 0 && (
            <div className="mt-4 rounded-lg border border-border bg-background p-3">
              <div className="text-xs font-semibold text-primary">Revenue trend</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {settings.show_exact_revenue
                  ? "Displays exact annual revenue."
                  : "Displays indexed growth without exact dollars."}
              </div>
            </div>
          )}

          {highlights.length > 0 && <PreviewList title="Business highlights" items={highlights} />}
          {opportunities.length > 0 && (
            <PreviewList title="Growth opportunities" items={opportunities} />
          )}
          {settings.transition_support && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-primary">Transition support</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {settings.transition_support}
              </p>
            </div>
          )}
          {reason && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-primary">Reason for sale</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{reason}</p>
            </div>
          )}
          {(settings.show_valuation_breakdown ||
            settings.show_scenarios ||
            settings.show_photos) && (
            <div className="mt-4 space-y-2">
              {settings.show_valuation_breakdown && (
                <PreviewNotice text="Valuation assumptions can be discussed with qualified buyers during diligence." />
              )}
              {settings.show_scenarios && (
                <PreviewNotice text="Improvement scenarios are available for qualified buyers after owner review." />
              )}
              {settings.show_photos && (
                <PreviewNotice text="Photos or asset materials may be shared after owner approval." />
              )}
            </div>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <EyeOff className="h-3.5 w-3.5" /> Not shown publicly
          </div>
          <p className="mt-1">
            Legal name, exact address, full financial statements, tax returns, customer names, debt
            schedule, and uploaded files stay out of this preview.
          </p>
        </div>
      </div>
    </aside>
  );
}

function PreviewKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function PreviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <div className="text-xs font-semibold text-primary">{title}</div>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-xs leading-relaxed text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewNotice({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
      {text}
    </div>
  );
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function revenueBandLabel(revenue: number) {
  if (!revenue || revenue <= 0) return "Available under NDA";
  if (revenue < 500_000) return "Under $500K";
  if (revenue < 1_000_000) return "$500K - $1M";
  if (revenue < 2_500_000) return "$1M - $2.5M";
  if (revenue < 5_000_000) return "$2.5M - $5M";
  if (revenue < 10_000_000) return "$5M - $10M";
  return "$10M+";
}
function Textarea({
  label,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
