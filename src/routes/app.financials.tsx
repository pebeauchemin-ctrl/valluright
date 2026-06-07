import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Upload,
  Link2,
  FileSpreadsheet,
  AlertTriangle,
  Save as SaveIcon,
} from "lucide-react";
import { useBusiness, type FinancialYearRow } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { fmtCurrency } from "@/lib/format";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { startXeroConnect, importXeroFinancials, listXeroConnections } from "@/lib/xero.functions";
import {
  NORMALIZED_ACCOUNT_FIELDS,
  accountMappingKey,
  applySavedMappings,
  countUnmappedAccounts,
  rollupMappedAccounts,
  type AccountMappingInput,
  type MappedAccount,
  type NormalizedAccountField,
  type SavedAccountMapping,
  type SourceSystem,
} from "@/lib/account-mapping";

export const Route = createFileRoute("/app/financials")({
  head: () => ({ meta: [{ title: "Financials — ValuRight.ai" }] }),
  component: Financials,
});

const FIELD_KEYS = [
  "revenue",
  "cogs",
  "operating_expenses",
  "owner_salary",
  "addbacks",
  "depreciation",
  "amortization",
  "interest",
  "income_taxes",
  "net_income",
  "assets",
  "liabilities",
  "debt",
] as const;

type AccountMappingRow = Database["public"]["Tables"]["account_mappings"]["Row"];
type FinancialFieldKey = (typeof FIELD_KEYS)[number];

const ACCOUNT_ROLLUP_KEYS: FinancialFieldKey[] = [...FIELD_KEYS];

function Financials() {
  const { current } = useBusiness();
  const [years, setYears] = useState<FinancialYearRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [accountMappings, setAccountMappings] = useState<SavedAccountMapping[]>([]);
  const [mappingReview, setMappingReview] = useState<MappedAccount[]>([]);
  const [savingMappings, setSavingMappings] = useState(false);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  const startXero = useServerFn(startXeroConnect);
  const importXero = useServerFn(importXeroFinancials);
  const fetchConnections = useServerFn(listXeroConnections);
  const [xeroLoading, setXeroLoading] = useState(false);
  const [xeroTenants, setXeroTenants] = useState<
    { tenant_id: string; tenant_name: string | null }[]
  >([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!current) return;
    Promise.all([
      supabase
        .from("financial_years")
        .select("*")
        .eq("business_id", current.id)
        .order("year", { ascending: true }),
      supabase
        .from("account_mappings")
        .select("*")
        .eq("business_id", current.id)
        .order("source_account_name", { ascending: true }),
    ]).then(([financialsResult, mappingsResult]) => {
      setYears(financialsResult.data ?? []);
      setAccountMappings((mappingsResult.data ?? []) as AccountMappingRow[]);
      setMappingReview([]);
      setImportWarnings([]);
    });
  }, [current]);

  useEffect(() => {
    fetchConnections({})
      .then(({ connections }) => {
        if (connections?.length) {
          setXeroTenants(
            connections.map((c) => ({ tenant_id: c.tenant_id, tenant_name: c.tenant_name })),
          );
          setSelectedTenant((prev) => prev ?? connections[0].tenant_id);
        }
      })
      .catch(() => {});
  }, [fetchConnections]);

  const update = (i: number, key: string, val: number) => {
    setYears((prev) => prev.map((y, idx) => (idx === i ? { ...y, [key]: val } : y)));
  };

  const calcEbitda = (y: Partial<FinancialYearRow> & Record<string, unknown>) =>
    Number(y.net_income ?? 0) +
    Number(y.depreciation ?? 0) +
    Number(y.amortization ?? 0) +
    Number(y.interest ?? 0) +
    Number(y.income_taxes ?? 0);

  const blankYear = (year: number): FinancialYearRow =>
    ({
      id: `tmp-${year}`,
      business_id: current!.id,
      year,
      revenue: 0,
      cogs: 0,
      gross_profit: 0,
      operating_expenses: 0,
      owner_salary: 0,
      addbacks: 0,
      ebitda: 0,
      net_income: 0,
      depreciation: 0,
      amortization: 0,
      interest: 0,
      income_taxes: 0,
      assets: 0,
      liabilities: 0,
      debt: 0,
      created_at: new Date().toISOString(),
    }) as unknown as FinancialYearRow;

  const addYear = () => {
    if (!current) return;
    const cy = new Date().getFullYear();
    if (years.length === 0) {
      setYears([blankYear(cy - 3), blankYear(cy - 2), blankYear(cy - 1)]);
      return;
    }
    const existing = new Set(years.map((y) => y.year));
    const minYear = Math.min(...years.map((y) => y.year));
    const maxYear = Math.max(...years.map((y) => y.year));
    let next = minYear - 1;
    if (cy - next > 6 || existing.has(next)) next = maxYear + 1;
    setYears((prev) => [...prev, blankYear(next)].sort((a, b) => a.year - b.year));
  };

  const mergeImported = (imported: Array<Partial<FinancialYearRow> & { year: number }>) => {
    setYears((prev) => {
      const map = new Map(prev.map((y) => [y.year, y]));
      for (const row of imported) {
        const existing = map.get(row.year) ?? blankYear(row.year);
        map.set(row.year, { ...existing, ...row } as FinancialYearRow);
      }
      return Array.from(map.values()).sort((a, b) => a.year - b.year);
    });
  };

  const applyMappedImport = (accounts: MappedAccount[]) => {
    const rollups = rollupMappedAccounts(accounts);
    const importYears = new Set(accounts.map((account) => account.year).filter(Boolean) as number[]);
    setYears((prev) => {
      const map = new Map(prev.map((y) => [y.year, y]));
      for (const year of importYears) {
        const existing = map.get(year) ?? blankYear(year);
        const cleared = ACCOUNT_ROLLUP_KEYS.reduce(
          (acc, key) => ({ ...acc, [key]: 0 }),
          {} as Record<FinancialFieldKey, number>,
        );
        map.set(year, { ...existing, ...cleared } as FinancialYearRow);
      }
      for (const row of rollups) {
        const existing = map.get(row.year) ?? blankYear(row.year);
        map.set(row.year, { ...existing, ...row } as FinancialYearRow);
      }
      return Array.from(map.values()).sort((a, b) => a.year - b.year);
    });
  };

  const updateMappingChoice = (key: string, normalizedField: NormalizedAccountField) => {
    setMappingReview((prev) => {
      const next = prev.map((account) =>
        accountMappingKey(account) === key
          ? {
              ...account,
              normalizedField,
              confidence: normalizedField === "unmapped" ? "unmapped" : "saved",
            }
          : account,
      ) as MappedAccount[];
      applyMappedImport(next);
      setImportWarnings(buildMappingWarnings(next));
      return next;
    });
  };

  const saveAccountMappings = async () => {
    if (!current || mappingReview.length === 0) return;
    setSavingMappings(true);
    try {
      const unique = uniqueMappedAccounts(mappingReview);
      const payload = unique.map((account) => ({
        business_id: current.id,
        source_system: account.sourceSystem,
        source_account_id: account.sourceAccountId ?? null,
        source_account_name: account.sourceAccountName,
        source_account_type: account.sourceAccountType ?? null,
        normalized_field: account.normalizedField,
      }));
      const { error } = await supabase
        .from("account_mappings")
        .upsert(payload, {
          onConflict: "business_id,source_system,source_account_name",
        })
        .select("*");
      if (error) throw error;
      setAccountMappings(payload);
      toast.success("Account mappings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save mappings");
    } finally {
      setSavingMappings(false);
    }
  };

  const handleConnectXero = async () => {
    if (!current) return;
    try {
      setXeroLoading(true);
      const { url } = await startXero({ data: { businessId: current.id } });
      window.location.href = url;
    } catch (e) {
      setXeroLoading(false);
      toast.error(e instanceof Error ? e.message : "Failed to start Xero connect");
    }
  };

  const runXeroImport = async () => {
    if (!selectedTenant) return;
    try {
      setXeroLoading(true);
      const cy = new Date().getFullYear();
      const requestedYears = [cy - 3, cy - 2, cy - 1];
      const { years: imported } = await importXero({
        data: { tenantId: selectedTenant, years: requestedYears },
      });
      mergeImported(imported);
      setMappingReview([]);
      setImportWarnings([
        "Xero report totals were imported automatically. Review owner salary, add-backs, and any unusual accounts before saving the valuation.",
      ]);
      toast.success(`Imported ${imported.length} year(s) from Xero. Review and click Save.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xero import failed");
    } finally {
      setXeroLoading(false);
    }
  };

  const handleCsvUpload = async (file: File) => {
    if (!current) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) throw new Error("CSV is empty");
      const headers = parseCsvLine(lines[0]).map((h) =>
        h
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, ""),
      );
      const yearIdx = headers.indexOf("year");
      if (yearIdx < 0) throw new Error("CSV must include a 'year' column");
      const accountRows = parseAccountCsv(lines, headers, yearIdx);
      if (accountRows.length) {
        const mapped = applySavedMappings(accountRows, accountMappings);
        setMappingReview(mapped);
        applyMappedImport(mapped);
        setImportWarnings(buildMappingWarnings(mapped));
        toast.success(
          `Imported ${accountRows.length} account row(s). Review mappings and click Save.`,
        );
        return;
      }
      const imported: Array<Partial<FinancialYearRow> & { year: number }> = [];
      for (let i = 1; i < lines.length; i++) {
        const cells = parseCsvLine(lines[i]).map((c) => c.trim());
        const year = Number(cells[yearIdx]);
        if (!year) continue;
        const row: Record<string, number> = { year };
        for (const key of FIELD_KEYS) {
          const idx = headers.indexOf(key);
          if (idx >= 0) row[key] = parseMoney(cells[idx]);
        }
        imported.push(row as unknown as Partial<FinancialYearRow> & { year: number });
      }
      if (!imported.length) throw new Error("No valid rows found");
      mergeImported(imported);
      setMappingReview([]);
      setImportWarnings([]);
      toast.success(`Imported ${imported.length} year(s) from CSV. Review and click Save.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "CSV import failed");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleQuickBooks = () => {
    toast.info(
      "Export a QuickBooks CSV with year, account, and amount columns, then use Upload CSV to map the accounts.",
    );
  };

  const save = async () => {
    if (!current) return;
    setSaving(true);
    try {
      for (const y of years) {
        const payload = {
          year: y.year,
          revenue: Number(y.revenue ?? 0),
          cogs: Number(y.cogs ?? 0),
          gross_profit: Number(y.revenue ?? 0) - Number(y.cogs ?? 0),
          operating_expenses: Number(y.operating_expenses ?? 0),
          owner_salary: Number(y.owner_salary ?? 0),
          addbacks: Number(y.addbacks ?? 0),
          depreciation: Number((y as Record<string, unknown>).depreciation ?? 0),
          amortization: Number((y as Record<string, unknown>).amortization ?? 0),
          interest: Number((y as Record<string, unknown>).interest ?? 0),
          income_taxes: Number((y as Record<string, unknown>).income_taxes ?? 0),
          ebitda: calcEbitda(y as Record<string, unknown>),
          net_income: Number(y.net_income ?? 0),
          assets: Number(y.assets ?? 0),
          liabilities: Number(y.liabilities ?? 0),
          debt: Number(y.debt ?? 0),
        };
        if (typeof y.id === "string" && y.id.startsWith("tmp-")) {
          await supabase.from("financial_years").insert({ ...payload, business_id: current.id });
        } else {
          await supabase.from("financial_years").update(payload).eq("id", y.id);
        }
      }
      toast.success("Financials saved");
      const { data } = await supabase
        .from("financial_years")
        .select("*")
        .eq("business_id", current.id)
        .order("year", { ascending: true });
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

  if (!current)
    return <div className="p-12 text-sm text-muted-foreground">No business selected.</div>;

  const rows = [
    ["revenue", "Gross revenue"],
    ["cogs", "COGS"],
    ["operating_expenses", "Operating expenses"],
    ["owner_salary", "Owner's salary"],
    ["addbacks", "Add-backs (personal)"],
    ["depreciation", "Depreciation"],
    ["amortization", "Amortization"],
    ["interest", "Interest"],
    ["income_taxes", "Income taxes"],
    ["net_income", "Net income"],
    ["assets", "Total assets"],
    ["liabilities", "Total liabilities"],
    ["debt", "Debt"],
  ] as const;
  const unmappedCount = countUnmappedAccounts(mappingReview);
  const mappingRows = uniqueMappedAccounts(mappingReview);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Financials</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit historical financials. Saving recomputes your valuation.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button
            onClick={addYear}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary sm:flex-none"
          >
            <Plus className="h-4 w-4" /> Add year
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60 sm:flex-none"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>

      {/* Import options */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Import financials</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Connect Xero or upload a CSV. Direct QuickBooks import is planned; use a QuickBooks
              CSV export for now. Imports merge into existing years; click Save to persist.
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleCsvUpload(e.target.files[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-secondary"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Upload CSV
            </button>

            {xeroTenants.length === 0 ? (
              <button
                onClick={handleConnectXero}
                disabled={xeroLoading}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-secondary disabled:opacity-60"
              >
                {xeroLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
                Connect Xero
              </button>
            ) : (
              <>
                <select
                  value={selectedTenant ?? ""}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="rounded-md border border-input bg-background px-2 py-2 text-xs"
                >
                  {xeroTenants.map((t) => (
                    <option key={t.tenant_id} value={t.tenant_id}>
                      {t.tenant_name ?? t.tenant_id}
                    </option>
                  ))}
                </select>
                <button
                  onClick={runXeroImport}
                  disabled={xeroLoading || !selectedTenant}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-secondary disabled:opacity-60"
                >
                  {xeroLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Import from Xero
                </button>
              </>
            )}

            <button
              onClick={handleQuickBooks}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-secondary"
            >
              <Link2 className="h-3.5 w-3.5" /> QuickBooks CSV fallback
            </button>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          CSV format: use <code>year</code> plus either direct fields ({FIELD_KEYS.join(", ")}) or
          account rows with <code>account</code> and <code>amount</code>.
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Normalization: EBITDA is calculated as net income plus interest, income taxes,
          depreciation, and amortization. SDE uses EBITDA plus one working owner's compensation and
          one-time add-backs, so owner pay is not double-counted in EBITDA.
        </p>
      </div>

      {importWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Import review needed</p>
              <ul className="mt-1 space-y-1 text-xs">
                {importWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {mappingRows.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Account mapping review</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Confirm where each accounting account belongs. Saved choices are reused on future
                CSV imports.
              </p>
            </div>
            <button
              onClick={saveAccountMappings}
              disabled={savingMappings}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-secondary disabled:opacity-60"
            >
              {savingMappings ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <SaveIcon className="h-3.5 w-3.5" />
              )}
              Save mappings
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Source</th>
                  <th className="py-2 pr-3 font-medium">Account</th>
                  <th className="py-2 pr-3 font-medium text-right">Amount</th>
                  <th className="py-2 pr-3 font-medium">Mapping</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {mappingRows.map((account) => {
                  const key = accountMappingKey(account);
                  return (
                    <tr key={key} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3 text-xs uppercase text-muted-foreground">
                        {account.sourceSystem}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="font-medium text-foreground">
                          {account.sourceAccountName}
                        </div>
                        {account.sourceAccountType && (
                          <div className="text-xs text-muted-foreground">
                            {account.sourceAccountType}
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right text-muted-foreground">
                        {fmtCurrency(Number(account.amount ?? 0), { compact: true })}
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          value={account.normalizedField}
                          onChange={(e) =>
                            updateMappingChoice(key, e.target.value as NormalizedAccountField)
                          }
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                        >
                          {NORMALIZED_ACCOUNT_FIELDS.map((field) => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 text-xs">
                        <span
                          className={
                            account.normalizedField === "unmapped"
                              ? "font-semibold text-amber-700"
                              : "text-muted-foreground"
                          }
                        >
                          {account.confidence === "saved"
                            ? "Saved"
                            : account.normalizedField === "unmapped"
                              ? "Needs mapping"
                              : "Suggested"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {unmappedCount > 0 && (
            <p className="mt-3 text-xs font-medium text-amber-700">
              {unmappedCount} account{unmappedCount === 1 ? "" : "s"} must be mapped or ignored
              before the import should be used for valuation.
            </p>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card p-4 sm:p-6">
        {years.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No financial years yet. Click "Add year" to get started.
          </p>
        ) : (
          <table className="w-full min-w-[600px] border-separate border-spacing-x-2 border-spacing-y-1 text-sm sm:border-spacing-x-3">
            <thead>
              <tr>
                <th></th>
                {years.map((y, i) => (
                  <th key={y.id} className="text-center pb-1">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-semibold">{y.year}</span>
                      <button
                        onClick={() => removeYear(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
                      <input
                        type="number"
                        value={Number((y as Record<string, unknown>)[key] ?? 0) || ""}
                        onChange={(e) => update(i, key, Number(e.target.value) || 0)}
                        className="w-32 rounded-md border border-input bg-background px-2 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-border">
                <td className="py-2 font-semibold">
                  EBITDA{" "}
                  <span className="text-xs font-normal text-muted-foreground">(calculated)</span>
                </td>
                {years.map((y) => {
                  const e = calcEbitda(y as Record<string, unknown>);
                  return (
                    <td key={y.id} className="py-2 text-center text-sm font-semibold text-accent">
                      {fmtCurrency(e, { compact: true })}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="py-2 font-semibold">EBITDA margin</td>
                {years.map((y) => {
                  const e = calcEbitda(y as Record<string, unknown>);
                  const m = Number(y.revenue) ? (e / Number(y.revenue)) * 100 : 0;
                  return (
                    <td key={y.id} className="py-2 text-center text-sm text-muted-foreground">
                      {m.toFixed(1)}%
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && next === '"') {
      cell += '"';
      i++;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(cell);
      cell = "";
      continue;
    }
    cell += char;
  }
  cells.push(cell);
  return cells;
}

function parseMoney(value: string | undefined) {
  if (!value) return 0;
  const trimmed = value.trim();
  const negative = /^\(.*\)$/.test(trimmed);
  const number = Number(trimmed.replace(/[()$,\s]/g, ""));
  if (!Number.isFinite(number)) return 0;
  return negative ? -number : number;
}

function parseAccountCsv(
  lines: string[],
  headers: string[],
  yearIdx: number,
): AccountMappingInput[] {
  const accountIdx = firstHeader(headers, ["account", "account_name", "name"]);
  const amountIdx = firstHeader(headers, ["amount", "value", "balance"]);
  const debitIdx = firstHeader(headers, ["debit", "debits"]);
  const creditIdx = firstHeader(headers, ["credit", "credits"]);
  if (accountIdx < 0 || (amountIdx < 0 && debitIdx < 0 && creditIdx < 0)) return [];

  const idIdx = firstHeader(headers, ["account_id", "source_account_id", "id"]);
  const typeIdx = firstHeader(headers, ["account_type", "type", "category"]);
  const sourceIdx = firstHeader(headers, ["source", "source_system", "system"]);
  const accounts: AccountMappingInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]).map((c) => c.trim());
    const year = Number(cells[yearIdx]);
    const sourceAccountName = cells[accountIdx]?.trim();
    if (!year || !sourceAccountName) continue;

    const sourceSystem = normalizeSourceSystem(cells[sourceIdx] ?? "");
    const debit = debitIdx >= 0 ? parseMoney(cells[debitIdx]) : 0;
    const credit = creditIdx >= 0 ? parseMoney(cells[creditIdx]) : 0;
    const amount = amountIdx >= 0 ? parseMoney(cells[amountIdx]) : debit - credit;

    accounts.push({
      sourceSystem,
      sourceAccountId: idIdx >= 0 ? cells[idIdx] || null : null,
      sourceAccountName,
      sourceAccountType: typeIdx >= 0 ? cells[typeIdx] || null : null,
      year,
      amount,
    });
  }

  return accounts;
}

function firstHeader(headers: string[], names: string[]) {
  return names.reduce((found, name) => (found >= 0 ? found : headers.indexOf(name)), -1);
}

function normalizeSourceSystem(value: string): SourceSystem {
  const normalized = value.trim().toLowerCase();
  if (normalized === "xero" || normalized === "quickbooks" || normalized === "manual") {
    return normalized;
  }
  return "csv";
}

function buildMappingWarnings(accounts: MappedAccount[]) {
  const unmapped = countUnmappedAccounts(accounts);
  if (!unmapped) return [];
  return [
    `${unmapped} imported account${unmapped === 1 ? "" : "s"} are unmapped. Map them or mark them ignored before relying on these financials for valuation.`,
  ];
}

function uniqueMappedAccounts(accounts: MappedAccount[]): MappedAccount[] {
  const byKey = new Map<string, MappedAccount>();
  for (const account of accounts) {
    const key = accountMappingKey(account);
    const existing = byKey.get(key);
    byKey.set(key, {
      ...account,
      amount: Number(existing?.amount ?? 0) + Number(account.amount ?? 0),
    });
  }
  return Array.from(byKey.values()).sort((a, b) =>
    a.sourceAccountName.localeCompare(b.sourceAccountName),
  );
}
