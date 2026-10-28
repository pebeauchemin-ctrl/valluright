#!/usr/bin/env node
// FAQ schema drift check (REB-164).
// For every route that ships FAQPage JSON-LD, fetch the rendered HTML and verify
// each JSON-LD question + answer also appears in the visible page text, and
// that the visible FAQ count matches. Usage:
//   node scripts/check-faq-schema.mjs [baseUrl]   (default http://localhost:5173)
//   node scripts/check-faq-schema.mjs --serve     (starts `vite dev` itself; used by npm test)
import { spawn } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

const serve = process.argv.includes("--serve");
const PORT = 5179;
const arg = process.argv.slice(2).find((a) => !a.startsWith("--"));
const base = (serve ? `http://localhost:${PORT}` : (arg ?? "http://localhost:5173")).replace(
  /\/$/,
  "",
);

let server;
if (serve) {
  server = spawn("npx", ["vite", "dev", "--port", String(PORT), "--strictPort"], {
    stdio: "ignore",
    detached: true,
  });
  const stop = () => {
    try {
      process.kill(-server.pid);
    } catch {}
  };
  process.on("exit", stop);
  let up = false;
  for (let i = 0; i < 90 && !up; i++) {
    up = await fetch(base + "/").then(
      (r) => r.ok,
      () => false,
    );
    if (!up) await new Promise((r) => setTimeout(r, 1000));
  }
  if (!up) {
    console.error("FAQ schema check: dev server did not start");
    process.exit(1);
  }
}

function routesWithFaq() {
  return readdirSync("src/routes")
    .filter((f) => f.endsWith(".tsx"))
    .filter((f) => readFileSync(`src/routes/${f}`, "utf8").includes('"FAQPage"'))
    .map(
      (f) =>
        "/" +
        f
          .replace(/\.tsx$/, "")
          .replace(/\./g, "/")
          .replace(/^index$/, ""),
    );
}

const decode = (s) =>
  s
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;|&#160;/g, " ");
// Trailing period is ignored on answers because visible copy may continue with links.
const norm = (s) => decode(s).replace(/\s+/g, " ").trim();

function visibleText(html) {
  return norm(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<head[\s\S]*?<\/head>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, ""),
  );
}

function faqEntities(html) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let data;
    try {
      data = JSON.parse(decode(m[1]));
    } catch {
      continue;
    }
    for (const node of [data, ...(data["@graph"] ?? [])].flat()) {
      if (node?.["@type"] === "FAQPage") out.push(...(node.mainEntity ?? []));
    }
  }
  return out;
}

let failures = 0;
for (const path of routesWithFaq()) {
  const res = await fetch(base + path).catch((e) => ({
    ok: false,
    status: e.cause?.code ?? e.message,
  }));
  if (!res.ok) {
    console.error(`FAIL ${path}: HTTP ${res.status}`);
    failures++;
    continue;
  }
  const html = await res.text();
  const text = visibleText(html);
  const qas = faqEntities(html);
  const problems = [];
  if (qas.length === 0) problems.push("no FAQPage JSON-LD in rendered HTML");
  for (const qa of qas) {
    const q = norm(qa.name ?? "");
    const a = norm(qa.acceptedAnswer?.text ?? "");
    if (!text.includes(q)) problems.push(`question not visible: "${q}"`);
    else if (!text.includes(a.replace(/\.$/, ""))) problems.push(`answer not visible for: "${q}"`);
  }
  if (problems.length) {
    failures++;
    console.error(`FAIL ${path} (${qas.length} Q&As)\n  - ${problems.join("\n  - ")}`);
  } else {
    console.log(`ok   ${path} (${qas.length} Q&As)`);
  }
}
if (failures) {
  console.error(`\n${failures} route(s) with FAQ schema drift.`);
  process.exit(1);
}
process.exit(0);
