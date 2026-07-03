import type { Business } from "@/lib/business";
import { calculateNormalizedEarnings, valueBusiness, type BusinessInputs } from "@/lib/valuation";

export type ScenarioSearch = {
  ownerHrs?: number;
  sopComplete?: boolean;
  recurring?: number;
  marginUplift?: number;
  revenueGrowth?: number;
  topCust?: number;
  hireManager?: boolean;
  timelineMonths?: number;
};

export type ScenarioKnobs = {
  ownerInvolvement: number;
  recurring: number;
  profitMargin: number;
  revenueGrowth: number;
  customerConc: number;
  sopScore: number;
  managerHired: boolean;
  timelineMonths: number;
};

const stripQuotes = (value: string) => value.trim().replace(/^"+|"+$/g, "");

function numberParam(value: unknown, min: number, max: number) {
  if (value == null) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(typeof raw === "string" ? stripQuotes(raw) : raw);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(max, Math.max(min, parsed));
}

function booleanParam(value: unknown) {
  if (value == null) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw === "boolean") return raw;
  if (typeof raw !== "string") return undefined;
  const normalized = stripQuotes(raw).toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return undefined;
}

export function pctToHrs(pct: number) {
  return Math.round((pct / 100) * 70);
}

export function hrsToPct(hrs: number) {
  return Math.round((hrs / 70) * 100);
}

export function sopScoreToStatus(s: number) {
  if (s >= 75) return "complete";
  if (s >= 35) return "partial";
  return "none";
}

export function validateScenarioSearch(search: Record<string, unknown>): ScenarioSearch {
  return {
    ownerHrs: numberParam(search.ownerHrs, 0, 70),
    sopComplete: booleanParam(search.sopComplete),
    recurring: numberParam(search.recurring, 0, 100),
    marginUplift: numberParam(search.marginUplift, -10, 20),
    revenueGrowth: numberParam(search.revenueGrowth, -20, 50),
    topCust: numberParam(search.topCust, 0, 100),
    hireManager: booleanParam(search.hireManager),
    timelineMonths: numberParam(search.timelineMonths, 1, 36),
  };
}

export function businessKnobs(business: Business): ScenarioKnobs {
  return {
    ownerInvolvement: hrsToPct(business.owner_hours_per_week ?? 50),
    recurring: Number(business.recurring_revenue_pct ?? 20),
    profitMargin: 0,
    revenueGrowth: 0,
    customerConc: Number(business.top_customer_concentration_pct ?? 20),
    sopScore:
      business.sop_status === "complete" ? 90 : business.sop_status === "partial" ? 50 : 15,
    managerHired: business.manager_team_depth === "strong",
    timelineMonths: 6,
  };
}

export function applyScenarioSearchToKnobs(knobs: ScenarioKnobs, search: ScenarioSearch) {
  return {
    ...knobs,
    ownerInvolvement: search.ownerHrs == null ? knobs.ownerInvolvement : hrsToPct(search.ownerHrs),
    recurring: search.recurring ?? knobs.recurring,
    profitMargin: search.marginUplift ?? knobs.profitMargin,
    revenueGrowth: search.revenueGrowth ?? knobs.revenueGrowth,
    customerConc: search.topCust ?? knobs.customerConc,
    sopScore: search.sopComplete === true ? 90 : knobs.sopScore,
    managerHired: search.hireManager ?? knobs.managerHired,
    timelineMonths: search.timelineMonths ?? knobs.timelineMonths,
  };
}

export function scenarioInputs(base: BusinessInputs, knobs: ScenarioKnobs): BusinessInputs {
  const MANAGER_COST = 95_000;
  const financials = base.financials.map((year, index, years) => {
    if (index !== years.length - 1) return year;
    const revenue = year.revenue * (1 + knobs.revenueGrowth / 100);
    const normalized = calculateNormalizedEarnings(year);
    const currentEbitda = normalized.ebitda;
    const currentMarginPct = year.revenue > 0 ? (currentEbitda / year.revenue) * 100 : 0;
    const revenueDelta = revenue - year.revenue;
    let ebitda =
      currentEbitda +
      revenueDelta * (currentMarginPct / 100) +
      revenue * (knobs.profitMargin / 100);
    if (knobs.managerHired && base.manager_team_depth !== "strong") ebitda -= MANAGER_COST;
    const ebitdaDelta = ebitda - currentEbitda;
    return { ...year, revenue, ebitda, net_income: year.net_income + ebitdaDelta };
  });

  return {
    ...base,
    financials,
    recurring_revenue_pct: knobs.recurring,
    owner_hours_per_week: pctToHrs(knobs.ownerInvolvement),
    top_customer_concentration_pct: knobs.customerConc,
    sop_status: sopScoreToStatus(knobs.sopScore),
    manager_team_depth: knobs.managerHired ? "strong" : base.manager_team_depth,
  };
}

export function scenarioDelta(base: BusinessInputs, knobs: ScenarioKnobs) {
  const baseline = valueBusiness(base);
  const projected = valueBusiness(scenarioInputs(base, knobs));
  return projected.rangeMid - baseline.rangeMid;
}
