/**
 * ValuRight valuation engine.
 * Pure deterministic functions — no side effects, no async.
 * Used by the dashboard, scenario builder, and report generator.
 */

export type FinancialYear = {
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

// Business categorization for method selection
export type BusinessCategory = "real_estate_income" | "standard_operating" | "asset_heavy";

export const BUSINESS_CATEGORY_OPTIONS: { value: BusinessCategory; label: string; description: string; examples: string }[] = [
  {
    value: "real_estate_income",
    label: "Income-producing real estate",
    description: "Property operating businesses where land, location, and occupancy drive value.",
    examples: "RV park, campground, mobile home park, self-storage, hotel/motel, marina, multifamily, commercial rental, senior housing",
  },
  {
    value: "standard_operating",
    label: "Standard operating business",
    description: "Service, product, or knowledge businesses valued primarily on earnings.",
    examples: "Retail, restaurant, service, contractor, agency, medical/dental practice, manufacturing, distribution, e-commerce, SaaS",
  },
  {
    value: "asset_heavy",
    label: "Asset-heavy operating business",
    description: "Earnings matter, but tangible equipment and assets carry meaningful value.",
    examples: "Trucking, equipment rental, construction with owned equipment, heavy manufacturing, auto repair with real estate, laundromat",
  },
];

// Industry → category default (used as a hint, user can override)
const REAL_ESTATE_INDUSTRY_KEYWORDS = ["rv park", "campground", "mobile home", "self-storage", "self storage", "hotel", "motel", "marina", "multifamily", "rental property", "senior housing", "assisted living"];

export function inferCategory(industry?: string | null, subIndustry?: string | null): BusinessCategory {
  const blob = `${industry ?? ""} ${subIndustry ?? ""}`.toLowerCase();
  if (REAL_ESTATE_INDUSTRY_KEYWORDS.some((k) => blob.includes(k))) return "real_estate_income";
  if (/trucking|equipment rental|laundromat|heavy manufactur/.test(blob)) return "asset_heavy";
  return "standard_operating";
}

export function isRvOrCampground(industry?: string | null, subIndustry?: string | null): boolean {
  const blob = `${industry ?? ""} ${subIndustry ?? ""}`.toLowerCase();
  return /rv park|campground/.test(blob);
}

export type BusinessInputs = {
  industry?: string | null;
  sub_industry?: string | null;
  business_category?: BusinessCategory | null;
  cap_rate_low?: number | null;       // e.g., 8 means 8%
  cap_rate_selected?: number | null;  // e.g., 10
  cap_rate_high?: number | null;      // e.g., 12
  management_fee_pct?: number | null; // e.g., 5 means 5% of revenue
  replacement_reserve_pct?: number | null; // e.g., 3 means 3% of revenue
  years_in_business?: number | null;
  employees?: number | null;
  owner_hours_per_week?: number | null;
  owner_in_sales?: boolean | null;
  owner_in_operations?: boolean | null;
  owner_in_customer_relationships?: boolean | null;
  recurring_revenue_pct?: number | null; // 0-100
  top_customer_concentration_pct?: number | null; // 0-100
  sop_status?: string | null; // 'none' | 'partial' | 'complete'
  manager_team_depth?: string | null; // 'none' | 'partial' | 'strong'
  financials: FinancialYear[]; // 1-3 years, latest first preferred
};

// ---------------------------------------------------------------------------
// INDUSTRY MULTIPLES (median, low, high)
// Calibrated from public small-business comp data (BizBuySell/IBBA-style ranges).
// These are intentionally conservative for an estimate, not appraisal.
// ---------------------------------------------------------------------------
type Multiples = { sde: [number, number, number]; ebitda: [number, number, number]; revenue: [number, number, number] };

const INDUSTRY_MULTIPLES: Record<string, Multiples> = {
  "HVAC / Trades":              { sde: [2.4, 3.0, 3.8], ebitda: [3.5, 4.5, 5.5], revenue: [0.45, 0.65, 0.95] },
  "Professional Services":      { sde: [2.0, 2.6, 3.2], ebitda: [3.0, 4.0, 5.0], revenue: [0.6, 0.9, 1.4] },
  "Healthcare Practice":        { sde: [2.5, 3.2, 4.0], ebitda: [3.5, 4.8, 6.0], revenue: [0.7, 1.0, 1.5] },
  "Construction":               { sde: [2.0, 2.5, 3.0], ebitda: [3.0, 3.8, 4.5], revenue: [0.3, 0.5, 0.7] },
  "Restaurant / Hospitality":   { sde: [1.6, 2.0, 2.5], ebitda: [2.5, 3.2, 4.0], revenue: [0.25, 0.4, 0.6] },
  "Retail":                     { sde: [1.8, 2.3, 2.8], ebitda: [2.8, 3.5, 4.2], revenue: [0.3, 0.45, 0.6] },
  "Manufacturing":              { sde: [2.5, 3.2, 4.0], ebitda: [3.5, 4.5, 5.5], revenue: [0.5, 0.8, 1.2] },
  "E-commerce / Online":        { sde: [2.5, 3.5, 4.5], ebitda: [3.5, 5.0, 6.5], revenue: [0.6, 1.0, 1.6] },
  "Software / SaaS":            { sde: [3.0, 4.5, 6.0], ebitda: [5.0, 7.0, 10.0], revenue: [1.5, 2.5, 4.0] },
  "Auto Repair / Service":      { sde: [2.2, 2.8, 3.5], ebitda: [3.0, 4.0, 5.0], revenue: [0.35, 0.55, 0.8] },
  "Logistics / Transport":      { sde: [2.0, 2.6, 3.2], ebitda: [3.0, 4.0, 5.0], revenue: [0.4, 0.6, 0.9] },
  "Other":                      { sde: [2.0, 2.7, 3.4], ebitda: [3.0, 4.0, 5.0], revenue: [0.4, 0.6, 0.9] },
};

export function getIndustryMultiples(industry?: string | null): Multiples {
  if (!industry) return INDUSTRY_MULTIPLES["Other"];
  return INDUSTRY_MULTIPLES[industry] ?? INDUSTRY_MULTIPLES["Other"];
}

export const INDUSTRY_OPTIONS = Object.keys(INDUSTRY_MULTIPLES);

// ---------------------------------------------------------------------------
// RISK ADJUSTMENTS — shift the multiple within the band (-1 to +1)
// ---------------------------------------------------------------------------
function riskAdjustment(b: BusinessInputs): number {
  let adj = 0;

  // Owner dependence
  const ownerHrs = b.owner_hours_per_week ?? 50;
  if (ownerHrs >= 60) adj -= 0.4;
  else if (ownerHrs >= 45) adj -= 0.2;
  else if (ownerHrs <= 25) adj += 0.3;

  const ownerRoles = [b.owner_in_sales, b.owner_in_operations, b.owner_in_customer_relationships].filter(Boolean).length;
  if (ownerRoles >= 3) adj -= 0.3;
  else if (ownerRoles === 2) adj -= 0.15;
  else if (ownerRoles === 0) adj += 0.2;

  // Recurring revenue
  const rec = b.recurring_revenue_pct ?? 0;
  if (rec >= 60) adj += 0.4;
  else if (rec >= 30) adj += 0.2;
  else if (rec >= 15) adj += 0.05;
  else adj -= 0.1;

  // Customer concentration
  const conc = b.top_customer_concentration_pct ?? 0;
  if (conc >= 40) adj -= 0.4;
  else if (conc >= 25) adj -= 0.25;
  else if (conc >= 15) adj -= 0.1;
  else adj += 0.1;

  // Documentation
  if (b.sop_status === "complete") adj += 0.15;
  else if (b.sop_status === "partial") adj += 0.05;
  else adj -= 0.15;

  // Management depth
  if (b.manager_team_depth === "strong") adj += 0.2;
  else if (b.manager_team_depth === "partial") adj += 0.05;
  else adj -= 0.15;

  // Cap to [-1, +1]
  return Math.max(-1, Math.min(1, adj));
}

function shiftMultiple(range: [number, number, number], adj: number): [number, number, number] {
  // Shift median toward low or high band based on adj
  const [lo, mid, hi] = range;
  const half = adj >= 0 ? hi - mid : mid - lo;
  const newMid = mid + adj * half;
  // Spread shrinks slightly with positive adjustment (more confidence)
  const spreadFactor = 1 - 0.2 * Math.abs(adj);
  const newLo = newMid - (mid - lo) * spreadFactor;
  const newHi = newMid + (hi - mid) * spreadFactor;
  return [Math.max(0, newLo), Math.max(0, newMid), Math.max(0, newHi)];
}

// ---------------------------------------------------------------------------
// METHODS
// ---------------------------------------------------------------------------
export type MethodRole = "primary" | "recommended" | "supporting" | "sanity_check" | "floor";

export type MethodResult = {
  method: "sde" | "ebitda" | "revenue" | "dcf" | "asset" | "comparable" | "cap_rate";
  label: string;
  value: number;
  low: number;
  high: number;
  multipleUsed?: number;
  inputUsed?: number;
  inputLabel?: string;
  confidence: "low" | "medium" | "high";
  notes: string;
  formula?: string;
  reasoning?: string;
  available: boolean;
  role?: MethodRole;
  warning?: string;
  // Cap rate specific
  noi?: number;
  capRateUsed?: number;
  capRateLow?: number;
  capRateHigh?: number;
  enterpriseValue?: number;
  debt?: number;
  equityValue?: number;
};

function latestFinancials(b: BusinessInputs): FinancialYear | null {
  if (!b.financials.length) return null;
  return [...b.financials].sort((a, c) => c.year - a.year)[0];
}

function computeSDE(latest: FinancialYear): number {
  // SDE ≈ Net income + owner salary + interest + taxes + depreciation + addbacks
  // We approximate using owner_salary + addbacks + ebitda when available, else net_income + owner_salary + addbacks
  const base = latest.ebitda || latest.net_income;
  return Math.max(0, base + (latest.owner_salary || 0) + (latest.addbacks || 0));
}

export function methodSDE(b: BusinessInputs): MethodResult {
  const latest = latestFinancials(b);
  const m = getIndustryMultiples(b.industry);
  if (!latest) {
    return blankMethod("sde", "SDE Multiple", "Add a year of financials to compute.");
  }
  const sde = computeSDE(latest);
  const adj = riskAdjustment(b);
  const [lo, mid, hi] = shiftMultiple(m.sde, adj);
  return {
    method: "sde",
    label: "SDE Multiple",
    value: sde * mid,
    low: sde * lo,
    high: sde * hi,
    multipleUsed: mid,
    inputUsed: sde,
    inputLabel: "Seller's Discretionary Earnings",
    confidence: confidenceFromAdj(adj, sde > 0),
    notes: "Most common method for owner-operated SMBs. Earnings reflect total benefit to a working owner.",
    formula: `SDE × Industry Multiple\nSDE = EBITDA + Owner Salary + Add-backs = ${fmtMoney(sde)}\nMultiple range: ${lo.toFixed(2)}× – ${hi.toFixed(2)}× (median ${mid.toFixed(2)}×)`,
    reasoning: `Industry baseline for ${b.industry ?? "Other"} is ${m.sde[0].toFixed(2)}–${m.sde[2].toFixed(2)}×. Risk adjustment ${adj >= 0 ? "+" : ""}${adj.toFixed(2)} applied based on owner dependence, recurring revenue, customer concentration, documentation, and management depth.`,
    available: sde > 0,
  };
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function methodEBITDA(b: BusinessInputs): MethodResult {
  const latest = latestFinancials(b);
  const m = getIndustryMultiples(b.industry);
  if (!latest) return blankMethod("ebitda", "EBITDA Multiple", "Add financials to compute.");
  const ebitda = latest.ebitda;
  const adj = riskAdjustment(b);
  const [lo, mid, hi] = shiftMultiple(m.ebitda, adj);
  return {
    method: "ebitda",
    label: "EBITDA Multiple",
    value: ebitda * mid,
    low: ebitda * lo,
    high: ebitda * hi,
    multipleUsed: mid,
    inputUsed: ebitda,
    inputLabel: "EBITDA",
    confidence: confidenceFromAdj(adj, ebitda > 0),
    notes: "Standard for businesses with a hired-out owner. Used by most strategic and PE buyers.",
    formula: `EBITDA × Industry Multiple\nEBITDA = ${fmtMoney(ebitda)}\nMultiple range: ${lo.toFixed(2)}× – ${hi.toFixed(2)}× (median ${mid.toFixed(2)}×)`,
    reasoning: `Industry baseline for ${b.industry ?? "Other"} is ${m.ebitda[0].toFixed(2)}–${m.ebitda[2].toFixed(2)}×. Risk adjustment ${adj >= 0 ? "+" : ""}${adj.toFixed(2)} reflects operating risk and quality of earnings.`,
    available: ebitda > 0,
  };
}

export function methodRevenue(b: BusinessInputs): MethodResult {
  const latest = latestFinancials(b);
  const m = getIndustryMultiples(b.industry);
  if (!latest) return blankMethod("revenue", "Revenue Multiple", "Add financials to compute.");
  const revenue = latest.revenue;
  const adj = riskAdjustment(b);
  const [lo, mid, hi] = shiftMultiple(m.revenue, adj);
  return {
    method: "revenue",
    label: "Revenue Multiple",
    value: revenue * mid,
    low: revenue * lo,
    high: revenue * hi,
    multipleUsed: mid,
    inputUsed: revenue,
    inputLabel: "Annual Revenue",
    confidence: "low",
    notes: "Useful sanity check, especially for high-growth or low-margin businesses.",
    formula: `Revenue × Industry Multiple\nRevenue = ${fmtMoney(revenue)}\nMultiple range: ${lo.toFixed(2)}× – ${hi.toFixed(2)}× (median ${mid.toFixed(2)}×)`,
    reasoning: `Revenue multiples ignore profitability and are a directional check only. Industry baseline ${m.revenue[0].toFixed(2)}–${m.revenue[2].toFixed(2)}× for ${b.industry ?? "Other"}.`,
    available: revenue > 0,
  };
}

export function methodDCF(b: BusinessInputs): MethodResult {
  // 5-year FCF projection, 20% discount, 2.5% terminal Gordon growth.
  const sorted = [...b.financials].sort((a, c) => a.year - c.year);
  if (!sorted.length) return blankMethod("dcf", "Discounted Cash Flow", "Add financials to compute.");
  const latest = sorted[sorted.length - 1];
  const baseFCF = Math.max(0, latest.ebitda - latest.debt * 0.05); // rough debt service haircut

  // Growth: trailing CAGR if we have 2+ years, else 5%
  let growth = 0.05;
  if (sorted.length >= 2) {
    const first = sorted[0].revenue;
    const last = latest.revenue;
    const years = sorted.length - 1;
    if (first > 0 && years > 0) {
      growth = Math.pow(last / first, 1 / years) - 1;
    }
  }
  growth = Math.max(-0.05, Math.min(0.25, growth));

  const discount = 0.20;
  const terminal = 0.025;

  let pv = 0;
  let fcf = baseFCF;
  for (let t = 1; t <= 5; t++) {
    fcf = fcf * (1 + growth);
    pv += fcf / Math.pow(1 + discount, t);
  }
  const terminalValue = (fcf * (1 + terminal)) / (discount - terminal);
  pv += terminalValue / Math.pow(1 + discount, 5);

  const adj = riskAdjustment(b);
  const mid = pv;
  const lo = pv * (0.75 + adj * 0.05);
  const hi = pv * (1.25 + adj * 0.05);

  return {
    method: "dcf",
    label: "Discounted Cash Flow",
    value: mid,
    low: Math.max(0, lo),
    high: Math.max(0, hi),
    inputUsed: baseFCF,
    inputLabel: "Year-1 Free Cash Flow",
    confidence: sorted.length >= 2 ? "medium" : "low",
    notes: `5-year projection at ${(growth * 100).toFixed(1)}% growth, 20% discount rate, 2.5% terminal growth.`,
    formula: `PV = Σ FCFₜ / (1+r)ᵗ + Terminal / (1+r)⁵\nFCF₀ = ${fmtMoney(baseFCF)}, growth = ${(growth * 100).toFixed(1)}%\nDiscount r = 20%, terminal g = 2.5%`,
    reasoning: sorted.length >= 2 ? `Growth derived from trailing revenue CAGR across ${sorted.length} years of financials. Discount rate reflects SMB risk premium.` : "Limited history — assumed default growth rate. Add more years for higher confidence.",
    available: baseFCF > 0,
  };
}

export function methodAsset(b: BusinessInputs): MethodResult {
  const latest = latestFinancials(b);
  if (!latest) return blankMethod("asset", "Asset-Based Floor", "Add financials to compute.");
  const netAssets = (latest.assets || 0) - (latest.liabilities || 0);
  const value = Math.max(0, netAssets);
  return {
    method: "asset",
    label: "Asset-Based Floor",
    value,
    low: value * 0.85,
    high: value * 1.15,
    inputUsed: netAssets,
    inputLabel: "Net Assets (Assets − Liabilities)",
    confidence: "medium",
    notes: "A floor for asset-heavy businesses. Most going concerns sell well above this.",
    formula: `Net Assets = Total Assets − Total Liabilities\n= ${fmtMoney(latest.assets || 0)} − ${fmtMoney(latest.liabilities || 0)} = ${fmtMoney(netAssets)}\nRange: ±15% for liquidation vs. orderly sale`,
    reasoning: "Asset-based valuation reflects break-up or liquidation value. Goodwill and earnings power are excluded.",
    available: value > 0,
  };
}

export function methodComparable(b: BusinessInputs): MethodResult {
  // Placeholder until we wire a real comp database.
  // Average of SDE & EBITDA mids, slightly discounted.
  const sde = methodSDE(b);
  const ebitda = methodEBITDA(b);
  if (!sde.available && !ebitda.available) {
    return blankMethod("comparable", "Comparable Sales", "Coming soon — comp database in development.");
  }
  const avg = (sde.value + ebitda.value) / 2;
  return {
    method: "comparable",
    label: "Comparable Sales",
    value: avg * 0.95,
    low: Math.min(sde.low, ebitda.low) * 0.95,
    high: Math.max(sde.high, ebitda.high) * 0.95,
    confidence: "low",
    notes: "Placeholder estimate. Live comp matching from BizBuySell / IBBA data is in development.",
    formula: "Avg(SDE value, EBITDA value) × 0.95\n(placeholder until live comp database is wired in)",
    reasoning: "Comparable sales typically anchor real-world buyer behavior. This blend approximates a comp-implied range until live BizBuySell / IBBA matching is enabled.",
    available: true,
  };
}

function blankMethod(method: MethodResult["method"], label: string, notes: string): MethodResult {
  return { method, label, value: 0, low: 0, high: 0, confidence: "low", notes, available: false };
}

function confidenceFromAdj(adj: number, hasInput: boolean): "low" | "medium" | "high" {
  if (!hasInput) return "low";
  if (adj >= 0.3) return "high";
  if (adj >= -0.2) return "medium";
  return "low";
}

// ---------------------------------------------------------------------------
// COMBINED VALUATION
// ---------------------------------------------------------------------------
export type Valuation = {
  methods: MethodResult[];
  rangeLow: number;
  rangeMid: number;
  rangeHigh: number;
  weights: Record<string, number>;
};

export function valueBusiness(b: BusinessInputs): Valuation {
  const methods = [
    methodSDE(b),
    methodEBITDA(b),
    methodRevenue(b),
    methodDCF(b),
    methodAsset(b),
    methodComparable(b),
  ];

  const weights: Record<string, number> = {
    sde: 0.30,
    ebitda: 0.25,
    revenue: 0.10,
    dcf: 0.15,
    asset: 0.05,
    comparable: 0.15,
  };

  let totalWeight = 0;
  let mid = 0;
  let lo = 0;
  let hi = 0;
  for (const m of methods) {
    if (!m.available) continue;
    const w = weights[m.method] ?? 0;
    mid += m.value * w;
    lo += m.low * w;
    hi += m.high * w;
    totalWeight += w;
  }
  if (totalWeight > 0) {
    mid /= totalWeight;
    lo /= totalWeight;
    hi /= totalWeight;
  }

  return { methods, rangeLow: lo, rangeMid: mid, rangeHigh: hi, weights };
}

// ---------------------------------------------------------------------------
// HEALTH SCORE — out of 100
// ---------------------------------------------------------------------------
export type HealthBreakdown = {
  financial_performance: { score: number; max: number };
  revenue_quality: { score: number; max: number };
  owner_independence: { score: number; max: number };
  customer_concentration: { score: number; max: number };
  growth_trend: { score: number; max: number };
  documentation: { score: number; max: number };
  management_team: { score: number; max: number };
  data_quality: { score: number; max: number };
};

export function computeHealthScore(b: BusinessInputs): { total: number; breakdown: HealthBreakdown } {
  const sorted = [...b.financials].sort((a, c) => a.year - c.year);
  const latest = sorted[sorted.length - 1];

  // Financial performance (20)
  let fin = 0;
  if (latest) {
    const margin = latest.revenue > 0 ? latest.ebitda / latest.revenue : 0;
    if (margin >= 0.20) fin = 20;
    else if (margin >= 0.15) fin = 16;
    else if (margin >= 0.10) fin = 12;
    else if (margin >= 0.05) fin = 8;
    else if (margin > 0) fin = 4;
  }

  // Revenue quality (15)
  const rec = b.recurring_revenue_pct ?? 0;
  let revq = 0;
  if (rec >= 60) revq = 15;
  else if (rec >= 40) revq = 12;
  else if (rec >= 20) revq = 8;
  else if (rec >= 10) revq = 5;
  else revq = 2;

  // Owner independence (20)
  const hrs = b.owner_hours_per_week ?? 50;
  const roles = [b.owner_in_sales, b.owner_in_operations, b.owner_in_customer_relationships].filter(Boolean).length;
  let oi = 20;
  if (hrs >= 60) oi -= 8;
  else if (hrs >= 45) oi -= 4;
  oi -= roles * 3;
  oi = Math.max(0, oi);

  // Customer concentration (10)
  const conc = b.top_customer_concentration_pct ?? 0;
  let cc = 10;
  if (conc >= 40) cc = 1;
  else if (conc >= 25) cc = 4;
  else if (conc >= 15) cc = 7;

  // Growth trend (10)
  let gt = 5;
  if (sorted.length >= 2) {
    const first = sorted[0].revenue;
    const last = latest.revenue;
    if (first > 0) {
      const g = (last / first) - 1;
      if (g >= 0.30) gt = 10;
      else if (g >= 0.15) gt = 8;
      else if (g >= 0.05) gt = 6;
      else if (g >= 0) gt = 4;
      else gt = 2;
    }
  }

  // Documentation (10)
  let doc = 0;
  if (b.sop_status === "complete") doc = 10;
  else if (b.sop_status === "partial") doc = 5;

  // Management team (10)
  let mgmt = 0;
  if (b.manager_team_depth === "strong") mgmt = 10;
  else if (b.manager_team_depth === "partial") mgmt = 5;

  // Data quality (5) — based on how many fields are populated
  let dq = 0;
  if (latest && latest.revenue > 0 && latest.ebitda !== 0) dq += 2;
  if (sorted.length >= 2) dq += 1;
  if (sorted.length >= 3) dq += 1;
  if (latest && latest.assets > 0 && latest.liabilities >= 0) dq += 1;

  const breakdown: HealthBreakdown = {
    financial_performance: { score: fin, max: 20 },
    revenue_quality: { score: revq, max: 15 },
    owner_independence: { score: oi, max: 20 },
    customer_concentration: { score: cc, max: 10 },
    growth_trend: { score: gt, max: 10 },
    documentation: { score: doc, max: 10 },
    management_team: { score: mgmt, max: 10 },
    data_quality: { score: dq, max: 5 },
  };

  const total = Object.values(breakdown).reduce((s, v) => s + v.score, 0);
  return { total, breakdown };
}

// ---------------------------------------------------------------------------
// SAMPLE DATA — fictional HVAC company (per spec)
// ---------------------------------------------------------------------------
export const SAMPLE_HVAC_BUSINESS = {
  name: "Cascade Mechanical HVAC",
  industry: "HVAC / Trades",
  sub_industry: "Residential & Light Commercial",
  region: "Pacific Northwest",
  years_in_business: 12,
  employees: 18,
  owner_hours_per_week: 55,
  owner_in_sales: true,
  owner_in_operations: true,
  owner_in_customer_relationships: true,
  recurring_revenue_pct: 12,
  top_customer_concentration_pct: 8,
  sop_status: "partial",
  manager_team_depth: "partial",
  exit_timeline: "2_5y" as const,
  asking_price_low: 800_000,
  asking_price_high: 1_100_000,
  reason_for_sale: "Owner planning retirement after 12 years building the business.",
  anonymous_description:
    "Established HVAC service business in the Pacific Northwest serving residential and light commercial customers. Strong reputation, steady recurring service contracts, and an experienced field team.",
};

export const SAMPLE_HVAC_FINANCIALS: FinancialYear[] = [
  {
    year: new Date().getFullYear() - 2,
    revenue: 920_000, cogs: 415_000, gross_profit: 505_000,
    operating_expenses: 290_000, owner_salary: 110_000, addbacks: 18_000,
    ebitda: 215_000, net_income: 95_000,
    assets: 380_000, liabilities: 145_000, debt: 95_000,
  },
  {
    year: new Date().getFullYear() - 1,
    revenue: 1_005_000, cogs: 442_000, gross_profit: 563_000,
    operating_expenses: 305_000, owner_salary: 115_000, addbacks: 20_000,
    ebitda: 240_000, net_income: 110_000,
    assets: 410_000, liabilities: 138_000, debt: 88_000,
  },
  {
    year: new Date().getFullYear(),
    revenue: 1_100_000, cogs: 462_000, gross_profit: 638_000,
    operating_expenses: 320_000, owner_salary: 120_000, addbacks: 26_000,
    ebitda: 264_000, net_income: 124_000,
    assets: 445_000, liabilities: 132_000, debt: 80_000,
  },
];
