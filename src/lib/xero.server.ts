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

// Walk Xero report row tree and find a "SummaryRow" or "Row" whose first cell label matches predicate.
// Returns the numeric value from the LAST cell (which is the period total for that section).
function findRowValue(rows: unknown[], match: (label: string) => boolean): number | null {
  for (const r of rows as Array<Record<string, unknown>>) {
    const rowType = r.RowType as string | undefined;
    const cells = r.Cells as Array<{ Value?: string }> | undefined;
    if ((rowType === "Row" || rowType === "SummaryRow") && cells && cells.length >= 2) {
      const label = (cells[0]?.Value ?? "").toString();
      if (match(label)) {
        // Use last cell as the value column for a single-period report.
        const raw = cells[cells.length - 1]?.Value ?? "";
        const n = parseFloat(raw.toString().replace(/,/g, ""));
        if (!isNaN(n)) return n;
      }
    }
    if (r.Rows && Array.isArray(r.Rows)) {
      const nested = findRowValue(r.Rows as unknown[], match);
      if (nested != null) return nested;
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
  const reports = (report as { Reports?: Array<{ Rows?: unknown[] }> }).Reports;
  const rows = reports?.[0]?.Rows ?? [];
  const revenue =
    findRowValue(rows, (l) => /^total\s+(income|revenue|trading income|operating revenue)/i.test(l)) ??
    findRowValue(rows, (l) => /total\s+(income|revenue)/i.test(l)) ??
    0;
  const cogs =
    findRowValue(rows, (l) => /^total\s+cost of (goods sold|sales)/i.test(l)) ??
    findRowValue(rows, (l) => /cost of (goods sold|sales)/i.test(l)) ??
    0;
  const gross_profit =
    findRowValue(rows, (l) => /^gross\s+profit/i.test(l)) ?? Math.max(0, revenue - cogs);
  const operating_expenses =
    findRowValue(rows, (l) => /^total\s+(operating\s+)?expenses/i.test(l)) ??
    findRowValue(rows, (l) => /total\s+expenses/i.test(l)) ??
    0;
  const net_income =
    findRowValue(rows, (l) => /^(net\s+(profit|income|earnings)|profit\s+for the (year|period))/i.test(l)) ??
    findRowValue(rows, (l) => /net\s+(profit|income)/i.test(l)) ??
    0;
  return { revenue, cogs, gross_profit, operating_expenses, net_income };
}

function parseBalanceSheet(report: unknown): {
  assets: number;
  liabilities: number;
  debt: number;
} {
  const reports = (report as { Reports?: Array<{ Rows?: unknown[] }> }).Reports;
  const rows = reports?.[0]?.Rows ?? [];
  const assets =
    findRowValue(rows, (l) => /^total\s+assets/i.test(l)) ?? 0;
  const liabilities =
    findRowValue(rows, (l) => /^total\s+liabilities/i.test(l)) ?? 0;
  // Debt = sum of any rows whose labels look like loans/borrowings; fall back to 0.
  let debt = 0;
  const sumDebt = (rs: unknown[]) => {
    for (const r of rs as Array<Record<string, unknown>>) {
      const cells = r.Cells as Array<{ Value?: string }> | undefined;
      if (cells && cells.length >= 2) {
        const label = (cells[0]?.Value ?? "").toString();
        if (/(loan|borrowing|note payable|long.?term debt|bank debt)/i.test(label)) {
          const raw = cells[cells.length - 1]?.Value ?? "";
          const n = parseFloat(raw.toString().replace(/,/g, ""));
          if (!isNaN(n)) debt += Math.abs(n);
        }
      }
      if (r.Rows && Array.isArray(r.Rows)) sumDebt(r.Rows as unknown[]);
    }
  };
  sumDebt(rows);
  return { assets, liabilities, debt };
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
