import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

type PackageJson = {
  scripts?: Record<string, string>;
};

test("every src/lib test file is wired into npm test", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as PackageJson;
  const scripts = pkg.scripts ?? {};
  const testFiles = readdirSync("src/lib").filter((name) => name.endsWith(".test.ts"));
  const testScripts = Object.entries(scripts).filter(([name]) => name.startsWith("test:"));
  const aggregate = scripts.test ?? "";

  const unwiredFiles = testFiles.filter(
    (file) => !testScripts.some(([, command]) => command.includes(`src/lib/${file}`)),
  );
  const omittedScripts = testScripts
    .map(([name]) => name)
    .filter((name) => !aggregate.includes(`npm run ${name}`));

  assert.deepEqual(unwiredFiles, [], `Test files missing a test script: ${unwiredFiles.join(", ")}`);
  assert.deepEqual(omittedScripts, [], `Test scripts omitted from npm test: ${omittedScripts.join(", ")}`);
});
