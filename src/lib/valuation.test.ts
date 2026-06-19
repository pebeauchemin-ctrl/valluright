import {
  SAMPLE_HVAC_BUSINESS,
  SAMPLE_HVAC_FINANCIALS,
  calculateNormalizedEarnings,
  computeHealthScore,
  methodAsset,
  methodComparable,
  methodDCF,
  methodEBITDA,
  methodRevenue,
  methodSDE,
  valueBusiness,
  type BusinessInputs,
  type FinancialYear,
} from "./valuation";

type TestCase = {
  name: string;
  run: () => void;
};

const tests: TestCase[] = [];

function test(name: string, run: () => void) {
  tests.push({ name, run });
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertApprox(actual: number, expected: number, label: string, tolerance = 0.01) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function latestFixture(overrides: Partial<FinancialYear> = {}): FinancialYear {
  return {
    year: 2025,
    revenue: 500_000,
    cogs: 120_000,
    gross_profit: 380_000,
    operating_expenses: 260_000,
    owner_salary: 90_000,
    addbacks: 25_000,
    ebitda: 0,
    net_income: 75_000,
    assets: 250_000,
    liabilities: 80_000,
    debt: 40_000,
    depreciation: 30_000,
    amortization: 5_000,
    interest: 10_000,
    income_taxes: 12_000,
    ...overrides,
  };
}

const hvacFixture: BusinessInputs = {
  ...SAMPLE_HVAC_BUSINESS,
  financials: SAMPLE_HVAC_FINANCIALS,
};

const restaurantFixture: BusinessInputs = {
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
};

const campgroundFixture: BusinessInputs = {
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
    latestFixture({
      year: 2023,
      revenue: 780_000,
      cogs: 0,
      gross_profit: 780_000,
      operating_expenses: 410_000,
      owner_salary: 90_000,
      addbacks: 15_000,
      net_income: 180_000,
      assets: 2_400_000,
      liabilities: 700_000,
      debt: 620_000,
      depreciation: 85_000,
      amortization: 0,
      interest: 35_000,
      income_taxes: 0,
    }),
    latestFixture({
      year: 2024,
      revenue: 825_000,
      cogs: 0,
      gross_profit: 825_000,
      operating_expenses: 430_000,
      owner_salary: 95_000,
      addbacks: 18_000,
      net_income: 205_000,
      assets: 2_500_000,
      liabilities: 680_000,
      debt: 600_000,
      depreciation: 87_000,
      amortization: 0,
      interest: 34_000,
      income_taxes: 0,
    }),
    latestFixture({
      revenue: 880_000,
      cogs: 0,
      gross_profit: 880_000,
      operating_expenses: 455_000,
      owner_salary: 100_000,
      addbacks: 22_000,
      net_income: 230_000,
      assets: 2_600_000,
      liabilities: 650_000,
      debt: 575_000,
      depreciation: 90_000,
      amortization: 0,
      interest: 32_000,
      income_taxes: 0,
    }),
  ],
};

const distressedFixture: BusinessInputs = {
  industry: "Professional Services",
  business_category: "standard_operating",
  owner_hours_per_week: 70,
  owner_in_sales: true,
  owner_in_operations: true,
  owner_in_customer_relationships: true,
  recurring_revenue_pct: 0,
  top_customer_concentration_pct: 45,
  sop_status: "none",
  manager_team_depth: "none",
  financials: [
    latestFixture({
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
    }),
  ],
};

test("normalizes EBITDA and SDE from net income bridge without double-counting owner compensation", () => {
  const normalized = calculateNormalizedEarnings(latestFixture());

  assertApprox(normalized.ebitda, 132_000, "normalized EBITDA");
  assertApprox(normalized.sde, 247_000, "normalized SDE");
  assertEqual(normalized.usedEnteredEbitda, false, "uses bridge EBITDA");
  assert(
    normalized.ebitdaFormula.includes("Net Income + Interest + Income Taxes"),
    "EBITDA formula explains bridge",
  );
  assert(
    normalized.sdeFormula.includes("Owner Compensation + One-time Add-backs"),
    "SDE formula explains owner comp",
  );
});

test("uses entered EBITDA only when no bridge fields are available", () => {
  const normalized = calculateNormalizedEarnings(
    latestFixture({
      ebitda: 180_000,
      net_income: 0,
      depreciation: 0,
      amortization: 0,
      interest: 0,
      income_taxes: 0,
      owner_salary: 50_000,
      addbacks: 10_000,
    }),
  );

  assertApprox(normalized.ebitda, 180_000, "entered EBITDA");
  assertApprox(normalized.sde, 240_000, "entered EBITDA SDE");
  assertEqual(normalized.usedEnteredEbitda, true, "entered EBITDA flag");
});

test("sample HVAC fixture locks SDE, EBITDA, revenue, DCF, asset, comparable, and blended range", () => {
  const valuation = valueBusiness(hvacFixture);
  const sde = methodSDE(hvacFixture);
  const ebitda = methodEBITDA(hvacFixture);
  const revenue = methodRevenue(hvacFixture);
  const dcf = methodDCF(hvacFixture);
  const asset = methodAsset(hvacFixture);
  const comparable = methodComparable(hvacFixture);

  assertEqual(valuation.category, "standard_operating", "HVAC category");
  assertApprox(sde.inputUsed ?? 0, 410_000, "HVAC SDE input");
  assertApprox(sde.value, 1_131_600, "HVAC SDE value");
  assertApprox(ebitda.value, 1_082_400, "HVAC EBITDA value");
  assertApprox(revenue.value, 627_000, "HVAC revenue value");
  assertApprox(dcf.value, 1_948_773.45, "HVAC DCF value");
  assertApprox(asset.value, 313_000, "HVAC asset floor");
  assertApprox(comparable.value, 1_051_650, "HVAC comparable value");
  assertApprox(valuation.rangeLow, 941_603.49, "HVAC blended low");
  assertApprox(valuation.rangeMid, 1_223_426.02, "HVAC blended mid");
  assertApprox(valuation.rangeHigh, 1_531_147.1, "HVAC blended high");
});

test("negative net income can still normalize to positive EBITDA while high debt reduces equity value", () => {
  const normalized = calculateNormalizedEarnings(restaurantFixture.financials[0]);
  const valuation = valueBusiness(restaurantFixture);
  const dcf = methodDCF(restaurantFixture);

  assertApprox(normalized.ebitda, 131_174, "restaurant normalized EBITDA");
  assertApprox(normalized.sde, 131_174, "restaurant normalized SDE");
  assertApprox(valuation.rangeMid, 297_281.89, "restaurant blended mid");
  assert((valuation.equityValue ?? 0) < 0, "high debt should reduce equity below zero");
  assertEqual(dcf.confidence, "low", "incomplete single-year DCF confidence");
});

test("real estate income fixture uses cap rate as the primary valuation driver", () => {
  const valuation = valueBusiness(campgroundFixture);
  const capRate = valuation.methods.find((method) => method.method === "cap_rate");

  assert(capRate?.available === true, "cap-rate method should be available");
  assertEqual(capRate.role, "recommended", "cap-rate method role");
  assertApprox(capRate.inputUsed ?? 0, 303_600, "stabilized NOI");
  assertApprox(capRate.value, 3_036_000, "cap-rate value");
  assertApprox(valuation.rangeMid, 2_634_896.65, "campground blended mid");
  assertApprox(valuation.weights.cap_rate, 0.7, "cap-rate weight");
});

test("distressed or missing earnings do not create false precision from unavailable methods", () => {
  const valuation = valueBusiness(distressedFixture);
  const sde = methodSDE(distressedFixture);
  const ebitda = methodEBITDA(distressedFixture);
  const dcf = methodDCF(distressedFixture);
  const asset = methodAsset(distressedFixture);
  const revenue = methodRevenue(distressedFixture);

  assertEqual(sde.available, false, "distressed SDE unavailable");
  assertEqual(ebitda.available, false, "distressed EBITDA unavailable");
  assertEqual(dcf.available, false, "distressed DCF unavailable");
  assertEqual(asset.available, false, "distressed asset floor unavailable");
  assertEqual(revenue.available, true, "distressed revenue sanity check available");
  assertApprox(valuation.rangeLow, 0, "distressed blended low");
  assertApprox(valuation.rangeMid, 0, "distressed blended mid");
  assertApprox(valuation.rangeHigh, 0, "distressed blended high");
});

test("empty financials return unavailable method outputs and a zero blended range", () => {
  const valuation = valueBusiness({ ...hvacFixture, financials: [] });

  assert(
    valuation.methods.every((method) => !method.available),
    "all methods unavailable without financials",
  );
  assertApprox(valuation.rangeLow, 0, "empty financials low");
  assertApprox(valuation.rangeMid, 0, "empty financials mid");
  assertApprox(valuation.rangeHigh, 0, "empty financials high");
});

test("health score uses an explicit 100-point exit-readiness rubric", () => {
  const health = computeHealthScore(hvacFixture);
  const max = Object.values(health.breakdown).reduce((sum, item) => sum + item.max, 0);
  const total = Object.values(health.breakdown).reduce((sum, item) => sum + item.score, 0);

  assertEqual(health.max, 100, "health score max");
  assertEqual(max, 100, "health category max total");
  assertEqual(health.total, total, "health score total matches category scores");
  assert(health.ratingLabel.includes("readiness"), "health score is framed as readiness");
  assert(
    Object.values(health.breakdown).every(
      (item) => item.label && item.threshold && item.driver && item.detail,
    ),
    "each health category explains threshold and driver",
  );
});

test("health score responds to financial and profile input changes", () => {
  const weak = computeHealthScore(distressedFixture);
  const strong = computeHealthScore(campgroundFixture);

  assert(strong.total > weak.total, "strong fixture should outscore distressed fixture");
  assert(
    strong.breakdown.owner_independence.score > weak.breakdown.owner_independence.score,
    "owner independence should improve with lower owner involvement",
  );
  assert(
    strong.breakdown.financial_performance.score > weak.breakdown.financial_performance.score,
    "financial performance should improve with stronger normalized earnings",
  );
});

let failures = 0;
for (const { name, run } of tests) {
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

if (failures > 0) {
  throw new Error(`${failures} valuation test${failures === 1 ? "" : "s"} failed`);
}
