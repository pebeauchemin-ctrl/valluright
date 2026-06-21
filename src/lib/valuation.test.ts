import {
  calculateNormalizedEarnings,
  computeHealthScore,
  methodAsset,
  methodComparable,
  methodDCF,
  methodEBITDA,
  methodRevenue,
  methodSDE,
  selectMultipleAssumption,
  valueBusiness,
  type BusinessInputs,
  type FinancialYear,
  type MultipleAssumption,
} from "./valuation";
import { VALUATION_BENCHMARK_CASES, getBenchmarkCase } from "./valuation-benchmarks";

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

const hvacFixture = getBenchmarkCase("hvac-service-trade").inputs;
const restaurantFixture = getBenchmarkCase("restaurant-hospitality").inputs;
const campgroundFixture = getBenchmarkCase("campground-rv-park").inputs;
const professionalServicesFixture = getBenchmarkCase("professional-services").inputs;
const distressedFixture = getBenchmarkCase("distressed-low-profit").inputs;

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

test("benchmark cases cover the required business categories with 3-year financial history", () => {
  assertEqual(VALUATION_BENCHMARK_CASES.length, 5, "benchmark case count");
  for (const benchmark of VALUATION_BENCHMARK_CASES) {
    assertEqual(benchmark.inputs.financials.length, 3, `${benchmark.id} financial year count`);
    assert(benchmark.summary.length > 0, `${benchmark.id} summary`);
    assert(
      benchmark.expectedRiskFactors.length > 0,
      `${benchmark.id} expected risk factors are defined`,
    );
    assert(
      benchmark.review.reviewer.includes("SMB valuation") ||
        benchmark.review.reviewer.includes("broker"),
      `${benchmark.id} review audience`,
    );
  }
});

test("benchmark cases lock expected valuation ranges for QA", () => {
  for (const benchmark of VALUATION_BENCHMARK_CASES) {
    const valuation = valueBusiness(benchmark.inputs);
    const { expectedValuationRange: expected } = benchmark;
    const toleranceLow = Math.max(1, expected.low * expected.tolerancePct);
    const toleranceMid = Math.max(1, expected.mid * expected.tolerancePct);
    const toleranceHigh = Math.max(1, expected.high * expected.tolerancePct);

    assertApprox(valuation.rangeLow, expected.low, `${benchmark.id} low`, toleranceLow);
    assertApprox(valuation.rangeMid, expected.mid, `${benchmark.id} mid`, toleranceMid);
    assertApprox(valuation.rangeHigh, expected.high, `${benchmark.id} high`, toleranceHigh);
  }
});

test("negative net income can still normalize to positive EBITDA while high debt reduces equity value", () => {
  const latest = [...restaurantFixture.financials].sort((a, c) => c.year - a.year)[0];
  const normalized = calculateNormalizedEarnings(latest);
  const valuation = valueBusiness(restaurantFixture);
  const dcf = methodDCF(restaurantFixture);

  assertApprox(normalized.ebitda, 131_174, "restaurant normalized EBITDA");
  assertApprox(normalized.sde, 131_174, "restaurant normalized SDE");
  assertApprox(valuation.rangeMid, 294_391.11, "restaurant blended mid");
  assert((valuation.equityValue ?? 0) < 0, "high debt should reduce equity below zero");
  assertEqual(dcf.confidence, "medium", "three-year DCF confidence");
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

test("professional services benchmark captures concentration and transferability risk", () => {
  const health = computeHealthScore(professionalServicesFixture);
  const benchmark = getBenchmarkCase("professional-services");

  assert(
    health.weaknesses.some((driver) => driver.key === "customer_concentration"),
    "professional services benchmark flags customer concentration",
  );
  assert(
    benchmark.expectedRiskFactors.includes("owner_dependence"),
    "professional services benchmark documents owner dependence risk",
  );
});

test("industry multiple assumptions can vary by revenue size and owner dependence", () => {
  const customAssumptions: MultipleAssumption[] = [
    {
      slug: "hvac-large-low-owner-test",
      industry: "HVAC / Trades",
      business_category: "standard_operating",
      revenue_min: 1_000_000,
      revenue_max: null,
      owner_dependence: "low",
      confidence_level: "high",
      sde_low: 3.2,
      sde_mid: 4.0,
      sde_high: 4.8,
      ebitda_low: 5.0,
      ebitda_mid: 6.0,
      ebitda_high: 7.0,
      revenue_low: 0.8,
      revenue_mid: 1.0,
      revenue_high: 1.2,
      source_label: "Broker-reviewed HVAC comp set",
      source_notes: "Test assumption for larger, lower owner-dependence HVAC businesses.",
      active: true,
    },
  ];
  const inputs: BusinessInputs = {
    ...hvacFixture,
    owner_hours_per_week: 15,
    owner_in_sales: false,
    owner_in_operations: false,
    owner_in_customer_relationships: false,
    multiple_assumptions: customAssumptions,
    financials: [latestFixture({ revenue: 1_250_000, ebitda: 300_000, net_income: 300_000 })],
  };
  const selected = selectMultipleAssumption(inputs);
  const sde = methodSDE(inputs);

  assertEqual(
    selected.assumption.slug,
    "hvac-large-low-owner-test",
    "specific assumption selected",
  );
  assertEqual(sde.multipleSource, "Broker-reviewed HVAC comp set", "method includes source label");
  assert(
    sde.reasoning?.includes("planning assumptions") === true,
    "method explains multiples are planning assumptions",
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
