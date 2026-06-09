// Server-only Xero OAuth + reporting helpers.
// Do NOT import from client code — this file uses process.env secrets.
import { autoMapAccount, type NormalizedAccountField } from "@/lib/account-mapping";

const XERO_AUTH_URL = "https://login.xero.com/identity/connect/authorize";
const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_API_BASE = "https://api.xero.com/api.xro/2.0";
const XERO_CONNECTIONS_URL = "https://api.xero.com/connections";

export const XERO_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "accounting.reports.profitandloss.read",
  "accounting.reports.balancesheet.read",
].join(" ");

export function getXeroCreds() {
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Xero is not configured. Missing XERO_CLIENT_ID or XERO_CLIENT_SECRET.");
  }
  return { clientId, clientSecret };
}

export function buildAuthorizeUrl(opts: { state: string; redirectUri: string }) {
  const { clientId } = getXeroCreds();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: opts.redirectUri,
    scope: XERO_SCOPES,
    state: opts.state,
  });
  return `${XERO_AUTH_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
};

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const { clientId, clientSecret } = getXeroCreds();
  const basic = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    throw new Error(`Xero token exchange failed [${res.status}]`);
  }
  return res.json() as Promise<TokenResponse>;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = getXeroCreds();
  const basic = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) {
    throw new Error(`Xero token refresh failed [${res.status}]`);
  }
  return res.json() as Promise<TokenResponse>;
}

export type XeroTenant = {
  id: string;
  authEventId: string;
  tenantId: string;
  tenantType: string;
  tenantName: string;
  createdDateUtc: string;
  updatedDateUtc: string;
};

export async function listTenants(accessToken: string): Promise<XeroTenant[]> {
  const res = await fetch(XERO_CONNECTIONS_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Xero connections list failed [${res.status}]`);
  }
  return res.json() as Promise<XeroTenant[]>;
}

async function xeroReport(opts: {
  accessToken: string;
  tenantId: string;
  report: "ProfitAndLoss" | "BalanceSheet";
  params?: Record<string, string>;
}) {
  const url = new URL(`${XERO_API_BASE}/Reports/${opts.report}`);
  if (opts.params) {
    for (const [k, v] of Object.entries(opts.params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      "Xero-tenant-id": opts.tenantId,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Xero ${opts.report} failed [${res.status}]`);
  }
  return res.json();
}

export type ParsedYear = {
  year: number;
  revenue: number;
  cogs: number;
  gross_profit: number;
  operating_expenses: number;
  owner_salary: number;
  addbacks: number;
  ebitda: number;
  net_income: number;
  depreciation: number;
  amortization: number;
  interest: number;
  income_taxes: number;
  assets: number;
  liabilities: number;
  debt: number;
  accounts?: XeroMappedAccount[];
  warnings?: string[];
};

export type XeroMappedAccount = {
  year: number;
  statement: "profit_and_loss" | "balance_sheet";
  sourceAccountName: string;
  sourceAccountType: string | null;
  amount: number;
  normalizedField: NormalizedAccountField;
};

// Xero report row shape
type XRow = {
  RowType?: string;
  Title?: string;
  Cells?: Array<{ Value?: string }>;
  Rows?: XRow[];
};

function num(s: unknown): number {
  if (s == null) return 0;
  const str = s.toString().trim();
  if (!str) return 0;
  // Handle parenthesised negatives e.g. "(1,234.56)"
  const isNeg = /^\(.*\)$/.test(str);
  const cleaned = str.replace(/[(),$\s]/g, "").replace(/[)]/g, "");
  const n = parseFloat(cleaned);
  if (isNaN(n)) return 0;
  return isNeg ? -n : n;
}

function hasNumericValue(s: unknown): boolean {
  if (s == null) return false;
  const str = s.toString().trim();
  if (!str) return false;
  const cleaned = str.replace(/[(),$\s]/g, "").replace(/[)]/g, "");
  return cleaned !== "" && Number.isFinite(Number.parseFloat(cleaned));
}

// Get the numeric value column for a single-period report row. Xero returns
// [labelCell, valueCell] for a single period, or [labelCell, ...periodCells] for multi-period.
// We always take the FIRST numeric value (the most recent / requested period).
function rowValue(row: XRow): number {
  const cells = row.Cells ?? [];
  if (cells.length < 2) return 0;
  const valueCell = cells.slice(1).find((cell) => hasNumericValue(cell?.Value));
  return num(valueCell?.Value);
}

function rowLabel(row: XRow): string {
  return (row.Cells?.[0]?.Value ?? row.Title ?? "").trim();
}

// Walk all rows (recursively) and yield rows of given RowType.
function* walkRows(rows: XRow[]): Generator<XRow> {
  for (const r of rows) {
    yield r;
    if (r.Rows && r.Rows.length) yield* walkRows(r.Rows);
  }
}

function* walkRowsWithSection(
  rows: XRow[],
  sectionTitle: string | null = null,
): Generator<{ row: XRow; sectionTitle: string | null }> {
  for (const row of rows) {
    const nextSection =
      row.RowType === "Section" && row.Title ? row.Title.trim() : sectionTitle;
    yield { row, sectionTitle: nextSection };
    if (row.Rows && row.Rows.length) yield* walkRowsWithSection(row.Rows, nextSection);
  }
}

function sectionTotal(row: XRow): number | null {
  const directSummary = (row.Rows ?? []).find((x) => x.RowType === "SummaryRow");
  if (directSummary) return rowValue(directSummary);

  let lastSummary: XRow | null = null;
  for (const child of walkRows(row.Rows ?? [])) {
    if (child.RowType === "SummaryRow") lastSummary = child;
  }
  return lastSummary ? rowValue(lastSummary) : null;
}

// Find the SummaryRow inside a top-level Section by Title regex.
function sectionSummary(rows: XRow[], titleRe: RegExp): number | null {
  for (const r of walkRows(rows)) {
    if (r.RowType === "Section" && r.Title && titleRe.test(r.Title)) {
      const total = sectionTotal(r);
      if (total != null) return total;
    }
  }
  return null;
}

function sumSectionSummaries(rows: XRow[], includeRe: RegExp, excludeRe?: RegExp): number | null {
  let total = 0;
  let matched = false;

  const visit = (items: XRow[]) => {
    for (const r of items) {
      if (r.RowType !== "Section" || !r.Title) continue;
      const title = r.Title;
      if (includeRe.test(title) && !(excludeRe?.test(title) ?? false)) {
        const value = sectionTotal(r);
        if (value != null) {
          total += Math.abs(value);
          matched = true;
          continue;
        }
      }
      visit(r.Rows ?? []);
    }
  };

  visit(rows);
  return matched ? total : null;
}

function sumLineItemsByLabel(rows: XRow[], includeRe: RegExp, excludeRe?: RegExp): number {
  let total = 0;
  for (const r of walkRows(rows)) {
    if (r.RowType !== "Row") continue;
    const label = rowLabel(r);
    if (includeRe.test(label) && !(excludeRe?.test(label) ?? false)) {
      total += Math.abs(rowValue(r));
    }
  }
  return total;
}

// Find any SummaryRow whose first cell label matches regex (anywhere in tree).
function summaryByLabel(rows: XRow[], labelRe: RegExp): number | null {
  for (const r of walkRows(rows)) {
    if (r.RowType === "SummaryRow") {
      const label = rowLabel(r);
      if (labelRe.test(label)) return rowValue(r);
    }
  }
  return null;
}

function rowByLabel(rows: XRow[], labelRe: RegExp): number | null {
  for (const r of walkRows(rows)) {
    if (r.RowType === "Row") {
      const label = rowLabel(r);
      if (labelRe.test(label)) return rowValue(r);
    }
  }
  return null;
}

export function parsePnl(report: unknown): {
  revenue: number;
  cogs: number;
  gross_profit: number;
  operating_expenses: number;
  interest: number;
  depreciation: number;
  amortization: number;
  income_taxes: number;
  net_income: number;
} {
  const reports = (report as { Reports?: Array<{ Rows?: XRow[] }> }).Reports;
  const rows = reports?.[0]?.Rows ?? [];

  const revenue =
    sectionSummary(rows, /^(income|revenue|trading income|operating revenue|sales)$/i) ??
    summaryByLabel(rows, /^total\s+(income|revenue|trading income|operating revenue|sales)/i) ??
    0;

  const cogs =
    sectionSummary(rows, /^(less\s+)?cost of (goods sold|sales)$/i) ??
    summaryByLabel(rows, /^total\s+cost of (goods sold|sales)/i) ??
    0;

  const gross_profit =
    summaryByLabel(rows, /^gross\s+profit/i) ??
    rowByLabel(rows, /^gross\s+profit/i) ??
    revenue - cogs;

  const net_income =
    summaryByLabel(
      rows,
      /^(net\s+(profit|income|earnings|loss)|profit\s+for the (year|period))/i,
    ) ??
    rowByLabel(rows, /^net\s+income$/i) ??
    rowByLabel(rows, /^(net\s+(profit|income|earnings|loss)|profit\s+for the (year|period))/i) ??
    null;

  const belowLineRe = /(interest|finance cost|tax|income tax|depreciation|amorti[sz]ation)/i;
  const opex_from_sections =
    sumSectionSummaries(
      rows,
      /(operating\s+expenses?|expenses?|overheads?|administrative|general|selling|distribution)/i,
      new RegExp(`cost of (goods sold|sales)|${belowLineRe.source}`, "i"),
    ) ?? 0;

  const interest = sumLineItemsByLabel(
    rows,
    /(interest|finance cost)/i,
    /income|received|revenue/i,
  );
  const depreciation = sumLineItemsByLabel(rows, /depreciation/i);
  const amortization = sumLineItemsByLabel(rows, /amorti[sz]ation/i);
  const income_taxes = sumLineItemsByLabel(
    rows,
    /(income\s+tax|tax\s+expense|corporation\s+tax|provision\s+for\s+(income\s+)?tax)/i,
    /(refund|credit|recover)/i,
  );

  // Most reliable source for the app's "Operating expenses" row is the full
  // expense bridge from gross profit to net income. Do not subtract EBITDA
  // add-backs here; EBITDA adds them back separately below.
  let operating_expenses: number;
  if (net_income != null && gross_profit) {
    operating_expenses = Math.max(0, gross_profit - net_income);
  } else {
    operating_expenses =
      opex_from_sections ||
      Math.abs(summaryByLabel(rows, /^total\s+(operating\s+)?expenses/i) ?? 0);
  }

  operating_expenses = Math.max(0, operating_expenses);

  const final_net_income = net_income ?? gross_profit - operating_expenses;

  return {
    revenue,
    cogs,
    gross_profit,
    operating_expenses,
    interest,
    depreciation,
    amortization,
    income_taxes,
    net_income: final_net_income,
  };
}

export function parseBalanceSheet(report: unknown): {
  assets: number;
  liabilities: number;
  debt: number;
} {
  const reports = (report as { Reports?: Array<{ Rows?: XRow[] }> }).Reports;
  const rows = reports?.[0]?.Rows ?? [];

  // Total assets / liabilities — Xero emits these as top-level SummaryRows OR "Section" titled accordingly.
  const assets = summaryByLabel(rows, /^total\s+assets/i) ?? sectionSummary(rows, /^assets$/i) ?? 0;

  let liabilities =
    summaryByLabel(rows, /^total\s+liabilities/i) ?? sectionSummary(rows, /^liabilities$/i) ?? 0;

  // If still 0, sum any liability-style section summaries (current + non-current + bank overdrafts).
  if (liabilities === 0) {
    for (const r of rows) {
      if (r.RowType !== "Section" || !r.Title) continue;
      if (
        /(current\s+liabilities|non.?current\s+liabilities|long.?term\s+liabilities)/i.test(r.Title)
      ) {
        const summary = (r.Rows ?? []).find((x) => x.RowType === "SummaryRow");
        if (summary) liabilities += rowValue(summary);
      }
    }
  }

  // Debt: prefer "Total Non-Current Liabilities" / "Total Long-Term Liabilities" section total
  // (these are dominated by loans). Fall back to summing rows whose labels look like loans.
  let debt = summaryByLabel(rows, /^total\s+(non.?current|long.?term)\s+liabilities/i) ?? 0;

  if (debt === 0) {
    for (const r of walkRows(rows)) {
      if (r.RowType !== "Row") continue;
      const label = r.Cells?.[0]?.Value ?? "";
      if (
        /(loan|borrowing|note[s]?\s+payable|long.?term\s+debt|bank\s+debt|mortgage)/i.test(label)
      ) {
        debt += Math.abs(rowValue(r));
      }
    }
  }

  return { assets: Math.abs(assets), liabilities: Math.abs(liabilities), debt };
}

export function extractXeroMappedAccounts(opts: {
  report: unknown;
  year: number;
  statement: "profit_and_loss" | "balance_sheet";
}): XeroMappedAccount[] {
  const reports = (opts.report as { Reports?: Array<{ Rows?: XRow[] }> }).Reports;
  const rows = reports?.[0]?.Rows ?? [];
  const accounts: XeroMappedAccount[] = [];

  for (const { row, sectionTitle } of walkRowsWithSection(rows)) {
    if (row.RowType !== "Row") continue;
    const sourceAccountName = rowLabel(row);
    if (!sourceAccountName || /^total\b/i.test(sourceAccountName)) continue;
    const amount = rowValue(row);
    if (!amount) continue;
    const normalizedField = autoMapAccount({
      sourceAccountName,
      sourceAccountType: sectionTitle,
    });
    accounts.push({
      year: opts.year,
      statement: opts.statement,
      sourceAccountName,
      sourceAccountType: sectionTitle,
      amount: round(amount),
      normalizedField,
    });
  }

  return accounts;
}

function buildXeroWarnings(year: number, parsed: ParsedYear, accounts: XeroMappedAccount[]) {
  const warnings: string[] = [];
  if (parsed.revenue === 0) {
    warnings.push(`${year}: no revenue was found in the Xero Profit and Loss report.`);
  }
  if (parsed.assets === 0 && parsed.liabilities === 0) {
    warnings.push(`${year}: no Balance Sheet totals were found.`);
  }
  const unmapped = new Set(
    accounts
      .filter((account) => account.normalizedField === "unmapped")
      .map((account) => account.sourceAccountName),
  );
  if (unmapped.size > 0) {
    warnings.push(`${year}: ${unmapped.size} account(s) need mapping review.`);
  }
  return warnings;
}

export async function fetchYearSummary(opts: {
  accessToken: string;
  tenantId: string;
  year: number;
}): Promise<ParsedYear> {
  const fromDate = `${opts.year}-01-01`;
  const toDate = `${opts.year}-12-31`;
  const [pnlReport, bsReport] = await Promise.all([
    xeroReport({
      accessToken: opts.accessToken,
      tenantId: opts.tenantId,
      report: "ProfitAndLoss",
      params: { fromDate, toDate, standardLayout: "true" },
    }),
    xeroReport({
      accessToken: opts.accessToken,
      tenantId: opts.tenantId,
      report: "BalanceSheet",
      params: { date: toDate, standardLayout: "true" },
    }),
  ]);
  const pnl = parsePnl(pnlReport);
  const bs = parseBalanceSheet(bsReport);

  // EBITDA = net income + interest + depreciation + amortization + income taxes
  const ebitda =
    pnl.net_income + pnl.interest + pnl.depreciation + pnl.amortization + pnl.income_taxes;

  const parsed: ParsedYear = {
    year: opts.year,
    revenue: round(pnl.revenue),
    cogs: round(pnl.cogs),
    gross_profit: round(pnl.gross_profit),
    operating_expenses: round(pnl.operating_expenses),
    owner_salary: 0,
    addbacks: 0,
    ebitda: round(ebitda),
    net_income: round(pnl.net_income),
    depreciation: round(pnl.depreciation),
    amortization: round(pnl.amortization),
    interest: round(pnl.interest),
    income_taxes: round(pnl.income_taxes),
    assets: round(bs.assets),
    liabilities: round(bs.liabilities),
    debt: round(bs.debt),
  };
  const accounts = [
    ...extractXeroMappedAccounts({
      report: pnlReport,
      year: opts.year,
      statement: "profit_and_loss",
    }),
    ...extractXeroMappedAccounts({
      report: bsReport,
      year: opts.year,
      statement: "balance_sheet",
    }),
  ];

  return {
    ...parsed,
    accounts,
    warnings: buildXeroWarnings(opts.year, parsed, accounts),
  };
}

function round(n: number) {
  return Math.round(n);
}
