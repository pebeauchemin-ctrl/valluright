import assert from "node:assert/strict";
import {
  extractXeroMappedAccounts,
  parseBalanceSheet,
  parsePnl,
} from "./xero.server";

const pnlReport = {
  Reports: [
    {
      Rows: [
        {
          RowType: "Section",
          Title: "Income",
          Rows: [
            {
              RowType: "Row",
              Cells: [{ Value: "Service Revenue" }, { Value: "" }, { Value: "125,000" }],
            },
            {
              RowType: "SummaryRow",
              Cells: [{ Value: "Total Income" }, { Value: "" }, { Value: "125,000" }],
            },
          ],
        },
        {
          RowType: "Section",
          Title: "Expenses",
          Rows: [
            {
              RowType: "Row",
              Cells: [{ Value: "Wages" }, { Value: "" }, { Value: "(30,000)" }],
            },
            {
              RowType: "SummaryRow",
              Cells: [{ Value: "Total Expenses" }, { Value: "" }, { Value: "30,000" }],
            },
          ],
        },
        {
          RowType: "SummaryRow",
          Cells: [{ Value: "Net Profit" }, { Value: "" }, { Value: "95,000" }],
        },
      ],
    },
  ],
};

const balanceSheetReport = {
  Reports: [
    {
      Rows: [
        {
          RowType: "SummaryRow",
          Cells: [{ Value: "Total Assets" }, { Value: "" }, { Value: "400,000" }],
        },
        {
          RowType: "SummaryRow",
          Cells: [{ Value: "Total Liabilities" }, { Value: "" }, { Value: "160,000" }],
        },
        {
          RowType: "Section",
          Title: "Non-current Liabilities",
          Rows: [
            {
              RowType: "Row",
              Cells: [{ Value: "Bank Loan" }, { Value: "" }, { Value: "120,000" }],
            },
            {
              RowType: "SummaryRow",
              Cells: [
                { Value: "Total Non-current Liabilities" },
                { Value: "" },
                { Value: "120,000" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const pnl = parsePnl(pnlReport);
assert.equal(pnl.revenue, 125_000);
assert.equal(pnl.net_income, 95_000);
assert.equal(pnl.operating_expenses, 30_000);

const balanceSheet = parseBalanceSheet(balanceSheetReport);
assert.deepEqual(balanceSheet, {
  assets: 400_000,
  liabilities: 160_000,
  debt: 120_000,
});

const accounts = extractXeroMappedAccounts({
  report: pnlReport,
  year: 2025,
  statement: "profit_and_loss",
});
assert.equal(accounts.length, 2);
assert.equal(accounts[0].sourceAccountName, "Service Revenue");
assert.equal(accounts[0].amount, 125_000);
assert.equal(accounts[0].normalizedField, "revenue");
assert.equal(accounts[1].sourceAccountName, "Wages");
assert.equal(accounts[1].amount, -30_000);
assert.equal(accounts[1].normalizedField, "payroll");

console.log("xero import tests passed");
