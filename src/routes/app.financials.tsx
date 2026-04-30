import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useBusiness, type FinancialYearRow } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { fmtCurrency } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/financials")({
  head: () => ({ meta: [{ title: "Financials — ValuRight.ai" }] }),
  component: Financials,
});

function Financials() {
  const { current } = useBusiness();
  const [years, setYears] = useState<FinancialYearRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!current) return;
    supabase.from("financial_years").select("*").eq("business_id", current.id).order("year", { ascending: true })
      .then(({ data }) => setYears(data ?? []));
  }, [current]);

  const update = (i: number, key: string, val: number) => {
    setYears((prev) => prev.map((y, idx) => idx === i ? { ...y, [key]: val } : y));
  };

  const calcEbitda = (y: Partial<FinancialYearRow> & Record<string, unknown>) =>
    Number(y.net_income ?? 0) + Number(y.depreciation ?? 0) + Number(y.amortization ?? 0) +
    Number(y.interest ?? 0) + Number(y.income_taxes ?? 0);

  const addYear = () => {
    if (!current) return;
    const next = (years.length ? Math.max(...years.map((y) => y.year)) : new Date().getFullYear() - 1) + 1;
    setYears((prev) => [...prev, {
      id: `tmp-${next}`, business_id: current.id, year: next,
      revenue: 0, cogs: 0, gross_profit: 0, operating_expenses: 0,
      owner_salary: 0, addbacks: 0, ebitda: 0, net_income: 0,
      depreciation: 0, amortization: 0, interest: 0, income_taxes: 0,
      assets: 0, liabilities: 0, debt: 0, created_at: new Date().toISOString(),
    } as unknown as FinancialYearRow]);
  };

  const save = async () => {
    if (!current) return;
    setSaving(true);
    try {
      for (const y of years) {
        const payload = {
          year: y.year,
          revenue: Number(y.revenue ?? 0), cogs: Number(y.cogs ?? 0),
          gross_profit: Number(y.revenue ?? 0) - Number(y.cogs ?? 0),
          operating_expenses: Number(y.operating_expenses ?? 0),
          owner_salary: Number(y.owner_salary ?? 0), addbacks: Number(y.addbacks ?? 0),
          depreciation: Number((y as Record<string, unknown>).depreciation ?? 0),
          amortization: Number((y as Record<string, unknown>).amortization ?? 0),
          interest: Number((y as Record<string, unknown>).interest ?? 0),
          income_taxes: Number((y as Record<string, unknown>).income_taxes ?? 0),
          ebitda: calcEbitda(y as Record<string, unknown>),
          net_income: Number(y.net_income ?? 0),
          assets: Number(y.assets ?? 0), liabilities: Number(y.liabilities ?? 0), debt: Number(y.debt ?? 0),
        };
        if (typeof y.id === "string" && y.id.startsWith("tmp-")) {
          await supabase.from("financial_years").insert({ ...payload, business_id: current.id });
        } else {
          await supabase.from("financial_years").update(payload).eq("id", y.id);
        }
      }
      toast.success("Financials saved");
      const { data } = await supabase.from("financial_years").select("*").eq("business_id", current.id).order("year", { ascending: true });
      setYears(data ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const removeYear = async (i: number) => {
    const y = years[i];
    if (typeof y.id === "string" && !y.id.startsWith("tmp-")) {
      await supabase.from("financial_years").delete().eq("id", y.id);
    }
    setYears((prev) => prev.filter((_, idx) => idx !== i));
  };

  if (!current) return <div className="p-12 text-sm text-muted-foreground">No business selected.</div>;

  const rows = [
    ["revenue", "Gross revenue"], ["cogs", "COGS"], ["operating_expenses", "Operating expenses"],
    ["owner_salary", "Owner's salary"], ["addbacks", "Add-backs (personal)"],
    ["depreciation", "Depreciation"], ["amortization", "Amortization"],
    ["interest", "Interest"], ["income_taxes", "Income taxes"],
    ["net_income", "Net income"],
    ["assets", "Total assets"], ["liabilities", "Total liabilities"], ["debt", "Debt"],
  ] as const;

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Financials</h1>
          <p className="mt-1 text-sm text-muted-foreground">Edit historical financials. Saving recomputes your valuation.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addYear} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary">
            <Plus className="h-4 w-4" /> Add year
          </button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 overflow-x-auto">
        {years.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No financial years yet. Click "Add year" to get started.</p>
        ) : (
          <table className="w-full border-separate border-spacing-x-3 border-spacing-y-1 text-sm min-w-[600px]">
            <thead>
              <tr>
                <th></th>
                {years.map((y, i) => (
                  <th key={y.id} className="text-center pb-1">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-semibold">{y.year}</span>
                      <button onClick={() => removeYear(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([key, label]) => (
                <tr key={key}>
                  <td className="py-1 text-muted-foreground whitespace-nowrap">{label}</td>
                  {years.map((y, i) => (
                    <td key={y.id} className="py-1">
                      <input type="number" value={Number((y as Record<string, unknown>)[key] ?? 0) || ""}
                        onChange={(e) => update(i, key, Number(e.target.value) || 0)}
                        className="w-32 rounded-md border border-input bg-background px-2 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-ring" />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-border">
                <td className="py-2 font-semibold">EBITDA <span className="text-xs font-normal text-muted-foreground">(calculated)</span></td>
                {years.map((y) => {
                  const e = calcEbitda(y as Record<string, unknown>);
                  return <td key={y.id} className="py-2 text-center text-sm font-semibold text-accent">{fmtCurrency(e, { compact: true })}</td>;
                })}
              </tr>
              <tr>
                <td className="py-2 font-semibold">EBITDA margin</td>
                {years.map((y) => {
                  const e = calcEbitda(y as Record<string, unknown>);
                  const m = Number(y.revenue) ? (e / Number(y.revenue)) * 100 : 0;
                  return <td key={y.id} className="py-2 text-center text-sm text-muted-foreground">{m.toFixed(1)}%</td>;
                })}
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
