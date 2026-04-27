// Server-only Xero OAuth + reporting helpers.
// Do NOT import from client code — this file uses process.env secrets.

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

export function buildAuthorizeUrl(opts: {
  state: string;
  redirectUri: string;
}) {
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

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenResponse> {
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
    throw new Error(`Xero token exchange failed [${res.status}]: ${await res.text()}`);
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
    throw new Error(`Xero token refresh failed [${res.status}]: ${await res.text()}`);
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
    throw new Error(`Xero connections list failed [${res.status}]: ${await res.text()}`);
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
    throw new Error(`Xero ${opts.report} failed [${res.status}]: ${await res.text()}`);
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
  assets: number;
  liabilities: number;
  debt: number;
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

// Get the numeric value column for a single-period report row. Xero returns
// [labelCell, valueCell] for a single period, or [labelCell, ...periodCells] for multi-period.
// We always take the FIRST numeric value (the most recent / requested period).
function rowValue(row: XRow): number {
  const cells = row.Cells ?? [];
  if (cells.length < 2) return 0;
  return num(cells[1]?.Value);
}

// Walk all rows (recursively) and yield rows of given RowType.
function* walkRows(rows: XRow[]): Generator<XRow> {
  for (const r of rows) {
    yield r;
    if (r.Rows && r.Rows.length) yield* walkRows(r.Rows);
  }
}

// Find the SummaryRow inside a top-level Section by Title regex.
function sectionSummary(rows: XRow[], titleRe: RegExp): number | null {
  for (const r of rows) {
    if (r.RowType === "Section" && r.Title && titleRe.test(r.Title)) {
      const summary = (r.Rows ?? []).find((x) => x.RowType === "SummaryRow");
      if (summary) return rowValue(summary);
    }
  }
  return null;
}

// Find any SummaryRow whose first cell label matches regex (anywhere in tree).
function summaryByLabel(rows: XRow[], labelRe: RegExp): number | null {
  for (const r of walkRows(rows)) {
    if (r.RowType === "SummaryRow") {
      const label = r.Cells?.[0]?.Value ?? "";
      if (labelRe.test(label)) return rowValue(r);
    }
  }
  return null;
}

function parsePnl(report: unknown): {
  revenue: number;
  cogs: number;
  gross_profit: number;
  operating_expenses: number;
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

  // Sum ALL expense-style sections (operating, less operating expenses, expenses, overheads, etc.)
  // because Xero may split into "Operating Expenses" and "Less Operating Expenses" or multiple groups.
  let operating_expenses = 0;
  for (const r of rows) {
    if (r.RowType !== "Section" || !r.Title) continue;
    if (/^(less\s+)?(operating\s+)?expenses$/i.test(r.Title) || /overheads/i.test(r.Title)) {
      const summary = (r.Rows ?? []).find((x) => x.RowType === "SummaryRow");
      if (summary) operating_expenses += rowValue(summary);
    }
  }
  if (operating_expenses === 0) {
    operating_expenses =
      summaryByLabel(rows, /^total\s+(operating\s+)?expenses/i) ?? 0;
  }

  const gross_profit =
    summaryByLabel(rows, /^gross\s+profit/i) ?? revenue - cogs;

  const net_income =
    summaryByLabel(rows, /^(net\s+(profit|income|earnings|loss)|profit\s+for the (year|period))/i) ??
    gross_profit - operating_expenses;

  return { revenue, cogs, gross_profit, operating_expenses, net_income };
}

function parseBalanceSheet(report: unknown): {
  assets: number;
  liabilities: number;
  debt: number;
} {
  const reports = (report as { Reports?: Array<{ Rows?: XRow[] }> }).Reports;
  const rows = reports?.[0]?.Rows ?? [];

  // Total assets / liabilities — Xero emits these as top-level SummaryRows OR "Section" titled accordingly.
  const assets =
    summaryByLabel(rows, /^total\s+assets/i) ??
    sectionSummary(rows, /^assets$/i) ??
    0;

  let liabilities =
    summaryByLabel(rows, /^total\s+liabilities/i) ??
    sectionSummary(rows, /^liabilities$/i) ??
    0;

  // If still 0, sum any liability-style section summaries (current + non-current + bank overdrafts).
  if (liabilities === 0) {
    for (const r of rows) {
      if (r.RowType !== "Section" || !r.Title) continue;
      if (/(current\s+liabilities|non.?current\s+liabilities|long.?term\s+liabilities)/i.test(r.Title)) {
        const summary = (r.Rows ?? []).find((x) => x.RowType === "SummaryRow");
        if (summary) liabilities += rowValue(summary);
      }
    }
  }

  // Debt: prefer "Total Non-Current Liabilities" / "Total Long-Term Liabilities" section total
  // (these are dominated by loans). Fall back to summing rows whose labels look like loans.
  let debt =
    summaryByLabel(rows, /^total\s+(non.?current|long.?term)\s+liabilities/i) ?? 0;

  if (debt === 0) {
    for (const r of walkRows(rows)) {
      if (r.RowType !== "Row") continue;
      const label = r.Cells?.[0]?.Value ?? "";
      if (/(loan|borrowing|note[s]?\s+payable|long.?term\s+debt|bank\s+debt|mortgage)/i.test(label)) {
        debt += Math.abs(rowValue(r));
      }
    }
  }

  return { assets: Math.abs(assets), liabilities: Math.abs(liabilities), debt };
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

  // Best-effort EBITDA approximation: net_income + (interest + tax + D&A if available is unknown here).
  // Without those breakdowns we use Operating Profit ≈ Gross Profit - Operating Expenses.
  const ebitda = pnl.gross_profit - pnl.operating_expenses;

  return {
    year: opts.year,
    revenue: round(pnl.revenue),
    cogs: round(pnl.cogs),
    gross_profit: round(pnl.gross_profit),
    operating_expenses: round(pnl.operating_expenses),
    owner_salary: 0,
    addbacks: 0,
    ebitda: round(ebitda),
    net_income: round(pnl.net_income),
    assets: round(bs.assets),
    liabilities: round(bs.liabilities),
    debt: round(bs.debt),
  };
}

function round(n: number) {
  return Math.round(n);
}
