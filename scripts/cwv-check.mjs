#!/usr/bin/env node
// Core Web Vitals lab check for key growth URLs (REB-165).
// Runs Lighthouse (mobile) per URL and fails if a metric is in Google's "poor" band.
// INP is a field metric; Lighthouse lab uses Total Blocking Time (TBT) as its proxy.
// Usage: node scripts/cwv-check.mjs [baseUrl]   (default https://valuright.ai)
// Needs Chrome installed; uses `npx lighthouse@12`.
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = (process.argv[2] ?? "https://valuright.ai").replace(/\/$/, "");
const PATHS = [
  "/",
  "/what-is-my-business-worth",
  "/what-is-my-hvac-business-worth",
  "/guides/sde-explained",
  "/guides/how-to-value-a-small-business",
  "/demo",
  "/pricing",
  "/auth",
];
// "Poor" thresholds: LCP > 4s, CLS > 0.25, TBT > 600ms.
const BUDGET = { lcpMs: 4000, cls: 0.25, tbtMs: 600 };

const dir = mkdtempSync(join(tmpdir(), "cwv-"));
let failures = 0;
console.log("path | LCP | CLS | TBT | perf score");
for (const path of PATHS) {
  const out = join(dir, "lh.json");
  try {
    execFileSync(
      "npx",
      [
        "-y",
        "lighthouse@12",
        base + path,
        "--only-categories=performance",
        "--form-factor=mobile",
        "--quiet",
        "--output=json",
        `--output-path=${out}`,
        "--chrome-flags=--headless=new --no-sandbox",
      ],
      { stdio: "ignore", timeout: 180_000 },
    );
  } catch {
    console.log(`${path} | lighthouse failed`);
    failures++;
    continue;
  }
  const lh = JSON.parse(readFileSync(out, "utf8"));
  const a = lh.audits;
  const lcp = a["largest-contentful-paint"].numericValue;
  const cls = a["cumulative-layout-shift"].numericValue;
  const tbt = a["total-blocking-time"].numericValue;
  const bad = lcp > BUDGET.lcpMs || cls > BUDGET.cls || tbt > BUDGET.tbtMs;
  if (bad) failures++;
  console.log(
    `${path} | ${(lcp / 1000).toFixed(1)}s | ${cls.toFixed(3)} | ${Math.round(tbt)}ms | ${Math.round(lh.categories.performance.score * 100)}${bad ? " | POOR" : ""}`,
  );
}
process.exit(failures ? 1 : 0);
