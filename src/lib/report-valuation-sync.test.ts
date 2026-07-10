import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const reports = read("src/routes/app.reports.tsx");
const packageJson = read("package.json");

assert(
  reports.includes("toBusinessInputs(biz, financials, multipleAssumptions)") &&
    reports.includes("valueBusiness(inputs)") &&
    reports.includes("computeHealthScore(inputs)"),
  "Reports must recompute valuation and health from current inputs",
);

assert(
  reports.includes("Reports use the live recomputed valuation now"),
  "Reports page must disclose live recomputed valuation source",
);

assert(
  reports.includes("Save current valuation snapshot"),
  "Reports page must let users refresh the saved valuation snapshot before export",
);

assert(
  !reports.includes("latest saved valuation snapshot"),
  "Reports must not claim the saved valuation snapshot drives the report preview",
);

assert(
  packageJson.includes("test:report-valuation-sync"),
  "Report valuation sync test must be wired into package scripts",
);

console.log("report valuation sync checks passed");
