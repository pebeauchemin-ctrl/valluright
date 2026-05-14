import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Copy, ExternalLink, Save } from "lucide-react";
import { useBusiness } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/buyer-teaser")({
  head: () => ({ meta: [{ title: "Buyer Teaser — ValuRight.ai" }] }),
  component: BuyerTeaser,
});

function BuyerTeaser() {
  const { current } = useBusiness();
  const [settings, setSettings] = useState({
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
  const [highlights, setHighlights] = useState("Established 12+ year operating history\nLoyal repeat customer base\nExperienced field team in place\nGrowing margins year-over-year");
  const [opps, setOpps] = useState("Add recurring service contracts\nExpand commercial accounts\nGeographic expansion to adjacent markets");
  const [anonymous, setAnonymous] = useState("");
  const [reason, setReason] = useState("");
  const [askLow, setAskLow] = useState<number | null>(null);
  const [askHigh, setAskHigh] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!current) return;
    setAnonymous(current.anonymous_description ?? "");
    setReason(current.reason_for_sale ?? "");
    setAskLow(current.asking_price_low ? Number(current.asking_price_low) : null);
    setAskHigh(current.asking_price_high ? Number(current.asking_price_high) : null);
    supabase.from("buyer_view_settings").select("*").eq("business_id", current.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSettings({
            is_published: data.is_published,
            show_revenue_chart: data.show_revenue_chart,
            show_employee_count: data.show_employee_count,
            show_exact_revenue: data.show_exact_revenue,
            show_profit_margin: data.show_profit_margin,
            show_sde: data.show_sde,
            show_valuation_breakdown: data.show_valuation_breakdown,
            show_scenarios: data.show_scenarios,
            show_customer_concentration: (data as { show_customer_concentration?: boolean }).show_customer_concentration ?? false,
            show_photos: (data as { show_photos?: boolean }).show_photos ?? false,
            transition_support: data.transition_support ?? settings.transition_support,
          });
          if (Array.isArray(data.business_highlights)) setHighlights((data.business_highlights as string[]).join("\n"));
          if (Array.isArray(data.growth_opportunities)) setOpps((data.growth_opportunities as string[]).join("\n"));
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const save = async () => {
    if (!current) return;
    setSaving(true);
    try {
      await supabase.from("businesses").update({
        anonymous_description: anonymous,
        reason_for_sale: reason,
        asking_price_low: askLow,
        asking_price_high: askHigh,
      }).eq("id", current.id);
      const payload = {
        business_id: current.id,
        ...settings,
        business_highlights: highlights.split("\n").filter(Boolean),
        growth_opportunities: opps.split("\n").filter(Boolean),
      };
      const { error } = await supabase.from("buyer_view_settings").upsert(payload, { onConflict: "business_id" });
      if (error) throw error;
      toast.success(settings.is_published ? "Published — share your link." : "Saved as draft.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!current) return <div className="p-12 text-sm text-muted-foreground">No business selected.</div>;

  const teaserUrl = typeof window !== "undefined" ? `${window.location.origin}/teaser/${current.public_id}` : "";

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">Buyer-safe teaser</h1>
        <p className="mt-1 text-sm text-muted-foreground">A confidential one-page profile you control. Sensitive details stay private until NDA.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <Section title="Business overview">
          <Textarea label="Anonymous description" value={anonymous} onChange={setAnonymous} rows={3} placeholder="e.g., Established service business in the Pacific Northwest..." />
          <Textarea label="Reason for sale" value={reason} onChange={setReason} rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <NumField label="Asking price (low)" value={askLow} onChange={setAskLow} />
            <NumField label="Asking price (high)" value={askHigh} onChange={setAskHigh} />
          </div>
        </Section>

        <Section title="Highlights & opportunities">
          <Textarea label="Business highlights (one per line)" value={highlights} onChange={setHighlights} rows={4} />
          <Textarea label="Growth opportunities (one per line)" value={opps} onChange={setOpps} rows={3} />
          <Textarea label="Transition support" value={settings.transition_support} onChange={(v) => setSettings((s) => ({ ...s, transition_support: v }))} rows={2} />
        </Section>

        <Section title="Always visible to buyers">
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Anonymous business description</li>
            <li>Industry & general region</li>
            <li>Years in business</li>
            <li>Revenue range (band)</li>
            <li>Asking price range</li>
            <li>Reason for sale</li>
            <li>High-level strengths</li>
          </ul>
        </Section>

        <Section title="Optional toggles — what buyers can see">
          {[
            ["show_revenue_chart", "Revenue trend chart"],
            ["show_exact_revenue", "Exact revenue figures"],
            ["show_profit_margin", "Profit margin"],
            ["show_sde", "Seller's Discretionary Earnings (SDE)"],
            ["show_employee_count", "Employee count"],
            ["show_customer_concentration", "Customer concentration"],
            ["show_valuation_breakdown", "Valuation method breakdown"],
            ["show_scenarios", "Improvement scenarios"],
            ["show_photos", "Photos / assets"],
          ].map(([k, label]) => (
            <label key={k} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-secondary/40">
              <span>{label}</span>
              <input type="checkbox" checked={(settings as Record<string, boolean | string>)[k] as boolean}
                onChange={(e) => setSettings((s) => ({ ...s, [k]: e.target.checked }))}
                className="accent-[oklch(0.45_0.1_158)]" />
            </label>
          ))}
        </Section>

        <Section title="NDA-gated — never shown publicly">
          <p className="text-xs text-muted-foreground">These are only released to buyers who request access and sign your NDA.</p>
          <ul className="text-sm text-muted-foreground grid sm:grid-cols-2 gap-x-4 gap-y-1 list-disc list-inside">
            <li>Business name</li>
            <li>Address / exact location</li>
            <li>Full P&L</li>
            <li>Tax returns</li>
            <li>Customer list</li>
            <li>Lease agreements</li>
            <li>Employee details</li>
            <li>Vendor list</li>
            <li>Debt schedule</li>
          </ul>
        </Section>

        <Section title="Publish">
          <label className="flex items-center justify-between rounded-md border border-accent/30 bg-accent-soft px-3 py-2.5 text-sm cursor-pointer">
            <span className="font-medium">Publish teaser publicly</span>
            <input type="checkbox" checked={settings.is_published} onChange={(e) => setSettings((s) => ({ ...s, is_published: e.target.checked }))} className="accent-[oklch(0.45_0.1_158)]" />
          </label>
          {settings.is_published && (
            <div className="rounded-md border border-border bg-secondary/40 px-3 py-2.5 text-sm flex items-center justify-between gap-3">
              <code className="truncate text-xs text-foreground">{teaserUrl}</code>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => { navigator.clipboard.writeText(teaserUrl); toast.success("Link copied"); }} className="p-1.5 rounded hover:bg-secondary"><Copy className="h-3.5 w-3.5" /></button>
                <Link to="/teaser/$publicId" params={{ publicId: current.public_id }} target="_blank" className="p-1.5 rounded hover:bg-secondary"><ExternalLink className="h-3.5 w-3.5" /></Link>
              </div>
            </div>
          )}
        </Section>

        <div className="flex justify-end gap-2 pt-2">
          <Link to="/teaser/$publicId" params={{ publicId: current.public_id }} target="_blank"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary">
            <Eye className="h-4 w-4" /> Preview
          </Link>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-display font-semibold text-primary text-sm uppercase tracking-wider">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Textarea({ label, value, onChange, rows, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows: number; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}
function NumField({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}
