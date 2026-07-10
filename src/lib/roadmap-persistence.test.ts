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

function assertNotIncludes(path: string, expected: string, message: string) {
  assert(!read(path).includes(expected), `${message}: ${path}`);
}

assertIncludes(
  "src/lib/roadmap-recommendations.ts",
  '.from("scenarios")',
  "Roadmap recommendations must persist to saved scenarios",
);
assertIncludes(
  "src/lib/roadmap-recommendations.ts",
  "addRecommendationToRoadmap",
  "Add-to-roadmap must use a shared persistent helper",
);
assertIncludes(
  "src/routes/app.improve-value.tsx",
  "addRecommendationToRoadmap",
  "Improve Value add-to-roadmap must persist",
);
assertIncludes(
  "src/routes/app.health-score.tsx",
  "addRecommendationToRoadmap",
  "Health Score add-to-roadmap must persist",
);
assertIncludes(
  "src/routes/app.roadmap.tsx",
  "Use the phase menu on each card",
  "Roadmap copy must match the dropdown interaction",
);
assertNotIncludes(
  "src/routes/app.roadmap.tsx",
  "Drag scenarios across phases",
  "Roadmap must not advertise unavailable drag-and-drop",
);

console.log("roadmap persistence checks passed");
