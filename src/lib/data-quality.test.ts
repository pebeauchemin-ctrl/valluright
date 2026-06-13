import assert from "node:assert/strict";
import { reviewFinancialData } from "./data-quality";

const completeYears = [
  {
    year: 2023,
    revenue: 500_000,
    cogs: 100_000,
    gross_profit: 400_000,
    operating_expenses: 250_000,
    owner_salary: 75_000,
    addbacks: 10_000,
    ebitda: 85_000,
    net_income: 50_000,
    depreciation: 20_000,
    amortization: 5_000,
    interest: 10_000,
    income_taxes: 0,
    assets: 300_000,
    liabilities: 120_000,
    debt: 90_000,
  },
  {
    year: 2024,
    revenue: 540_000,
    cogs: 110_000,
    gross_profit: 430_000,
    operating_expenses: 265_000,
    owner_salary: 80_000,
    addbacks: 12_000,
    ebitda: 92_000,
    net_income: 57_000,
    depreciation: 20_000,
    amortization: 5_000,
    interest: 10_000,
    income_taxes: 0,
    assets: 320_000,
    liabilities: 130_000,
    debt: 95_000,
  },
  {
    year: 2025,
    revenue: 580_000,
    cogs: 120_000,
    gross_profit: 460_000,
    operating_expenses: 275_000,
    owner_salary: 85_000,
    addbacks: 15_000,
    ebitda: 100_000,
    net_income: 62_000,
    depreciation: 22_000,
    amortization: 6_000,
    interest: 10_000,
    income_taxes: 0,
    assets: 350_000,
    liabilities: 140_000,
    debt: 100_000,
  },
];

assert.equal(reviewFinancialData(completeYears).status, "ready");
assert.equal(reviewFinancialData(completeYears).requiredAcknowledgement, false);

const weak = reviewFinancialData([
  {
    year: 2025,
    revenue: 0,
    cogs: 0,
    gross_profit: 0,
    operating_expenses: 0,
    owner_salary: 0,
    addbacks: 0,
    ebitda: 0,
    net_income: 0,
    assets: 0,
    liabilities: 0,
    debt: 0,
  },
]);

assert.equal(weak.status, "weak");
assert.equal(weak.requiredAcknowledgement, true);
assert.ok(
  weak.issues.some((issue) => issue.title === "Less than three years of financial history"),
);
assert.ok(weak.issues.some((issue) => issue.title === "Revenue is missing or zero"));

const needsReview = reviewFinancialData(completeYears.map((row) => ({ ...row, owner_salary: 0 })));

assert.equal(needsReview.status, "needs_review");
assert.equal(needsReview.requiredAcknowledgement, true);

const unmapped = reviewFinancialData(completeYears, { unmappedAccountCount: 2 });
assert.equal(unmapped.status, "weak");
assert.ok(unmapped.issues.some((issue) => issue.title === "Imported accounts are unmapped"));

console.log("data quality tests passed");
