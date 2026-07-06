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
  depreciation?: number;
  amortization?: number;
  interest?: number;
  income_taxes?: number;
};

// Business categorization for method selection
export type BusinessCategory = "real_estate_income" | "standard_operating" | "asset_heavy";

export const BUSINESS_CATEGORY_OPTIONS: {
  value: BusinessCategory;
  label: string;
  description: string;
  examples: string;
}[] = [
  {
    value: "real_estate_income",
    label: "Income-producing real estate / property operating business",
    description: "Property operating businesses where land, location, and occupancy drive value.",
    examples:
      "RV park, campground, mobile home park, self-storage, hotel/motel, marina, multifamily, commercial rental, senior housing",
  },
  {
    value: "standard_operating",
    label: "Standard operating business",
    description: "Service, product, or knowledge businesses valued primarily on earnings.",
    examples:
      "Retail, restaurant, service, contractor, agency, medical/dental practice, manufacturing, distribution, e-commerce, SaaS",
  },
  {
    value: "asset_heavy",
    label: "Asset-heavy operating business",
    description: "Earnings matter, but tangible equipment and assets carry meaningful value.",
    examples:
      "Trucking, equipment rental, construction with owned equipment, heavy manufacturing, auto repair with real estate, laundromat",
  },
];

// Detailed subtypes that live under each business category. Used by Settings to
// let owners pick exactly what kind of business they run (e.g. RV park, restaurant).
export const BUSINESS_SUBTYPES: Record<BusinessCategory, string[]> = {
  real_estate_income: [
    "RV park",
    "Campground",
    "Mobile home park",
    "Self-storage",
    "Hotel / motel",
    "Marina",
    "Multifamily rental property",
    "Commercial rental property",
    "Senior housing / assisted living (real estate included)",
  ],
  standard_operating: [
    "Retail store",
    "Restaurant",
    "Service business",
    "Contractor",
    "Agency",
    "Medical / dental practice",
    "Manufacturing",
    "Distribution",
    "E-commerce",
    "SaaS",
  ],
  asset_heavy: [
    "Trucking / freight",
    "Equipment rental",
    "Construction with owned equipment",
    "Heavy manufacturing",
    "Auto repair with real estate",
    "Laundromat",
  ],
};

// Industry → category default (used as a hint, user can override)
const REAL_ESTATE_INDUSTRY_KEYWORDS = [
  "rv park",
  "campground",
  "mobile home",
  "self-storage",
  "self storage",
  "hotel",
  "motel",
  "marina",
  "multifamily",
  "rental property",
  "senior housing",
  "assisted living",
];

export function inferCategory(
  industry?: string | null,
  subIndustry?: string | null,
): BusinessCategory {
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
  cap_rate_low?: number | null; // e.g., 8 means 8%
  cap_rate_selected?: number | null; // e.g., 10
  cap_rate_high?: number | null; // e.g., 12
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
  multiple_assumptions?: MultipleAssumption[] | null;
  financials: FinancialYear[]; // 1-3 years, latest first preferred
};

// ---------------------------------------------------------------------------
// INDUSTRY MULTIPLES (median, low, high)
// Calibrated from public small-business comp data (BizBuySell/IBBA-style ranges).
// These are intentionally conservative for an estimate, not appraisal.
// ---------------------------------------------------------------------------
export type Multiples = {
  sde: [number, number, number];
  ebitda: [number, number, number];
  revenue: [number, number, number];
};

export type OwnerDependenceBand = "any" | "low" | "medium" | "high";
export type MultipleConfidenceLevel = "low" | "medium" | "high";

export type MultipleAssumption = {
  slug: string;
  industry: string;
  business_category?: BusinessCategory | "any" | null;
  revenue_min?: number | null;
  revenue_max?: number | null;
  owner_dependence?: OwnerDependenceBand | null;
  confidence_level: MultipleConfidenceLevel;
  sde_low: number;
  sde_mid: number;
  sde_high: number;
  ebitda_low: number;
  ebitda_mid: number;
  ebitda_high: number;
  revenue_low: number;
  revenue_mid: number;
  revenue_high: number;
  source_label: string;
  source_notes: string;
  active?: boolean | null;
};

function assumption(
  slug: string,
  industry: string,
  multiples: Multiples,
  sourceNotes: string,
): MultipleAssumption {
  return {
    slug,
    industry,
    business_category: "any",
    revenue_min: null,
    revenue_max: null,
    owner_dependence: "any",
    confidence_level: "medium",
    sde_low: multiples.sde[0],
    sde_mid: multiples.sde[1],
    sde_high: multiples.sde[2],
    ebitda_low: multiples.ebitda[0],
    ebitda_mid: multiples.ebitda[1],
    ebitda_high: multiples.ebitda[2],
    revenue_low: multiples.revenue[0],
    revenue_mid: multiples.revenue[1],
    revenue_high: multiples.revenue[2],
    source_label: "ValuRight planning baseline",
    source_notes: sourceNotes,
    active: true,
  };
}

export const DEFAULT_MULTIPLE_ASSUMPTIONS: MultipleAssumption[] = [
  assumption(
    "hvac-trades-default",
    "HVAC / Trades",
    { sde: [2.4, 3.0, 3.8], ebitda: [3.5, 4.5, 5.5], revenue: [0.45, 0.65, 0.95] },
    "Directional SMB planning range for service-trade businesses. Review against current local comps before relying on an asking price.",
  ),
  assumption(
    "professional-services-default",
    "Professional Services",
    { sde: [2.0, 2.6, 3.2], ebitda: [3.0, 4.0, 5.0], revenue: [0.6, 0.9, 1.4] },
    "Directional professional-services planning range; owner dependence and client concentration can materially lower realized multiples.",
  ),
  assumption(
    "healthcare-practice-default",
    "Healthcare Practice",
    { sde: [2.5, 3.2, 4.0], ebitda: [3.5, 4.8, 6.0], revenue: [0.7, 1.0, 1.5] },
    "Directional healthcare-practice planning range; payer mix, provider retention, and compliance diligence should be reviewed separately.",
  ),
  assumption(
    "construction-default",
    "Construction",
    { sde: [2.0, 2.5, 3.0], ebitda: [3.0, 3.8, 4.5], revenue: [0.3, 0.5, 0.7] },
    "Directional contractor planning range; backlog quality, bonding capacity, and cyclicality can shift market outcomes.",
  ),
  assumption(
    "restaurant-hospitality-default",
    "Restaurant / Hospitality",
    { sde: [1.6, 2.0, 2.5], ebitda: [2.5, 3.2, 4.0], revenue: [0.25, 0.4, 0.6] },
    "Directional restaurant and hospitality planning range; location, lease terms, owner replacement needs, and concept durability are key diligence items.",
  ),
  assumption(
    "retail-default",
    "Retail",
    { sde: [1.8, 2.3, 2.8], ebitda: [2.8, 3.5, 4.2], revenue: [0.3, 0.45, 0.6] },
    "Directional retail planning range; inventory quality, foot traffic, lease terms, and online competition should be reviewed.",
  ),
  assumption(
    "manufacturing-default",
    "Manufacturing",
    { sde: [2.5, 3.2, 4.0], ebitda: [3.5, 4.5, 5.5], revenue: [0.5, 0.8, 1.2] },
    "Directional manufacturing planning range; equipment condition, customer concentration, and working-capital needs can shift realized multiples.",
  ),
  assumption(
    "ecommerce-online-default",
    "E-commerce / Online",
    { sde: [2.5, 3.5, 4.5], ebitda: [3.5, 5.0, 6.5], revenue: [0.6, 1.0, 1.6] },
    "Directional online-business planning range; channel concentration, CAC durability, and owner-operated marketing risk need separate review.",
  ),
  assumption(
    "software-saas-default",
    "Software / SaaS",
    { sde: [3.0, 4.5, 6.0], ebitda: [5.0, 7.0, 10.0], revenue: [1.5, 2.5, 4.0] },
    "Directional SaaS planning range; retention, growth, gross margin, and customer concentration are usually more important than industry label alone.",
  ),
  assumption(
    "auto-repair-service-default",
    "Auto Repair / Service",
    { sde: [2.2, 2.8, 3.5], ebitda: [3.0, 4.0, 5.0], revenue: [0.35, 0.55, 0.8] },
    "Directional auto-service planning range; technician retention, facility control, and equipment condition are key buyer diligence items.",
  ),
  assumption(
    "logistics-transport-default",
    "Logistics / Transport",
    { sde: [2.0, 2.6, 3.2], ebitda: [3.0, 4.0, 5.0], revenue: [0.4, 0.6, 0.9] },
    "Directional logistics planning range; fleet age, contract durability, and fuel/labor exposure can materially change outcomes.",
  ),
  assumption(
    "other-default",
    "Other",
    { sde: [2.0, 2.7, 3.4], ebitda: [3.0, 4.0, 5.0], revenue: [0.4, 0.6, 0.9] },
    "Fallback planning range for industries without a more specific assumption. Replace with a reviewed comp set when available.",
  ),
];

const INDUSTRY_MULTIPLES: Record<string, Multiples> = Object.fromEntries(
  DEFAULT_MULTIPLE_ASSUMPTIONS.map((row) => [
    row.industry,
    {
      sde: [row.sde_low, row.sde_mid, row.sde_high],
      ebitda: [row.ebitda_low, row.ebitda_mid, row.ebitda_high],
      revenue: [row.revenue_low, row.revenue_mid, row.revenue_high],
    } satisfies Multiples,
  ]),
);

export type SelectedMultipleAssumption = {
  assumption: MultipleAssumption;
  multiples: Multiples;
};

export function ownerDependenceBand(b: BusinessInputs): OwnerDependenceBand {
  const ownerHours = b.owner_hours_per_week ?? 50;
  const ownerRoles = [
    b.owner_in_sales,
    b.owner_in_operations,
    b.owner_in_customer_relationships,
  ].filter(Boolean).length;
  if (ownerHours >= 55 || ownerRoles >= 3) return "high";
  if (ownerHours >= 35 || ownerRoles >= 1) return "medium";
  return "low";
}

function assumptionMatches(
  assumption: MultipleAssumption,
  b: BusinessInputs,
  category: BusinessCategory,
  latestRevenue: number,
  ownerBand: OwnerDependenceBand,
): boolean {
  if (assumption.active === false) return false;
  if (assumption.industry !== (b.industry ?? "Other") && assumption.industry !== "Other")
    return false;
  if (
    assumption.business_category &&
    assumption.business_category !== "any" &&
    assumption.business_category !== category
  ) {
    return false;
  }
  if (assumption.revenue_min != null && latestRevenue < assumption.revenue_min) return false;
  if (assumption.revenue_max != null && latestRevenue > assumption.revenue_max) return false;
  if (
    assumption.owner_dependence &&
    assumption.owner_dependence !== "any" &&
    assumption.owner_dependence !== ownerBand
  ) {
    return false;
  }
  return true;
}

function assumptionSpecificity(assumption: MultipleAssumption, b: BusinessInputs): number {
  let score = 0;
  if (assumption.industry === b.industry) score += 8;
  if (assumption.business_category && assumption.business_category !== "any") score += 4;
  if (assumption.revenue_min != null || assumption.revenue_max != null) score += 2;
  if (assumption.owner_dependence && assumption.owner_dependence !== "any") score += 2;
  if (assumption.confidence_level === "high") score += 1;
  if (assumption.confidence_level === "low") score -= 1;
  return score;
}

export function selectMultipleAssumption(b: BusinessInputs): SelectedMultipleAssumption {
  const category =
    (b.business_category as BusinessCategory) || inferCategory(b.industry, b.sub_industry);
  const latest = latestFinancials(b);
  const latestRevenue = latest?.revenue ?? 0;
  const ownerBand = ownerDependenceBand(b);
  const candidates = [...(b.multiple_assumptions ?? []), ...DEFAULT_MULTIPLE_ASSUMPTIONS].filter(
    (row) => assumptionMatches(row, b, category, latestRevenue, ownerBand),
  );
  const selected =
    candidates.sort((a, c) => assumptionSpecificity(c, b) - assumptionSpecificity(a, b))[0] ??
    DEFAULT_MULTIPLE_ASSUMPTIONS.find((row) => row.industry === "Other")!;

  return {
    assumption: selected,
    multiples: {
      sde: [selected.sde_low, selected.sde_mid, selected.sde_high],
      ebitda: [selected.ebitda_low, selected.ebitda_mid, selected.ebitda_high],
      revenue: [selected.revenue_low, selected.revenue_mid, selected.revenue_high],
    },
  };
}

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

  const ownerRoles = [
    b.owner_in_sales,
    b.owner_in_operations,
    b.owner_in_customer_relationships,
  ].filter(Boolean).length;
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

function floorValuationInput(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function orderedNonNegativeRange(low: number, value: number, high: number) {
  const safeLow = floorValuationInput(low);
  const safeValue = floorValuationInput(value);
  const safeHigh = floorValuationInput(high);
  const rangeLow = Math.min(safeLow, safeHigh);
  const rangeHigh = Math.max(safeLow, safeHigh);
  const rangeValue = Math.min(Math.max(safeValue, rangeLow), rangeHigh);

  return { low: rangeLow, value: rangeValue, high: rangeHigh };
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
  multipleSource?: string;
  multipleNotes?: string;
  multipleConfidence?: MultipleConfidenceLevel;
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

export type NormalizedEarnings = {
  netIncome: number;
  interest: number;
  incomeTaxes: number;
  depreciation: number;
  amortization: number;
  ownerCompensation: number;
  addbacks: number;
  ebitda: number;
  sde: number;
  usedEnteredEbitda: boolean;
  ebitdaFormula: string;
  sdeFormula: string;
  plainEnglish: string;
};

function amount(value: number | null | undefined): number {
  return Number(value ?? 0);
}

export function calculateNormalizedEarnings(latest: FinancialYear): NormalizedEarnings {
  const netIncome = amount(latest.net_income);
  const interest = amount(latest.interest);
  const incomeTaxes = amount(latest.income_taxes);
  const depreciation = amount(latest.depreciation);
  const amortization = amount(latest.amortization);
  const ownerCompensation = amount(latest.owner_salary);
  const addbacks = amount(latest.addbacks);
  const enteredEbitda = amount(latest.ebitda);
  const hasBridgeInputs = [interest, incomeTaxes, depreciation, amortization].some((v) => v !== 0);
  const useBridge = hasBridgeInputs || enteredEbitda === 0;
  const bridgeEbitda = netIncome + interest + incomeTaxes + depreciation + amortization;
  const ebitda = useBridge ? bridgeEbitda : enteredEbitda;
  const sde = ebitda + ownerCompensation + addbacks;

  return {
    netIncome,
    interest,
    incomeTaxes,
    depreciation,
    amortization,
    ownerCompensation,
    addbacks,
    ebitda,
    sde,
    usedEnteredEbitda: !useBridge,
    ebitdaFormula: useBridge
      ? `EBITDA = Net Income + Interest + Income Taxes + Depreciation + Amortization\n= ${fmtMoney(netIncome)} + ${fmtMoney(interest)} + ${fmtMoney(incomeTaxes)} + ${fmtMoney(depreciation)} + ${fmtMoney(amortization)} = ${fmtMoney(ebitda)}`
      : `EBITDA = Entered EBITDA = ${fmtMoney(ebitda)}\nNo interest, tax, depreciation, or amortization bridge was provided for this year.`,
    sdeFormula: `SDE = EBITDA + Owner Compensation + One-time Add-backs\n= ${fmtMoney(ebitda)} + ${fmtMoney(ownerCompensation)} + ${fmtMoney(addbacks)} = ${fmtMoney(sde)}`,
    plainEnglish:
      "EBITDA adds back interest, income taxes, depreciation, and amortization to net income. SDE then adds one working owner's compensation and buyer-acceptable one-time add-backs. Owner compensation is not included in EBITDA, so it is not double-counted.",
  };
}

export function methodSDE(b: BusinessInputs): MethodResult {
  const latest = latestFinancials(b);
  const selected = selectMultipleAssumption(b);
  const m = selected.multiples;
  const assumption = selected.assumption;
  if (!latest) {
    return blankMethod("sde", "SDE Multiple", "Add a year of financials to compute.");
  }
  const normalized = calculateNormalizedEarnings(latest);
  const sde = Math.max(0, normalized.sde);
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
    notes:
      "Most common method for owner-operated SMBs. Earnings reflect total benefit to a working owner. Multiples are planning assumptions, not market guarantees.",
    formula: `${normalized.ebitdaFormula}\n${normalized.sdeFormula}\nSDE × Industry Multiple\nMultiple range: ${lo.toFixed(2)}× – ${hi.toFixed(2)}× (median ${mid.toFixed(2)}×)`,
    reasoning: `${normalized.plainEnglish} Industry baseline for ${b.industry ?? "Other"} is ${m.sde[0].toFixed(2)}–${m.sde[2].toFixed(2)}× from ${assumption.source_label}. Risk adjustment ${adj >= 0 ? "+" : ""}${adj.toFixed(2)} applied based on owner dependence, recurring revenue, customer concentration, documentation, and management depth. These multiples are planning assumptions and should be checked against current buyer activity before setting an asking price.`,
    multipleSource: assumption.source_label,
    multipleNotes: assumption.source_notes,
    multipleConfidence: assumption.confidence_level,
    available: sde > 0,
  };
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function methodEBITDA(b: BusinessInputs): MethodResult {
  const latest = latestFinancials(b);
  const selected = selectMultipleAssumption(b);
  const m = selected.multiples;
  const assumption = selected.assumption;
  if (!latest) return blankMethod("ebitda", "EBITDA Multiple", "Add financials to compute.");
  const normalized = calculateNormalizedEarnings(latest);
  const rawEbitda = normalized.ebitda;
  const ebitda = floorValuationInput(rawEbitda);
  const adj = riskAdjustment(b);
  const [lo, mid, hi] = shiftMultiple(m.ebitda, adj);
  const range = orderedNonNegativeRange(ebitda * lo, ebitda * mid, ebitda * hi);
  return {
    method: "ebitda",
    label: "EBITDA Multiple",
    value: range.value,
    low: range.low,
    high: range.high,
    multipleUsed: mid,
    inputUsed: ebitda,
    inputLabel: "EBITDA",
    confidence: confidenceFromAdj(adj, ebitda > 0),
    notes:
      "Standard for businesses with a hired-out owner. Used by most strategic and PE buyers. Multiples are planning assumptions, not market guarantees.",
    formula: `${normalized.ebitdaFormula}\nEBITDA × Industry Multiple\nMultiple range: ${lo.toFixed(2)}× – ${hi.toFixed(2)}× (median ${mid.toFixed(2)}×)`,
    reasoning: `${normalized.plainEnglish} Industry baseline for ${b.industry ?? "Other"} is ${m.ebitda[0].toFixed(2)}–${m.ebitda[2].toFixed(2)}× from ${assumption.source_label}. Risk adjustment ${adj >= 0 ? "+" : ""}${adj.toFixed(2)} reflects operating risk and quality of earnings. These multiples are planning assumptions and should be checked against current buyer activity before setting an asking price.`,
    multipleSource: assumption.source_label,
    multipleNotes: assumption.source_notes,
    multipleConfidence: assumption.confidence_level,
    available: rawEbitda > 0,
    warning:
      rawEbitda < 0
        ? "EBITDA is negative, so this method is not meaningful as a going-concern valuation. Review the asset-based floor or normalize stabilized earnings."
        : undefined,
  };
}

export function methodRevenue(b: BusinessInputs): MethodResult {
  const latest = latestFinancials(b);
  const selected = selectMultipleAssumption(b);
  const m = selected.multiples;
  const assumption = selected.assumption;
  if (!latest) return blankMethod("revenue", "Revenue Multiple", "Add financials to compute.");
  const rawRevenue = latest.revenue;
  const revenue = floorValuationInput(rawRevenue);
  const adj = riskAdjustment(b);
  const [lo, mid, hi] = shiftMultiple(m.revenue, adj);
  const range = orderedNonNegativeRange(revenue * lo, revenue * mid, revenue * hi);
  return {
    method: "revenue",
    label: "Revenue Multiple",
    value: range.value,
    low: range.low,
    high: range.high,
    multipleUsed: mid,
    inputUsed: revenue,
    inputLabel: "Annual Revenue",
    confidence: "low",
    notes:
      "Useful sanity check, especially for high-growth or low-margin businesses. Revenue multiples are planning assumptions and ignore profitability.",
    formula: `Revenue × Industry Multiple\nRevenue = ${fmtMoney(revenue)}\nMultiple range: ${lo.toFixed(2)}× – ${hi.toFixed(2)}× (median ${mid.toFixed(2)}×)`,
    reasoning: `Revenue multiples ignore profitability and are a directional check only. Industry baseline ${m.revenue[0].toFixed(2)}–${m.revenue[2].toFixed(2)}× for ${b.industry ?? "Other"} from ${assumption.source_label}. These multiples are planning assumptions, not market guarantees.`,
    multipleSource: assumption.source_label,
    multipleNotes: assumption.source_notes,
    multipleConfidence: assumption.confidence_level,
    available: rawRevenue > 0,
    warning:
      rawRevenue < 0
        ? "Revenue is negative, so this method is not meaningful. Review imported financials before relying on revenue multiples."
        : undefined,
  };
}

export function methodDCF(b: BusinessInputs): MethodResult {
  // 5-year FCF projection, 20% discount, 2.5% terminal Gordon growth.
  const sorted = [...b.financials].sort((a, c) => a.year - c.year);
  if (!sorted.length)
    return blankMethod("dcf", "Discounted Cash Flow", "Add financials to compute.");
  const latest = sorted[sorted.length - 1];
  const normalized = calculateNormalizedEarnings(latest);
  const baseFCF = Math.max(0, normalized.ebitda - latest.debt * 0.05); // rough debt service haircut

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

  const discount = 0.2;
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
    reasoning:
      sorted.length >= 2
        ? `Growth derived from trailing revenue CAGR across ${sorted.length} years of financials. Discount rate reflects SMB risk premium.`
        : "Limited history — assumed default growth rate. Add more years for higher confidence.",
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
    reasoning:
      "Asset-based valuation reflects break-up or liquidation value. Goodwill and earnings power are excluded.",
    available: value > 0,
  };
}

export function methodComparable(b: BusinessInputs): MethodResult {
  // Placeholder until we wire a real comp database.
  // Average of SDE & EBITDA mids, slightly discounted.
  const sde = methodSDE(b);
  const ebitda = methodEBITDA(b);
  if (!sde.available && !ebitda.available) {
    return blankMethod(
      "comparable",
      "Comparable Sales",
      "Coming soon — comp database in development.",
    );
  }
  const availableMethods = [sde, ebitda].filter((method) => method.available);
  const avg =
    availableMethods.reduce((sum, method) => sum + floorValuationInput(method.value), 0) /
    availableMethods.length;
  const rangeLow = Math.min(...availableMethods.map((method) => floorValuationInput(method.low)));
  const rangeHigh = Math.max(...availableMethods.map((method) => floorValuationInput(method.high)));
  return {
    method: "comparable",
    label: "Comparable Sales",
    value: avg * 0.95,
    low: rangeLow * 0.95,
    high: rangeHigh * 0.95,
    confidence: "low",
    notes:
      "Placeholder estimate. Live comp matching from BizBuySell / IBBA data is in development.",
    formula:
      "Avg(SDE value, EBITDA value) × 0.95\n(placeholder until live comp database is wired in)",
    reasoning:
      "Comparable sales typically anchor real-world buyer behavior. This blend approximates a comp-implied range until live BizBuySell / IBBA matching is enabled.",
    available: true,
  };
}

// ---------------------------------------------------------------------------
// CAP RATE / INCOME APPROACH
// ---------------------------------------------------------------------------
export function methodCapRate(b: BusinessInputs): MethodResult {
  const latest = latestFinancials(b);
  if (!latest)
    return blankMethod("cap_rate", "Cap Rate / Income Approach", "Add financials to compute.");

  const revenue = latest.revenue || 0;
  const cogs = latest.cogs || 0;
  const grossProfit = latest.gross_profit || revenue - cogs;
  const opex = latest.operating_expenses || 0;
  const normalized = calculateNormalizedEarnings(latest);
  const netIncome = normalized.netIncome;
  const ebitda = normalized.ebitda;
  const depreciation = normalized.depreciation;
  const amortization = normalized.amortization;
  const interest = normalized.interest;
  const taxes = normalized.incomeTaxes;
  const addbacks = normalized.addbacks; // owner personal + one-time/non-recurring
  const mgmtFeePct = b.management_fee_pct ?? 0;
  const reservePct = b.replacement_reserve_pct ?? 0;
  const mgmtFee = revenue * (mgmtFeePct / 100);
  const reserve = revenue * (reservePct / 100);

  // NOI excludes: debt service, interest, depreciation, amortization, income taxes,
  // owner personal expenses, and one-time/non-recurring items.
  // Use the earnings bridge first because it correctly includes COGS and all operating
  // expenses before adding back excluded/non-operating items. Do not calculate NOI as
  // revenue − operating expenses because that can ignore COGS or double-count imports.
  // Select the NOI source explicitly rather than gating on `=== 0`: entered EBITDA
  // must not be discarded just because add-backs make the net-income bridge non-zero.
  let noiBeforeAdjust: number;
  let noiSource: string;
  if (netIncome !== 0) {
    noiBeforeAdjust = netIncome + depreciation + amortization + interest + taxes + addbacks;
    noiSource = "Net income bridge";
  } else if (ebitda !== 0) {
    noiBeforeAdjust = ebitda + addbacks;
    noiSource = normalized.usedEnteredEbitda ? "EBITDA proxy" : "Net income bridge";
  } else if (grossProfit !== 0 || opex !== 0) {
    noiBeforeAdjust =
      grossProfit - opex + depreciation + amortization + interest + taxes + addbacks;
    noiSource = "Gross profit bridge";
  } else {
    noiBeforeAdjust = 0;
    noiSource = "Net income bridge";
  }
  const noi = noiBeforeAdjust - mgmtFee - reserve;
  const proxyNote =
    noiSource === "EBITDA proxy"
      ? "Using EBITDA (+ addbacks − mgmt fee − reserve) as NOI proxy. Review expenses for real estate-specific normalization."
      : "";

  const capLow = b.cap_rate_low ?? 8; // % — produces high value
  const capMid = b.cap_rate_selected ?? 10; // % — selected
  const capHigh = b.cap_rate_high ?? 12; // % — produces low value

  const safe = (cap: number) => (noi > 0 && cap > 0 ? noi / (cap / 100) : 0);
  const value = safe(capMid);
  const low = safe(capHigh);
  const high = safe(capLow);

  const debt = latest.debt || 0;
  const equity = value - debt;

  const available = noi > 0 && capMid > 0;
  const warning = !available
    ? capMid <= 0
      ? "Selected cap rate must be greater than 0."
      : noi < 0
        ? "NOI is negative, so this method is not meaningful as a going-concern valuation. Review the asset-based floor or normalize stabilized NOI."
        : "NOI is zero, so this method is not meaningful without stabilized or normalized NOI."
    : "";

  const noiFormulaLine =
    noiSource === "EBITDA proxy"
      ? `NOI = EBITDA + Owner/One-time Addbacks − Mgmt Fee − Replacement Reserve\n    = ${fmtMoney(ebitda)} + ${fmtMoney(addbacks)} − ${fmtMoney(mgmtFee)} − ${fmtMoney(reserve)}`
      : noiSource === "Gross profit bridge"
        ? `NOI = Gross Profit − Operating Expenses + Depreciation + Amortization + Interest + Income Taxes + Owner/One-time Addbacks − Mgmt Fee − Replacement Reserve\n    = ${fmtMoney(grossProfit)} − ${fmtMoney(opex)} + ${fmtMoney(depreciation)} + ${fmtMoney(amortization)} + ${fmtMoney(interest)} + ${fmtMoney(taxes)} + ${fmtMoney(addbacks)} − ${fmtMoney(mgmtFee)} − ${fmtMoney(reserve)}`
        : `NOI = Net Income + Depreciation + Amortization + Interest + Income Taxes + Owner/One-time Addbacks − Mgmt Fee − Replacement Reserve\n    = ${fmtMoney(netIncome)} + ${fmtMoney(depreciation)} + ${fmtMoney(amortization)} + ${fmtMoney(interest)} + ${fmtMoney(taxes)} + ${fmtMoney(addbacks)} − ${fmtMoney(mgmtFee)} − ${fmtMoney(reserve)}`;

  const formula = `Value = Stabilized NOI ÷ Cap Rate
NOI source: ${noiSource}
${noiFormulaLine}
    = ${fmtMoney(noi)}
(NOI excludes debt service / loan principal payments, interest, depreciation, amortization, income taxes, owner personal expenses, and one-time/nonrecurring expenses. Debt affects equity value, not property value.)
Selected cap: ${capMid.toFixed(2)}% → ${fmtMoney(value)}
Range: ${capLow.toFixed(2)}% (high value ${fmtMoney(high)}) to ${capHigh.toFixed(2)}% (low value ${fmtMoney(low)})`;

  const reasoning =
    `Income-producing real estate is typically valued by capitalizing stabilized NOI at a market cap rate. Lower cap rates imply stronger location, occupancy, and lower risk; higher cap rates imply seasonality, deferred maintenance, or weaker location. ${proxyNote}`.trim();

  return {
    method: "cap_rate",
    label: "Cap Rate / Income Approach",
    value,
    low,
    high,
    inputUsed: noi,
    inputLabel: noiSource === "EBITDA proxy" ? "NOI (EBITDA proxy)" : "Stabilized NOI",
    confidence: available && noi > 0 ? "high" : "low",
    notes:
      noiSource === "EBITDA proxy"
        ? proxyNote
        : "Capitalizes stabilized NOI at a market cap rate. Standard for income-producing real estate.",
    formula,
    reasoning,
    available,
    warning: warning || undefined,
    noi,
    capRateUsed: capMid,
    capRateLow: capLow,
    capRateHigh: capHigh,
    enterpriseValue: value,
    debt,
    equityValue: equity,
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
// METHOD ROLE ASSIGNMENT BY CATEGORY
// ---------------------------------------------------------------------------
function recurringRevenueAggregationWeight(b: BusinessInputs): number {
  const recurringPct = Math.max(0, Math.min(100, Number(b.recurring_revenue_pct ?? 0) || 0));
  if (recurringPct < 60) return 0;

  const scale = (recurringPct - 60) / 40;
  return 0.15 + scale * 0.2;
}

function standardOperatingWeights(b: BusinessInputs): Record<string, number> {
  const base = { sde: 0.35, ebitda: 0.3, dcf: 0.15, comparable: 0.2 };
  const revenueWeight = recurringRevenueAggregationWeight(b);
  if (revenueWeight <= 0) return base;

  const remainingWeight = 1 - revenueWeight;
  return {
    sde: base.sde * remainingWeight,
    ebitda: base.ebitda * remainingWeight,
    dcf: base.dcf * remainingWeight,
    comparable: base.comparable * remainingWeight,
    revenue: revenueWeight,
  };
}

function assignRoles(
  methods: MethodResult[],
  category: BusinessCategory,
  isRv: boolean,
  recurringRevenueWeight = 0,
): MethodResult[] {
  return methods.map((m) => {
    let role: MethodRole = "supporting";
    if (category === "real_estate_income") {
      if (m.method === "cap_rate") role = isRv ? "recommended" : "primary";
      else if (m.method === "asset") role = "floor";
      else if (m.method === "revenue") role = "sanity_check";
      else if (m.method === "sde" || m.method === "ebitda") {
        role = "supporting";
        m.warning =
          m.warning ??
          "May understate value — does not fully capture land, location, occupancy, or infrastructure.";
      } else role = "supporting";
    } else if (category === "asset_heavy") {
      if (m.method === "asset") role = "primary";
      else if (m.method === "sde" || m.method === "ebitda") role = "primary";
      else if (m.method === "cap_rate") role = "supporting";
      else role = "supporting";
    } else {
      // standard_operating
      if (m.method === "sde" || m.method === "ebitda") role = "primary";
      else if (m.method === "comparable") role = "supporting";
      else if (m.method === "dcf") role = "supporting";
      else if (m.method === "revenue") {
        role = recurringRevenueWeight > 0 ? "supporting" : "sanity_check";
      }
      else if (m.method === "asset") role = "floor";
      else if (m.method === "cap_rate") role = "supporting";
    }
    return { ...m, role };
  });
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
  category: BusinessCategory;
  isRvOrCampground: boolean;
  enterpriseValue?: number;
  debt?: number;
  equityValue?: number;
};

export function valueBusiness(b: BusinessInputs): Valuation {
  const category =
    (b.business_category as BusinessCategory) || inferCategory(b.industry, b.sub_industry);
  const isRv = isRvOrCampground(b.industry, b.sub_industry);
  const recurringRevenueWeight =
    category === "standard_operating" ? recurringRevenueAggregationWeight(b) : 0;

  let methods = [
    methodSDE(b),
    methodEBITDA(b),
    methodRevenue(b),
    methodDCF(b),
    methodAsset(b),
    methodComparable(b),
    methodCapRate(b),
  ];
  methods = assignRoles(methods, category, isRv, recurringRevenueWeight);

  // Hide cap rate for standard operating businesses unless explicitly applicable
  if (category === "standard_operating") {
    methods = methods.filter((m) => m.method !== "cap_rate");
  }

  // Weights — ONLY the methods appropriate for this business category contribute
  // to the aggregated range and enterprise value. Methods with a "sanity_check"
  // or "floor" role are shown to the user but excluded from aggregation so
  // generic small-business multiples don't dilute (or inflate) the headline value.
  // Examples:
  //  • Real-estate income → cap rate drives value; SDE/EBITDA/Revenue/Asset are reference only.
  //  • Asset-heavy → earnings + asset floor; cap rate and revenue excluded.
  //  • Standard operating → SDE/EBITDA + DCF + comparables.
  //    If recurring revenue is 60%+, revenue multiples are weighted in as a supporting signal.
  const weights: Record<string, number> =
    category === "real_estate_income"
      ? { cap_rate: 0.7, dcf: 0.15, comparable: 0.15 }
      : category === "asset_heavy"
        ? { sde: 0.35, ebitda: 0.35, asset: 0.15, comparable: 0.15 }
        : standardOperatingWeights(b);

  // Cap-rate fallback: if real-estate cap rate is unavailable (missing NOI or cap rate),
  // fall back to DCF + comparable + EBITDA so the range is still meaningful.
  if (category === "real_estate_income") {
    const cap = methods.find((m) => m.method === "cap_rate");
    if (!cap?.available) {
      weights.cap_rate = 0;
      weights.ebitda = 0.3;
      weights.dcf = 0.35;
      weights.comparable = 0.35;
    }
  }

  let totalWeight = 0;
  let mid = 0,
    lo = 0,
    hi = 0;
  for (const m of methods) {
    if (!m.available) continue;
    const w = weights[m.method] ?? 0;
    if (w <= 0) continue;
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

  const latest = latestFinancials(b);
  const debt = latest?.debt || 0;
  const range = orderedNonNegativeRange(lo, mid, hi);
  const enterpriseValue = range.value;
  const equityValue = enterpriseValue - debt;

  return {
    methods,
    rangeLow: range.low,
    rangeMid: range.value,
    rangeHigh: range.high,
    weights,
    category,
    isRvOrCampground: isRv,
    enterpriseValue,
    debt,
    equityValue,
  };
}

// ---------------------------------------------------------------------------
// HEALTH SCORE — out of 100
// ---------------------------------------------------------------------------
export type HealthBreakdown = {
  financial_performance: HealthBreakdownItem;
  revenue_quality: HealthBreakdownItem;
  owner_independence: HealthBreakdownItem;
  customer_concentration: HealthBreakdownItem;
  growth_trend: HealthBreakdownItem;
  documentation: HealthBreakdownItem;
  management_team: HealthBreakdownItem;
  data_quality: HealthBreakdownItem;
};

export type HealthCategoryKey = keyof HealthBreakdown;
export type HealthCategoryStatus = "strength" | "watch" | "weakness";

export type HealthBreakdownItem = {
  score: number;
  max: number;
  label: string;
  threshold: string;
  driver: string;
  status: HealthCategoryStatus;
  detail: string;
};

export type HealthDriver = {
  key: HealthCategoryKey;
  label: string;
  score: number;
  max: number;
  status: HealthCategoryStatus;
  driver: string;
  threshold: string;
};

export type HealthScoreResult = {
  total: number;
  max: 100;
  rating: "strong" | "developing" | "needs_preparation" | "not_ready";
  ratingLabel: string;
  summary: string;
  breakdown: HealthBreakdown;
  strengths: HealthDriver[];
  weaknesses: HealthDriver[];
  drivers: HealthDriver[];
};

const HEALTH_SCORE_WEIGHTS: Record<HealthCategoryKey, number> = {
  financial_performance: 20,
  revenue_quality: 15,
  owner_independence: 20,
  customer_concentration: 10,
  growth_trend: 10,
  documentation: 10,
  management_team: 10,
  data_quality: 5,
};

const HEALTH_SCORE_MAX = Object.values(HEALTH_SCORE_WEIGHTS).reduce((sum, value) => sum + value, 0);

function healthItem(
  key: HealthCategoryKey,
  label: string,
  score: number,
  threshold: string,
  driver: string,
  detail: string,
): HealthBreakdownItem {
  const max = HEALTH_SCORE_WEIGHTS[key];
  const bounded = Math.max(0, Math.min(max, score));
  const pct = max > 0 ? bounded / max : 0;
  const status: HealthCategoryStatus = pct >= 0.75 ? "strength" : pct >= 0.4 ? "watch" : "weakness";

  return {
    score: bounded,
    max,
    label,
    threshold,
    driver,
    status,
    detail,
  };
}

function pctLabel(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "Unknown";
  return `${Number(value).toFixed(0)}%`;
}

function moneyDriver(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "Unknown";
  return fmtMoney(Number(value));
}

function healthRating(total: number): HealthScoreResult["rating"] {
  if (total >= 80) return "strong";
  if (total >= 65) return "developing";
  if (total >= 50) return "needs_preparation";
  return "not_ready";
}

function healthRatingLabel(rating: HealthScoreResult["rating"]): string {
  if (rating === "strong") return "Strong exit readiness";
  if (rating === "developing") return "Developing exit readiness";
  if (rating === "needs_preparation") return "Needs preparation";
  return "Not buyer-ready yet";
}

export function computeHealthScore(b: BusinessInputs): HealthScoreResult {
  if (HEALTH_SCORE_MAX !== 100) {
    throw new Error(`Health score weights must total 100. Current total: ${HEALTH_SCORE_MAX}`);
  }

  const sorted = [...b.financials].sort((a, c) => a.year - c.year);
  const latest = sorted[sorted.length - 1];

  // Financial performance (20)
  let fin = 0;
  let margin: number | null = null;
  let ebitda = 0;
  if (latest) {
    ebitda = calculateNormalizedEarnings(latest).ebitda;
    margin = latest.revenue > 0 ? ebitda / latest.revenue : 0;
    if (margin >= 0.2) fin = 20;
    else if (margin >= 0.15) fin = 16;
    else if (margin >= 0.1) fin = 12;
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
  const roles = [b.owner_in_sales, b.owner_in_operations, b.owner_in_customer_relationships].filter(
    Boolean,
  ).length;
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
  let growth: number | null = null;
  if (sorted.length >= 2) {
    const first = sorted[0].revenue;
    const last = latest.revenue;
    if (first > 0) {
      growth = last / first - 1;
      if (growth >= 0.3) gt = 10;
      else if (growth >= 0.15) gt = 8;
      else if (growth >= 0.05) gt = 6;
      else if (growth >= 0) gt = 4;
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
  if (latest && latest.revenue > 0 && ebitda !== 0) dq += 2;
  if (sorted.length >= 2) dq += 1;
  if (sorted.length >= 3) dq += 1;
  if (latest && latest.assets > 0 && latest.liabilities >= 0) dq += 1;

  const breakdown: HealthBreakdown = {
    financial_performance: healthItem(
      "financial_performance",
      "Financial performance",
      fin,
      "20+% EBITDA margin earns full credit; 15%+ is strong; below 5% is weak.",
      latest
        ? `${pctLabel((margin ?? 0) * 100)} EBITDA margin from ${moneyDriver(ebitda)} normalized EBITDA on ${moneyDriver(latest.revenue)} revenue`
        : "No financial year on file",
      "Measures earnings power using normalized EBITDA so interest, tax, depreciation, and amortization are handled consistently.",
    ),
    revenue_quality: healthItem(
      "revenue_quality",
      "Revenue quality",
      revq,
      "60%+ recurring revenue earns full credit; 40%+ is strong; below 10% is weak.",
      `${pctLabel(rec)} recurring or contracted revenue`,
      "Rewards predictable revenue that a buyer can underwrite after close.",
    ),
    owner_independence: healthItem(
      "owner_independence",
      "Owner independence",
      oi,
      "Full credit requires under 45 owner hours/week and no owner-held core roles.",
      `${hrs} owner hours/week; owner directly holds ${roles} of 3 core roles`,
      "Reflects whether the buyer is acquiring a transferable business or a job that depends on the seller.",
    ),
    customer_concentration: healthItem(
      "customer_concentration",
      "Customer concentration",
      cc,
      "Full credit requires top customer below 15% of revenue; 25%+ is a diligence concern.",
      `${pctLabel(conc)} of revenue from the top customer`,
      "Measures downside risk if a single customer leaves after a transaction.",
    ),
    growth_trend: healthItem(
      "growth_trend",
      "Growth trend",
      gt,
      "30%+ trailing growth earns full credit; 5%+ is positive; decline is weak.",
      sorted.length >= 2
        ? `${pctLabel((growth ?? 0) * 100)} revenue change from first to latest year`
        : "Only one year on file; default neutral score used",
      "Uses the financial years on file to show whether revenue is expanding, flat, or declining.",
    ),
    documentation: healthItem(
      "documentation",
      "Documentation / SOPs",
      doc,
      "Complete SOPs earn full credit; partial documentation receives half credit.",
      `${b.sop_status ?? "unknown"} SOP status`,
      "Buyers pay more for operations that can transfer without undocumented owner knowledge.",
    ),
    management_team: healthItem(
      "management_team",
      "Management team",
      mgmt,
      "A strong management bench earns full credit; partial bench receives half credit.",
      `${b.manager_team_depth ?? "unknown"} management depth`,
      "Measures whether day-to-day execution can continue without the owner.",
    ),
    data_quality: healthItem(
      "data_quality",
      "Data quality",
      dq,
      "Full credit requires 3 years, usable revenue and normalized EBITDA, plus balance-sheet data.",
      `${sorted.length} financial year${sorted.length === 1 ? "" : "s"}; ${latest?.assets ? "balance sheet present" : "balance sheet incomplete"}`,
      "Reduces confidence when the estimate is based on thin history or incomplete books.",
    ),
  };

  const total = Object.values(breakdown).reduce((s, v) => s + v.score, 0);
  const drivers: HealthDriver[] = (
    Object.entries(breakdown) as [HealthCategoryKey, HealthBreakdownItem][]
  )
    .map(([key, item]) => ({ key, ...item }))
    .sort((a, c) => a.score / a.max - c.score / c.max);
  const weaknesses = drivers.filter((driver) => driver.status !== "strength").slice(0, 3);
  const strengths = [...drivers]
    .reverse()
    .filter((driver) => driver.status === "strength")
    .slice(0, 3);
  const rating = healthRating(total);

  return {
    total,
    max: 100,
    rating,
    ratingLabel: healthRatingLabel(rating),
    summary:
      "This is an exit-readiness diagnostic based on transferability, financial quality, revenue risk, and data completeness. It is not a formal credit rating or appraisal.",
    breakdown,
    strengths,
    weaknesses,
    drivers,
  };
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
    revenue: 920_000,
    cogs: 415_000,
    gross_profit: 505_000,
    operating_expenses: 290_000,
    owner_salary: 110_000,
    addbacks: 18_000,
    ebitda: 215_000,
    net_income: 95_000,
    assets: 380_000,
    liabilities: 145_000,
    debt: 95_000,
  },
  {
    year: new Date().getFullYear() - 1,
    revenue: 1_005_000,
    cogs: 442_000,
    gross_profit: 563_000,
    operating_expenses: 305_000,
    owner_salary: 115_000,
    addbacks: 20_000,
    ebitda: 240_000,
    net_income: 110_000,
    assets: 410_000,
    liabilities: 138_000,
    debt: 88_000,
  },
  {
    year: new Date().getFullYear(),
    revenue: 1_100_000,
    cogs: 462_000,
    gross_profit: 638_000,
    operating_expenses: 320_000,
    owner_salary: 120_000,
    addbacks: 26_000,
    ebitda: 264_000,
    net_income: 124_000,
    assets: 445_000,
    liabilities: 132_000,
    debt: 80_000,
  },
];
