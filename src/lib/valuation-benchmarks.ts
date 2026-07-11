import { SAMPLE_HVAC_BUSINESS, SAMPLE_HVAC_FINANCIALS, type BusinessInputs } from "./valuation";

export type BenchmarkRiskFactor =
  | "owner_dependence"
  | "customer_concentration"
  | "thin_or_declining_profit"
  | "limited_recurring_revenue"
  | "incomplete_management_team"
  | "lease_or_location_risk"
  | "asset_or_debt_load"
  | "data_quality";

export type ValuationBenchmarkCase = {
  id: string;
  title: string;
  businessType: string;
  summary: string;
  inputs: BusinessInputs;
  expectedValuationRange: {
    low: number;
    mid: number;
    high: number;
    tolerancePct: number;
  };
  expectedRiskFactors: BenchmarkRiskFactor[];
  review: {
    status: "pending_external_review" | "reviewed";
    reviewer: string;
    notes: string;
  };
};

const latestYear = 2025;

export const VALUATION_BENCHMARK_CASES: ValuationBenchmarkCase[] = [
  {
    id: "hvac-service-trade",
    title: "HVAC service trade with steady growth and owner dependence",
    businessType: "HVAC / service trade",
    summary:
      "Established residential and light-commercial HVAC contractor with usable earnings, modest recurring service revenue, and meaningful owner involvement.",
    inputs: {
      ...SAMPLE_HVAC_BUSINESS,
      financials: SAMPLE_HVAC_FINANCIALS.map((year, index) => ({
        ...year,
        year: latestYear - (SAMPLE_HVAC_FINANCIALS.length - 1 - index),
      })),
    },
    expectedValuationRange: {
      low: 944_886.43,
      mid: 1_227_923.19,
      high: 1_536_678.62,
      tolerancePct: 0.01,
    },
    expectedRiskFactors: [
      "owner_dependence",
      "limited_recurring_revenue",
      "incomplete_management_team",
    ],
    review: {
      status: "pending_external_review",
      reviewer: "SMB valuation or broker reviewer required before production calibration",
      notes:
        "Fictional case based on directional SMB service-trade assumptions. Use for regression QA, not as market evidence.",
    },
  },
  {
    id: "restaurant-hospitality",
    title: "Restaurant with normalized positive SDE and high debt load",
    businessType: "Restaurant / hospitality",
    summary:
      "Small restaurant with volatile net income, depreciation-heavy books, no owner salary entered, and debt that materially affects equity value.",
    inputs: {
      industry: "Restaurant / Hospitality",
      business_category: "standard_operating",
      years_in_business: 8,
      employees: 12,
      owner_hours_per_week: 65,
      owner_in_sales: true,
      owner_in_operations: true,
      owner_in_customer_relationships: true,
      recurring_revenue_pct: 5,
      top_customer_concentration_pct: 6,
      sop_status: "none",
      manager_team_depth: "none",
      financials: [
        {
          year: 2023,
          revenue: 248_196,
          cogs: 2_529,
          gross_profit: 245_667,
          operating_expenses: 322_920,
          owner_salary: 0,
          addbacks: 0,
          ebitda: 0,
          net_income: -77_253,
          assets: 1_596_292,
          liabilities: 1_253_794,
          debt: 1_179_253,
          depreciation: 84_842,
          amortization: 20_133,
          interest: 63_718,
          income_taxes: 0,
        },
        {
          year: 2024,
          revenue: 285_092,
          cogs: 4_484,
          gross_profit: 280_608,
          operating_expenses: 282_358,
          owner_salary: 0,
          addbacks: 0,
          ebitda: 0,
          net_income: -1_750,
          assets: 1_509_057,
          liabilities: 1_164_310,
          debt: 1_139_752,
          depreciation: 75_671,
          amortization: 20_133,
          interest: 59_050,
          income_taxes: 0,
        },
        {
          year: 2025,
          revenue: 267_960,
          cogs: 2_054,
          gross_profit: 265_906,
          operating_expenses: 279_084,
          owner_salary: 0,
          addbacks: 0,
          ebitda: 0,
          net_income: -13_178,
          assets: 1_418_221,
          liabilities: 1_086_743,
          debt: 1_077_824,
          depreciation: 64_121,
          amortization: 21_811,
          interest: 58_420,
          income_taxes: 0,
        },
      ],
    },
    expectedValuationRange: {
      low: 251_915.37,
      mid: 344_222.55,
      high: 439_196.92,
      tolerancePct: 0.01,
    },
    expectedRiskFactors: [
      "owner_dependence",
      "limited_recurring_revenue",
      "incomplete_management_team",
      "asset_or_debt_load",
    ],
    review: {
      status: "pending_external_review",
      reviewer: "SMB valuation or broker reviewer required before production calibration",
      notes:
        "Fictional case exercises normalized earnings and equity-value pressure from debt-heavy balance sheets.",
    },
  },
  {
    id: "campground-rv-park",
    title: "Campground/RV park valued primarily by stabilized NOI",
    businessType: "Campground / RV park",
    summary:
      "Real-estate-income business with stable occupancy economics, management depth, and cap-rate valuation as the primary method.",
    inputs: {
      industry: "Restaurant / Hospitality",
      sub_industry: "RV park",
      business_category: "real_estate_income",
      years_in_business: 20,
      employees: 6,
      owner_hours_per_week: 20,
      owner_in_sales: false,
      owner_in_operations: false,
      owner_in_customer_relationships: false,
      recurring_revenue_pct: 70,
      top_customer_concentration_pct: 4,
      sop_status: "complete",
      manager_team_depth: "strong",
      cap_rate_low: 8,
      cap_rate_selected: 10,
      cap_rate_high: 12,
      management_fee_pct: 5,
      replacement_reserve_pct: 3,
      financials: [
        {
          year: 2023,
          revenue: 780_000,
          cogs: 0,
          gross_profit: 780_000,
          operating_expenses: 410_000,
          owner_salary: 90_000,
          addbacks: 15_000,
          ebitda: 0,
          net_income: 180_000,
          assets: 2_400_000,
          liabilities: 700_000,
          debt: 620_000,
          depreciation: 85_000,
          amortization: 0,
          interest: 35_000,
          income_taxes: 0,
        },
        {
          year: 2024,
          revenue: 825_000,
          cogs: 0,
          gross_profit: 825_000,
          operating_expenses: 430_000,
          owner_salary: 95_000,
          addbacks: 18_000,
          ebitda: 0,
          net_income: 205_000,
          assets: 2_500_000,
          liabilities: 680_000,
          debt: 600_000,
          depreciation: 87_000,
          amortization: 0,
          interest: 34_000,
          income_taxes: 0,
        },
        {
          year: 2025,
          revenue: 880_000,
          cogs: 0,
          gross_profit: 880_000,
          operating_expenses: 455_000,
          owner_salary: 100_000,
          addbacks: 22_000,
          ebitda: 0,
          net_income: 230_000,
          assets: 2_600_000,
          liabilities: 650_000,
          debt: 575_000,
          depreciation: 90_000,
          amortization: 0,
          interest: 32_000,
          income_taxes: 0,
        },
      ],
    },
    expectedValuationRange: {
      low: 2_201_325.06,
      mid: 2_663_797.44,
      high: 3_349_242.45,
      tolerancePct: 0.01,
    },
    expectedRiskFactors: ["lease_or_location_risk"],
    review: {
      status: "pending_external_review",
      reviewer: "SMB valuation or broker reviewer required before production calibration",
      notes:
        "Fictional case verifies that RV park/campground inputs prefer cap-rate valuation over standard operating-business weighting.",
    },
  },
  {
    id: "professional-services",
    title: "Professional services firm with client concentration risk",
    businessType: "Professional services",
    summary:
      "Profitable advisory/services firm with clean books and recurring revenue, offset by a concentrated top client and partial management bench.",
    inputs: {
      industry: "Professional Services",
      business_category: "standard_operating",
      years_in_business: 11,
      employees: 9,
      owner_hours_per_week: 42,
      owner_in_sales: true,
      owner_in_operations: false,
      owner_in_customer_relationships: true,
      recurring_revenue_pct: 48,
      top_customer_concentration_pct: 31,
      sop_status: "partial",
      manager_team_depth: "partial",
      financials: [
        {
          year: 2023,
          revenue: 690_000,
          cogs: 105_000,
          gross_profit: 585_000,
          operating_expenses: 370_000,
          owner_salary: 130_000,
          addbacks: 16_000,
          ebitda: 0,
          net_income: 82_000,
          assets: 210_000,
          liabilities: 74_000,
          debt: 35_000,
          depreciation: 18_000,
          amortization: 0,
          interest: 5_000,
          income_taxes: 22_000,
        },
        {
          year: 2024,
          revenue: 735_000,
          cogs: 112_000,
          gross_profit: 623_000,
          operating_expenses: 390_000,
          owner_salary: 138_000,
          addbacks: 19_000,
          ebitda: 0,
          net_income: 91_000,
          assets: 225_000,
          liabilities: 70_000,
          debt: 31_000,
          depreciation: 19_000,
          amortization: 0,
          interest: 4_500,
          income_taxes: 24_000,
        },
        {
          year: 2025,
          revenue: 790_000,
          cogs: 120_000,
          gross_profit: 670_000,
          operating_expenses: 420_000,
          owner_salary: 145_000,
          addbacks: 22_000,
          ebitda: 0,
          net_income: 99_000,
          assets: 245_000,
          liabilities: 68_000,
          debt: 28_000,
          depreciation: 20_000,
          amortization: 0,
          interest: 4_000,
          income_taxes: 27_000,
        },
      ],
    },
    expectedValuationRange: {
      low: 546_741.38,
      mid: 744_476.72,
      high: 948_146.34,
      tolerancePct: 0.01,
    },
    expectedRiskFactors: [
      "owner_dependence",
      "customer_concentration",
      "incomplete_management_team",
    ],
    review: {
      status: "pending_external_review",
      reviewer: "SMB valuation or broker reviewer required before production calibration",
      notes:
        "Fictional case exercises professional-services multiples and concentration/transferability risk.",
    },
  },
  {
    id: "distressed-low-profit",
    title: "Distressed low-profit business with unavailable earnings methods",
    businessType: "Distressed / low-profit business",
    summary:
      "Declining low-profit business with negative normalized earnings, weak transferability, high customer concentration, and thin asset coverage.",
    inputs: {
      industry: "Professional Services",
      business_category: "standard_operating",
      years_in_business: 5,
      employees: 3,
      owner_hours_per_week: 70,
      owner_in_sales: true,
      owner_in_operations: true,
      owner_in_customer_relationships: true,
      recurring_revenue_pct: 0,
      top_customer_concentration_pct: 45,
      sop_status: "none",
      manager_team_depth: "none",
      financials: [
        {
          year: 2023,
          revenue: 180_000,
          cogs: 65_000,
          gross_profit: 115_000,
          operating_expenses: 160_000,
          owner_salary: 0,
          addbacks: 0,
          ebitda: -35_000,
          net_income: -52_000,
          assets: 70_000,
          liabilities: 95_000,
          debt: 220_000,
          depreciation: 0,
          amortization: 0,
          interest: 0,
          income_taxes: 0,
        },
        {
          year: 2024,
          revenue: 135_000,
          cogs: 52_000,
          gross_profit: 83_000,
          operating_expenses: 138_000,
          owner_salary: 0,
          addbacks: 0,
          ebitda: -45_000,
          net_income: -62_000,
          assets: 58_000,
          liabilities: 84_000,
          debt: 210_000,
          depreciation: 0,
          amortization: 0,
          interest: 0,
          income_taxes: 0,
        },
        {
          year: 2025,
          revenue: 100_000,
          cogs: 40_000,
          gross_profit: 60_000,
          operating_expenses: 120_000,
          owner_salary: 0,
          addbacks: 0,
          ebitda: -50_000,
          net_income: -70_000,
          assets: 50_000,
          liabilities: 75_000,
          debt: 200_000,
          depreciation: 0,
          amortization: 0,
          interest: 0,
          income_taxes: 0,
        },
      ],
    },
    expectedValuationRange: {
      low: 0,
      mid: 0,
      high: 0,
      tolerancePct: 0.01,
    },
    expectedRiskFactors: [
      "owner_dependence",
      "customer_concentration",
      "thin_or_declining_profit",
      "limited_recurring_revenue",
      "incomplete_management_team",
      "asset_or_debt_load",
    ],
    review: {
      status: "pending_external_review",
      reviewer: "SMB valuation or broker reviewer required before production calibration",
      notes:
        "Fictional case verifies the engine does not manufacture precision when earnings and asset floors are not supportable.",
    },
  },
];

export function getBenchmarkCase(id: string): ValuationBenchmarkCase {
  const benchmark = VALUATION_BENCHMARK_CASES.find((item) => item.id === id);
  if (!benchmark) throw new Error(`Unknown valuation benchmark case: ${id}`);
  return benchmark;
}
