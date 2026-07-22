import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assertIncludes(path: string, expected: string, message: string) {
  assert(read(path).includes(expected), `${message}: ${path}`);
}

const appLayout = "src/routes/app.tsx";
const styles = "src/styles.css";
const accessibleChart = "src/components/AccessibleChart.tsx";
const buyerTeaser = "src/routes/app.buyer-teaser.tsx";
const dataRoom = "src/routes/app.data-room.tsx";
const financials = "src/routes/app.financials.tsx";
const publicTeaser = "src/routes/teaser.$publicId.tsx";
const roadmap = "src/routes/app.roadmap.tsx";
const scenarios = "src/routes/app.scenarios.tsx";
const chartRoutes = [
  "src/routes/app.index.tsx",
  "src/routes/app.health-score.tsx",
  "src/routes/teaser.$publicId.tsx",
];

assertIncludes(styles, ":focus-visible", "Global keyboard focus style is required");
assertIncludes(styles, ".skip-link", "Skip-link style is required");
assertIncludes(styles, ".sr-only", "Screen-reader-only utility is required");

assertIncludes(appLayout, "Skip to main content", "App layout must expose a skip link");
assertIncludes(appLayout, 'aria-label="Application sections"', "App navigation must be labelled");
assertIncludes(
  appLayout,
  'aria-current={active ? "page" : undefined}',
  "Active nav item must be announced",
);
assertIncludes(appLayout, "aria-expanded={businessMenuOpen}", "Business switcher must expose menu state");
assertIncludes(appLayout, 'role="menu"', "Business switcher menu must expose menu semantics");
assertIncludes(appLayout, 'id="main-content"', "Main content landmark must be targetable");

assertIncludes(
  accessibleChart,
  'role="img"',
  "Accessible chart wrapper must expose image semantics",
);
assertIncludes(
  accessibleChart,
  "aria-describedby",
  "Accessible chart wrapper must expose a text summary",
);
assertIncludes(
  accessibleChart,
  "tabIndex={0}",
  "Accessible chart wrapper must be keyboard-focusable",
);
assertIncludes(accessibleChart, "useId", "Accessible chart ids must be unique per render");

for (const field of [
  "buyer-name",
  "buyer-email",
  "buyer-phone",
  "buyer-type",
  "buyer-financing",
  "buyer-message",
]) {
  assertIncludes(publicTeaser, `htmlFor="${field}"`, `Public lead field must have a label`);
  assertIncludes(publicTeaser, `id="${field}"`, `Public lead field must be associated to its label`);
}

assertIncludes(financials, "Remove financial year", "Financial year delete button must be named");
assertIncludes(financials, 'aria-label={`${label} for ${y.year}`}', "Financial grid cells must be named");
assertIncludes(scenarios, "htmlFor={inputId}", "Scenario sliders must be labelled");
assertIncludes(dataRoom, 'aria-label="Data room upload category"', "Data room category select must be named");
assertIncludes(dataRoom, "Download ${f.filename}", "Data room download button must be named");
assertIncludes(dataRoom, "Delete ${f.filename}", "Data room delete button must be named");
assertIncludes(buyerTeaser, 'aria-label="Copy public teaser link"', "Buyer teaser copy button must be named");
assertIncludes(
  buyerTeaser,
  'aria-label="Open public teaser link in a new tab"',
  "Buyer teaser external link icon must be named",
);
assertIncludes(roadmap, "Move ${r.name} to roadmap phase", "Roadmap phase select must be named");

for (const route of chartRoutes) {
  const source = read(route);
  assert(
    source.includes("AccessibleChart"),
    `Route with Recharts usage must wrap charts with AccessibleChart: ${route}`,
  );
  assert(
    !source.includes("<ResponsiveContainer") ||
      source.includes("summary={") ||
      source.includes("summary="),
    `Chart route must include a screen-reader summary: ${route}`,
  );
}

console.log("Accessibility baseline checks passed.");
