import type { FinancialYearRow } from "@/lib/business";

export type DataQualitySeverity = "critical" | "warning";

export type DataQualityIssue = {
  severity: DataQualitySeverity;
  title: string;
  detail: string;
  years?: number[];
};

export type DataQualityStatus = "ready" | "needs_review" | "weak";

export type DataQualityReview = {
  status: DataQualityStatus;
  label: string;
  summary: string;
  issues: DataQualityIssue[];
  requiredAcknowledgement: boolean;
  yearCount: number;
  latestYear: number | null;
};

type FinancialLike = Partial<FinancialYearRow> & {
  year?: number | null;
  depreciation?: number | null;
  amortization?: number | null;
  interest?: number | null;
  income_taxes?: number | null;
};

type ReviewOptions = {
  unmappedAccountCount?: number;
};

const MONEY_TOLERANCE = 1;

export function reviewFinancialData(
  financials: FinancialLike[],
  options: ReviewOptions = {},
): DataQualityReview {
  const rows = financials
    .filter((row) => row.year != null)
    .map((row) => ({ ...row, year: Number(row.year) }))
    .sort((a, b) => Number(a.year) - Number(b.year));
  const issues: DataQualityIssue[] = [];
  const years = rows.map((row) => Number(row.year));
  const latest = rows[rows.length - 1] ?? null;

  if (rows.length < 3) {
    issues.push({
      severity: "critical",
      title: "Less than three years of financial history",
      detail:
        "Buyers and lenders usually expect three completed years before relying on a valuation.",
      years,
    });
  }

  const missingYears = getMissingYears(years);
  if (missingYears.length) {
    issues.push({
      severity: "warning",
      title: "Financial history has a year gap",
      detail: `Missing ${missingYears.join(", ")} between the earliest and latest financial year.`,
      years: missingYears,
    });
  }

  const missingRevenue = rows.filter((row) => money(row.revenue) <= 0).map((row) => row.year);
  if (missingRevenue.length) {
    issues.push({
      severity: "critical",
      title: "Revenue is missing or zero",
      detail: "Each valuation year needs positive gross revenue.",
      years: missingRevenue,
    });
  }

  const missingProfit = rows
    .filter((row) => {
      const hasNetIncome = hasValue(row.net_income);
      const hasEbitdaBridge =
        hasValue(row.depreciation) ||
        hasValue(row.amortization) ||
        hasValue(row.interest) ||
        hasValue(row.income_taxes);
      const hasStoredEbitda = hasValue(row.ebitda);
      return !hasNetIncome && !hasEbitdaBridge && !hasStoredEbitda;
    })
    .map((row) => row.year);
  if (missingProfit.length) {
    issues.push({
      severity: "critical",
      title: "Profit fields are missing",
      detail: "Net income or EBITDA bridge fields are needed so EBITDA and SDE can be normalized.",
      years: missingProfit,
    });
  }

  if (latest) {
    const missingBalanceSheet = ["assets", "liabilities", "debt"].filter(
      (field) => !hasValue(latest[field as keyof FinancialLike]),
    );
    if (missingBalanceSheet.length) {
      issues.push({
        severity: "warning",
        title: "Latest balance sheet fields are blank",
        detail: `Review ${missingBalanceSheet.join(", ")} for the latest year before sharing valuation outputs.`,
        years: [latest.year],
      });
    }
  }

  for (const row of rows) {
    const year = Number(row.year);
    const revenue = money(row.revenue);
    const cogs = money(row.cogs);
    const grossProfit = money(row.gross_profit);
    const operatingExpenses = money(row.operating_expenses);
    const netIncome = money(row.net_income);
    const ebitda = money(row.ebitda);
    const assets = money(row.assets);
    const liabilities = money(row.liabilities);
    const debt = money(row.debt);
    const ebitdaBridge =
      netIncome +
      money(row.depreciation) +
      money(row.amortization) +
      money(row.interest) +
      money(row.income_taxes);

    const negativeFields = [
      ["COGS", cogs],
      ["operating expenses", operatingExpenses],
      ["assets", assets],
      ["liabilities", liabilities],
      ["debt", debt],
    ].filter(([, value]) => Number(value) < 0);
    if (revenue < 0 || negativeFields.length) {
      issues.push({
        severity: revenue < 0 ? "critical" : "warning",
        title: "Negative value needs review",
        detail:
          revenue < 0
            ? "Revenue is negative, which prevents a reliable valuation."
            : `${negativeFields.map(([field]) => field).join(", ")} should usually not be negative.`,
        years: [year],
      });
    }

    if (revenue > 0) {
      const margin = ebitda / revenue;
      if (margin > 0.8 || margin < -0.5) {
        issues.push({
          severity: "warning",
          title: "EBITDA margin looks unusual",
          detail: `${year} EBITDA margin is ${(margin * 100).toFixed(1)}%. Confirm revenue, expenses, and EBITDA bridge fields.`,
          years: [year],
        });
      }
      if (debt > revenue * 3) {
        issues.push({
          severity: "warning",
          title: "Debt is high relative to revenue",
          detail: `${year} debt is more than 3x revenue. Confirm debt is not duplicated with liabilities.`,
          years: [year],
        });
      }
    }

    if (liabilities > 0 && debt > liabilities * 1.05) {
      issues.push({
        severity: "warning",
        title: "Debt exceeds total liabilities",
        detail: `${year} debt is higher than total liabilities. Confirm the balance sheet totals.`,
        years: [year],
      });
    }

    if (assets > 0 && liabilities > assets * 2) {
      issues.push({
        severity: "warning",
        title: "Liabilities look high relative to assets",
        detail: `${year} liabilities are more than 2x assets. Confirm assets and liabilities are mapped correctly.`,
        years: [year],
      });
    }

    if (hasValue(row.gross_profit)) {
      const expectedGrossProfit = revenue - cogs;
      if (Math.abs(grossProfit - expectedGrossProfit) > tolerance(revenue)) {
        issues.push({
          severity: "warning",
          title: "Gross profit does not match revenue minus COGS",
          detail: `${year} gross profit differs from revenue minus COGS by more than the tolerance.`,
          years: [year],
        });
      }
    }

    if (hasValue(row.ebitda) && hasValue(row.net_income)) {
      if (Math.abs(ebitda - ebitdaBridge) > tolerance(Math.max(Math.abs(ebitda), revenue))) {
        issues.push({
          severity: "warning",
          title: "EBITDA does not match normalization bridge",
          detail: `${year} EBITDA should equal net income plus interest, taxes, depreciation, and amortization.`,
          years: [year],
        });
      }
    }
  }

  if ((options.unmappedAccountCount ?? 0) > 0) {
    issues.push({
      severity: "critical",
      title: "Imported accounts are unmapped",
      detail: `${options.unmappedAccountCount} imported account${options.unmappedAccountCount === 1 ? "" : "s"} must be mapped or ignored before the import is valuation-ready.`,
    });
  }

  const hasCritical = issues.some((issue) => issue.severity === "critical");
  const status: DataQualityStatus = hasCritical ? "weak" : issues.length ? "needs_review" : "ready";

  return {
    status,
    label: status === "ready" ? "Ready" : status === "needs_review" ? "Needs review" : "Weak data",
    summary:
      status === "ready"
        ? "Core valuation inputs are complete and internally consistent."
        : status === "needs_review"
          ? "Valuation can proceed after reviewing the highlighted assumptions."
          : "Valuation should only proceed after explicit acknowledgement.",
    issues,
    requiredAcknowledgement: status !== "ready",
    yearCount: rows.length,
    latestYear: latest?.year ?? null,
  };
}

function money(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasValue(value: unknown) {
  if (value === null || value === undefined || value === "") return false;
  const parsed = Number(value);
  return Number.isFinite(parsed);
}

function tolerance(value: number) {
  return Math.max(MONEY_TOLERANCE, Math.abs(value) * 0.01);
}

function getMissingYears(years: number[]) {
  if (years.length < 2) return [];
  const present = new Set(years);
  const min = Math.min(...years);
  const max = Math.max(...years);
  const missing: number[] = [];
  for (let year = min; year <= max; year++) {
    if (!present.has(year)) missing.push(year);
  }
  return missing;
}
