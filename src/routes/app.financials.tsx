import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { toBusinessInputs, useBusiness, type FinancialYearRow } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { fmtCurrency } from "@/lib/format";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { startXeroConnect, importXeroFinancials, listXeroConnections } from "@/lib/xero.functions";
import {
  disconnectQuickBooksConnection,
  listQuickBooksConnections,
  refreshQuickBooksConnection,
  startQuickBooksConnect,
} from "@/lib/quickbooks.functions";
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
import {
  dataQualityAcknowledgementKey,
  reviewFinancialData,
  type DataQualityReview,
} from "@/lib/data-quality";
import { valueBusiness } from "@/lib/valuation";

export const Route = createFileRoute("/app/financials")({
  head: () => ({ meta: [{ title: "Financials — ValuRight.ai" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    quickbooks:
      search.quickbooks === "connected" || search.quickbooks === "error"
        ? search.quickbooks
        : undefined,
    message: typeof search.message === "string" ? search.message : undefined,
  }),
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
type FinancialAddBackRow = Database["public"]["Tables"]["financial_addbacks"]["Row"];
type FinancialAddBackEventInsert =
  Database["public"]["Tables"]["financial_addback_events"]["Insert"];
type FinancialFieldKey = (typeof FIELD_KEYS)[number];
type XeroImportSummary = {
  importedAccounts: number;
  unmappedAccounts: string[];
  warnings: string[];
  lastSyncedAt: string;
};

const ACCOUNT_ROLLUP_KEYS: FinancialFieldKey[] = [...FIELD_KEYS];
const ADD_BACK_CATEGORIES = [
  "Owner personal expense",
  "One-time expense",
  "Non-recurring professional fees",
  "Owner benefit",
  "Other normalization",
] as const;

function Financials() {
  const { current } = useBusiness();
  const search = Route.useSearch();
  const [years, setYears] = useState<FinancialYearRow[]>([]);
  const [addBacks, setAddBacks] = useState<FinancialAddBackRow[]>([]);
  const [deletedAddBacks, setDeletedAddBacks] = useState<FinancialAddBackRow[]>([]);
  const [originalAddBacks, setOriginalAddBacks] = useState<Record<string, FinancialAddBackRow>>({});
  const [saving, setSaving] = useState(false);
  const [accountMappings, setAccountMappings] = useState<SavedAccountMapping[]>([]);
  const [mappingReview, setMappingReview] = useState<MappedAccount[]>([]);
  const [savingMappings, setSavingMappings] = useState(false);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [xeroImportSummary, setXeroImportSummary] = useState<XeroImportSummary | null>(null);

  const startXero = useServerFn(startXeroConnect);
  const importXero = useServerFn(importXeroFinancials);
  const fetchConnections = useServerFn(listXeroConnections);
  const startQuickBooks = useServerFn(startQuickBooksConnect);
  const fetchQuickBooksConnections = useServerFn(listQuickBooksConnections);
  const refreshQuickBooks = useServerFn(refreshQuickBooksConnection);
  const disconnectQuickBooks = useServerFn(disconnectQuickBooksConnection);
  const [xeroLoading, setXeroLoading] = useState(false);
  const [quickBooksLoading, setQuickBooksLoading] = useState(false);
  const [xeroTenants, setXeroTenants] = useState<
    { tenant_id: string; tenant_name: string | null; last_synced_at?: string | null }[]
  >([]);
  const [quickBooksConnections, setQuickBooksConnections] = useState<
    {
      id: string;
      realm_id: string;
      company_name: string | null;
      last_synced_at: string | null;
      created_at: string;
    }[]
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
        .from("financial_addbacks")
        .select("*")
        .eq("business_id", current.id)
        .order("year", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("account_mappings")
        .select("*")
        .eq("business_id", current.id)
        .order("source_account_name", { ascending: true }),
    ]).then(([financialsResult, addBacksResult, mappingsResult]) => {
      setYears(financialsResult.data ?? []);
      const loadedAddBacks = (addBacksResult.data ?? []) as FinancialAddBackRow[];
      setAddBacks(loadedAddBacks);
      setDeletedAddBacks([]);
      setOriginalAddBacks(Object.fromEntries(loadedAddBacks.map((row) => [row.id, row])));
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
            connections.map((c) => ({
              tenant_id: c.tenant_id,
              tenant_name: c.tenant_name,
              last_synced_at: c.last_synced_at,
            })),
          );
          setSelectedTenant((prev) => prev ?? connections[0].tenant_id);
        }
      })
      .catch(() => {});
  }, [fetchConnections]);

  useEffect(() => {
    fetchQuickBooksConnections({})
      .then(({ connections }) => {
        setQuickBooksConnections(connections);
      })
      .catch(() => {});
  }, [fetchQuickBooksConnections]);

  useEffect(() => {
    if (search.quickbooks === "connected") {
      toast.success("Connected to QuickBooks Online.");
      void loadQuickBooksConnections();
    }
    if (search.quickbooks === "error") {
      toast.error(`QuickBooks connection failed: ${search.message ?? "unknown error"}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.quickbooks, search.message]);

  const loadQuickBooksConnections = async () => {
    const { connections } = await fetchQuickBooksConnections({});
    setQuickBooksConnections(connections);
  };

  const update = (i: number, key: string, val: number) => {
    setYears((prev) => prev.map((y, idx) => (idx === i ? { ...y, [key]: val } : y)));
  };

  const calcEbitda = (y: Partial<FinancialYearRow> & Record<string, unknown>) =>
    Number(y.net_income ?? 0) +
    Number(y.depreciation ?? 0) +
    Number(y.amortization ?? 0) +
    Number(y.interest ?? 0) +
    Number(y.income_taxes ?? 0);

  const addBackRowsForYear = (year: number) =>
    addBacks.filter((addBack) => Number(addBack.year) === Number(year));

  const reviewedAddBackTotal = (year: number, fallback: number | null | undefined) => {
    const rowsForYear = addBackRowsForYear(year);
    if (!rowsForYear.length) return Number(fallback ?? 0);
    return rowsForYear.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  };

  const addBackTotalsByYear = useMemo(() => {
    const totals = new Map<number, number>();
    for (const year of years) {
      totals.set(year.year, reviewedAddBackTotal(year.year, year.addbacks));
    }
    return totals;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years, addBacks]);

  const yearsWithReviewedAddBacks = useMemo(
    () =>
      years.map(
        (year) =>
          ({
            ...year,
            addbacks: addBackTotalsByYear.get(year.year) ?? Number(year.addbacks ?? 0),
          }) as FinancialYearRow,
      ),
    [years, addBackTotalsByYear],
  );

  const addBackImpact = useMemo(() => {
    if (!current || years.length === 0) return null;
    const withReview = valueBusiness(toBusinessInputs(current, yearsWithReviewedAddBacks));
    const withoutAddBacks = valueBusiness(
      toBusinessInputs(
        current,
        yearsWithReviewedAddBacks.map((year) => ({ ...year, addbacks: 0 }) as FinancialYearRow),
      ),
    );
    return {
      amount: Array.from(addBackTotalsByYear.values()).reduce((sum, value) => sum + value, 0),
      rangeLowDelta: withReview.rangeLow - withoutAddBacks.rangeLow,
      rangeHighDelta: withReview.rangeHigh - withoutAddBacks.rangeHigh,
    };
  }, [addBackTotalsByYear, current, years.length, yearsWithReviewedAddBacks]);

  const addAddBack = (year: number) => {
    if (!current) return;
    const now = new Date().toISOString();
    setAddBacks((prev) => [
      ...prev,
      {
        id: `tmp-addback-${crypto.randomUUID()}`,
        business_id: current.id,
        year,
        amount: 0,
        category: ADD_BACK_CATEGORIES[0],
        note: "",
        is_recurring: false,
        created_at: now,
        updated_at: now,
      },
    ]);
  };

  const updateAddBack = (
    id: string,
    key: "year" | "amount" | "category" | "note" | "is_recurring",
    value: string | number | boolean,
  ) => {
    setAddBacks((prev) =>
      prev.map((row) => (row.id === id ? ({ ...row, [key]: value } as FinancialAddBackRow) : row)),
    );
  };

  const removeAddBack = (row: FinancialAddBackRow) => {
    if (!row.id.startsWith("tmp-addback-")) {
      setDeletedAddBacks((prev) => [...prev, row]);
    }
    setAddBacks((prev) => prev.filter((addBack) => addBack.id !== row.id));
  };

  const addBackSnapshot = (row: FinancialAddBackRow) => ({
    amount: Number(row.amount ?? 0),
    category: row.category,
    note: row.note ?? null,
    is_recurring: Boolean(row.is_recurring),
    year: Number(row.year),
  });

  const writeAddBackEvents = async (events: FinancialAddBackEventInsert[]) => {
    if (!events.length) return;
    const { error } = await supabase.from("financial_addback_events").insert(events);
    if (error) throw error;
  };

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
    const importYears = new Set(
      accounts.map((account) => account.year).filter(Boolean) as number[],
    );
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
      const result = await importXero({
        data: { tenantId: selectedTenant, years: requestedYears },
      });
      const imported = result.years;
      mergeImported(imported);
      setMappingReview([]);
      setXeroImportSummary(result.summary);
      setImportWarnings(
        result.summary.warnings.length
          ? result.summary.warnings
          : [
              "Xero report totals were imported automatically. Review owner salary, add-backs, and any unusual accounts before saving the valuation.",
            ],
      );
      await fetchConnections({})
        .then(({ connections }) =>
          setXeroTenants(
            connections.map((c) => ({
              tenant_id: c.tenant_id,
              tenant_name: c.tenant_name,
              last_synced_at: c.last_synced_at,
            })),
          ),
        )
        .catch(() => {});
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

  const handleConnectQuickBooks = async () => {
    if (!current) return;
    try {
      setQuickBooksLoading(true);
      const { url } = await startQuickBooks({ data: { businessId: current.id } });
      window.location.href = url;
    } catch (e) {
      setQuickBooksLoading(false);
      toast.error(e instanceof Error ? e.message : "Failed to start QuickBooks connect");
    }
  };

  const handleRefreshQuickBooks = async (connectionId: string) => {
    try {
      setQuickBooksLoading(true);
      await refreshQuickBooks({ data: { connectionId } });
      await loadQuickBooksConnections();
      toast.success("QuickBooks connection refreshed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not refresh QuickBooks connection");
    } finally {
      setQuickBooksLoading(false);
    }
  };

  const handleDisconnectQuickBooks = async (connectionId: string) => {
    try {
      setQuickBooksLoading(true);
      await disconnectQuickBooks({ data: { connectionId } });
      await loadQuickBooksConnections();
      toast.success("QuickBooks disconnected");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not disconnect QuickBooks");
    } finally {
      setQuickBooksLoading(false);
    }
  };

  const save = async () => {
    if (!current) return;
    setSaving(true);
    try {
      const auditEvents: FinancialAddBackEventInsert[] = [];

      for (const y of yearsWithReviewedAddBacks) {
        const payload = {
          year: y.year,
          revenue: Number(y.revenue ?? 0),
          cogs: Number(y.cogs ?? 0),
          gross_profit: Number(y.revenue ?? 0) - Number(y.cogs ?? 0),
          operating_expenses: Number(y.operating_expenses ?? 0),
          owner_salary: Number(y.owner_salary ?? 0),
          addbacks: Number(addBackTotalsByYear.get(y.year) ?? y.addbacks ?? 0),
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

      for (const row of addBacks) {
        const payload = {
          business_id: current.id,
          year: Number(row.year),
          amount: Number(row.amount ?? 0),
          category: row.category || ADD_BACK_CATEGORIES[0],
          note: row.note?.trim() || null,
          is_recurring: Boolean(row.is_recurring),
        };
        if (row.id.startsWith("tmp-addback-")) {
          const { data, error } = await supabase
            .from("financial_addbacks")
            .insert(payload)
            .select("*")
            .single();
          if (error) throw error;
          if (data) {
            auditEvents.push({
              action: "created",
              addback_id: data.id,
              business_id: current.id,
              year: Number(data.year),
              after_value: addBackSnapshot(data as FinancialAddBackRow),
            });
          }
        } else {
          const before = originalAddBacks[row.id];
          const { data, error } = await supabase
            .from("financial_addbacks")
            .update(payload)
            .eq("id", row.id)
            .select("*")
            .single();
          if (error) throw error;
          if (
            data &&
            JSON.stringify(addBackSnapshot(before ?? row)) !==
              JSON.stringify(addBackSnapshot(data as FinancialAddBackRow))
          ) {
            auditEvents.push({
              action: "updated",
              addback_id: row.id,
              business_id: current.id,
              year: Number(data.year),
              before_value: before ? addBackSnapshot(before) : null,
              after_value: addBackSnapshot(data as FinancialAddBackRow),
            });
          }
        }
      }

      for (const row of deletedAddBacks) {
        const { error } = await supabase.from("financial_addbacks").delete().eq("id", row.id);
        if (error) throw error;
        auditEvents.push({
          action: "deleted",
          addback_id: row.id,
          business_id: current.id,
          year: Number(row.year),
          before_value: addBackSnapshot(row),
        });
      }

      await writeAddBackEvents(auditEvents);

      toast.success("Financials saved");
      const [financialsResult, addBacksResult] = await Promise.all([
        supabase
          .from("financial_years")
          .select("*")
          .eq("business_id", current.id)
          .order("year", { ascending: true }),
        supabase
          .from("financial_addbacks")
          .select("*")
          .eq("business_id", current.id)
          .order("year", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);
      setYears(financialsResult.data ?? []);
      const loadedAddBacks = (addBacksResult.data ?? []) as FinancialAddBackRow[];
      setAddBacks(loadedAddBacks);
      setDeletedAddBacks([]);
      setOriginalAddBacks(Object.fromEntries(loadedAddBacks.map((row) => [row.id, row])));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const removeYear = async (i: number) => {
    const y = years[i];
    const removedYearAddBacks = addBackRowsForYear(y.year);
    const persistedRemovedAddBacks = removedYearAddBacks.filter(
      (row) => !row.id.startsWith("tmp-addback-"),
    );
    if (current && persistedRemovedAddBacks.length > 0) {
      await writeAddBackEvents(
        persistedRemovedAddBacks.map((row) => ({
          action: "deleted",
          addback_id: row.id,
          business_id: current.id,
          year: Number(row.year),
          before_value: addBackSnapshot(row),
        })),
      );
      await supabase
        .from("financial_addbacks")
        .delete()
        .in(
          "id",
          persistedRemovedAddBacks.map((row) => row.id),
        );
    }
    setAddBacks((prev) => prev.filter((row) => Number(row.year) !== Number(y.year)));
    if (typeof y.id === "string" && !y.id.startsWith("tmp-")) {
      await supabase.from("financial_years").delete().eq("id", y.id);
    }
    setYears((prev) => prev.filter((_, idx) => idx !== i));
  };

  const unmappedCount = countUnmappedAccounts(mappingReview);
  const dataQuality = useMemo(
    () => reviewFinancialData(years, { unmappedAccountCount: unmappedCount }),
    [years, unmappedCount],
  );
  const dataQualityAckKey = useMemo(
    () => dataQualityAcknowledgementKey(current?.id, dataQuality),
    [current?.id, dataQuality],
  );
  const [dataQualityAcknowledged, setDataQualityAcknowledged] = useState(false);

  useEffect(() => {
    if (!dataQualityAckKey || typeof window === "undefined") {
      setDataQualityAcknowledged(false);
      return;
    }
    setDataQualityAcknowledged(window.localStorage.getItem(dataQualityAckKey) === "true");
  }, [dataQualityAckKey]);

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
  const mappingRows = uniqueMappedAccounts(mappingReview);
  const selectedXeroTenant = xeroTenants.find((tenant) => tenant.tenant_id === selectedTenant);
  const xeroLastSyncedAt = xeroImportSummary?.lastSyncedAt ?? selectedXeroTenant?.last_synced_at;
  const latestYear = years.length
    ? Math.max(...years.map((year) => year.year))
    : new Date().getFullYear();
  const sortedAddBacks = [...addBacks].sort((a, b) => Number(b.year) - Number(a.year));

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
              Connect Xero, connect QuickBooks, or upload a CSV. Imports merge into existing years;
              click Save to persist.
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
              onClick={handleConnectQuickBooks}
              disabled={quickBooksLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-secondary"
            >
              {quickBooksLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
              {quickBooksConnections.length ? "Reconnect QuickBooks" : "Connect QuickBooks"}
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
        {xeroTenants.length > 0 && (
          <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Xero connected:{" "}
                  {selectedXeroTenant?.tenant_name ?? selectedTenant ?? "Connected organisation"}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Last sync:{" "}
                  {xeroLastSyncedAt
                    ? new Date(xeroLastSyncedAt).toLocaleString()
                    : "Not synced yet"}
                </p>
              </div>
              {xeroImportSummary && (
                <div className="text-right text-[11px] text-muted-foreground">
                  <p>{xeroImportSummary.importedAccounts} account line(s) imported</p>
                  <p>{xeroImportSummary.unmappedAccounts.length} unmapped account(s)</p>
                </div>
              )}
            </div>
            {xeroImportSummary?.unmappedAccounts.length ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Unmapped: {xeroImportSummary.unmappedAccounts.slice(0, 6).join(", ")}
                {xeroImportSummary.unmappedAccounts.length > 6 ? "..." : ""}
              </p>
            ) : null}
          </div>
        )}
        {quickBooksConnections.length > 0 && (
          <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  QuickBooks connected:{" "}
                  {quickBooksConnections[0].company_name ?? quickBooksConnections[0].realm_id}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Last sync:{" "}
                  {quickBooksConnections[0].last_synced_at
                    ? new Date(quickBooksConnections[0].last_synced_at).toLocaleString()
                    : "Not synced yet"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleRefreshQuickBooks(quickBooksConnections[0].id)}
                  disabled={quickBooksLoading}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-60"
                >
                  Refresh status
                </button>
                <button
                  onClick={() => handleDisconnectQuickBooks(quickBooksConnections[0].id)}
                  disabled={quickBooksLoading}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-secondary disabled:opacity-60"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
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

      <FinancialDataQualityPanel review={dataQuality} acknowledged={dataQualityAcknowledged} />

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Owner add-back review</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Itemize owner benefits and one-time adjustments by year. These rows roll up into SDE
              and the valuation range when you save.
            </p>
          </div>
          <button
            onClick={() => addAddBack(latestYear)}
            disabled={years.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-secondary disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" /> Add add-back
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Reviewed add-backs
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-primary">
              {fmtCurrency(addBackImpact?.amount ?? 0, { compact: true })}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-3 md:col-span-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Estimated valuation range effect
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-primary">
              {addBackImpact
                ? `${fmtCurrency(addBackImpact.rangeLowDelta, { compact: true })} - ${fmtCurrency(addBackImpact.rangeHighDelta, { compact: true })}`
                : "$0 - $0"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Compared with the same financials before owner add-backs.
            </p>
          </div>
        </div>

        {years.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Add financial years before reviewing add-backs.
          </p>
        ) : sortedAddBacks.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No itemized add-backs yet. Existing annual add-back totals remain in the financial table
            until reviewed here.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Year</th>
                  <th className="py-2 pr-3 font-medium">Amount</th>
                  <th className="py-2 pr-3 font-medium">Category</th>
                  <th className="py-2 pr-3 font-medium">Note</th>
                  <th className="py-2 pr-3 font-medium">Recurring</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {sortedAddBacks.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-3">
                      <select
                        value={row.year}
                        onChange={(event) =>
                          updateAddBack(row.id, "year", Number(event.target.value))
                        }
                        className="w-24 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                      >
                        {years.map((year) => (
                          <option key={year.id} value={year.year}>
                            {year.year}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        value={formatNumberInputValue(row.amount)}
                        onChange={(event) =>
                          updateAddBack(row.id, "amount", Number(event.target.value) || 0)
                        }
                        className="w-28 rounded-md border border-input bg-background px-2 py-1.5 text-right text-xs"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={row.category}
                        onChange={(event) => updateAddBack(row.id, "category", event.target.value)}
                        className="w-52 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                      >
                        {ADD_BACK_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        value={row.note ?? ""}
                        onChange={(event) => updateAddBack(row.id, "note", event.target.value)}
                        placeholder="Reason or support"
                        className="w-64 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={row.is_recurring}
                          onChange={(event) =>
                            updateAddBack(row.id, "is_recurring", event.target.checked)
                          }
                          className="accent-[oklch(0.45_0.1_158)]"
                        />
                        Recurring
                      </label>
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => removeAddBack(row)}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-destructive hover:bg-secondary"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {yearsWithReviewedAddBacks.map((year) => (
            <div key={year.id} className="rounded-md border border-border px-3 py-2 text-xs">
              <span className="font-semibold text-foreground">{year.year}</span>
              <span className="ml-2 text-muted-foreground">
                SDE add-back total {fmtCurrency(Number(year.addbacks ?? 0), { compact: true })}
              </span>
            </div>
          ))}
        </div>
      </div>

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
                        value={
                          key === "addbacks"
                            ? formatNumberInputValue(addBackTotalsByYear.get(y.year) ?? y.addbacks)
                            : formatNumberInputValue((y as Record<string, unknown>)[key])
                        }
                        readOnly={key === "addbacks"}
                        onChange={(e) => update(i, key, Number(e.target.value) || 0)}
                        className={`w-32 rounded-md border border-input px-2 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-ring ${
                          key === "addbacks"
                            ? "bg-secondary text-muted-foreground"
                            : "bg-background"
                        }`}
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

function FinancialDataQualityPanel({
  review,
  acknowledged,
}: {
  review: DataQualityReview;
  acknowledged: boolean;
}) {
  const isReady = review.status === "ready" || acknowledged;
  const visibleIssues = review.issues.slice(0, 5);
  return (
    <div
      className={`rounded-xl border p-4 text-sm ${
        isReady
          ? "border-accent/30 bg-accent-soft"
          : review.status === "weak"
            ? "border-destructive/40 bg-destructive/10"
            : "border-amber-300 bg-amber-50"
      }`}
    >
      <div className="flex gap-2">
        {isReady ? (
          <SaveIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
        )}
        <div>
          <p className="font-semibold text-foreground">
            Data quality: {acknowledged ? "Acknowledged" : review.label}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {review.yearCount} year{review.yearCount === 1 ? "" : "s"} reviewed
            {review.latestYear ? ` through ${review.latestYear}` : ""}.{" "}
            {acknowledged
              ? "Warnings were acknowledged on the Dashboard for this financial data set."
              : review.summary}
          </p>
          {!acknowledged && visibleIssues.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {visibleIssues.map((issue, index) => (
                <li key={`${issue.title}-${index}`}>
                  <span className="font-semibold text-foreground">{issue.title}:</span>{" "}
                  {issue.detail}
                  {issue.years?.length ? ` Years: ${issue.years.join(", ")}.` : ""}
                </li>
              ))}
            </ul>
          )}
          {acknowledged && review.requiredAcknowledgement && (
            <p className="mt-2 text-xs font-medium text-foreground">
              If you edit and save financials, ValuRight will re-check the new data and may ask for
              acknowledgement again.
            </p>
          )}
          {!acknowledged && review.requiredAcknowledgement && (
            <p className="mt-2 text-xs font-medium text-foreground">
              You can still save financial edits here, but the dashboard will require an explicit
              acknowledgement before saving a valuation snapshot.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatNumberInputValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "0";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "0";
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
