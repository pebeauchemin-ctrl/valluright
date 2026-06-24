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
