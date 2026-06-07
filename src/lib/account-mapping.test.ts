import assert from "node:assert/strict";
import {
  applySavedMappings,
  autoMapAccount,
  countUnmappedAccounts,
  rollupMappedAccounts,
  type AccountMappingInput,
} from "./account-mapping";

assert.equal(autoMapAccount({ sourceAccountName: "Sales - Services" }), "revenue");
assert.equal(autoMapAccount({ sourceAccountName: "Cost of Goods Sold" }), "cogs");
assert.equal(autoMapAccount({ sourceAccountName: "Officer Salary" }), "owner_salary");
assert.equal(autoMapAccount({ sourceAccountName: "Bank Loan" }), "debt");
assert.equal(autoMapAccount({ sourceAccountName: "Unclassified Clearing" }), "unmapped");

const accounts: AccountMappingInput[] = [
  { sourceSystem: "quickbooks", sourceAccountName: "Sales", year: 2025, amount: 200_000 },
  { sourceSystem: "quickbooks", sourceAccountName: "Wages", year: 2025, amount: -40_000 },
  { sourceSystem: "quickbooks", sourceAccountName: "Owner Draw", year: 2025, amount: -25_000 },
  { sourceSystem: "quickbooks", sourceAccountName: "Mystery Account", year: 2025, amount: 5_000 },
];

const mapped = applySavedMappings(accounts, [
  {
    source_system: "quickbooks",
    source_account_id: null,
    source_account_name: "Mystery Account",
    normalized_field: "addbacks",
  },
]);

assert.equal(countUnmappedAccounts(mapped), 0);
assert.equal(mapped.find((account) => account.sourceAccountName === "Mystery Account")?.confidence, "saved");

const [rollup] = rollupMappedAccounts(mapped);
assert.deepEqual(rollup, {
  year: 2025,
  revenue: 200_000,
  operating_expenses: 40_000,
  owner_salary: 25_000,
  addbacks: 5_000,
});

const unmapped = applySavedMappings(
  [{ sourceSystem: "csv", sourceAccountName: "Suspense", year: 2025, amount: 10 }],
  [],
);
assert.equal(countUnmappedAccounts(unmapped), 1);

console.log("account mapping tests passed");
