import assert from "node:assert/strict";
import { canonicalRedirect } from "./canonical-redirect";

const redirect = (url: string, method = "GET") => {
  const res = canonicalRedirect(new Request(url, { method }));
  return res && { status: res.status, location: res.headers.get("location") };
};

assert.equal(redirect("https://valuright.ai/"), null, "apex root is canonical");
assert.equal(redirect("https://valuright.ai/pricing"), null, "apex path is canonical");
assert.equal(redirect("https://valuright.ai/pricing?plan=essentials"), null);

assert.deepEqual(redirect("https://valuright.ai/pricing/"), { status: 301, location: "/pricing" });
assert.deepEqual(redirect("https://valuright.ai/guides/sde-explained/?a=1"), {
  status: 301,
  location: "/guides/sde-explained?a=1",
});
assert.deepEqual(
  redirect("https://valuright.ai//evil.example/"),
  {
    status: 301,
    location: "/evil.example",
  },
  "never emits a protocol-relative Location",
);

assert.deepEqual(redirect("https://www.valuright.ai/"), {
  status: 301,
  location: "https://valuright.ai/",
});
assert.deepEqual(
  redirect("http://www.valuright.ai/pricing/"),
  {
    status: 301,
    location: "https://valuright.ai/pricing",
  },
  "www plus trailing slash is one hop",
);
assert.deepEqual(redirect("https://www.valuright.ai/pricing?x=1", "HEAD"), {
  status: 301,
  location: "https://valuright.ai/pricing?x=1",
});

assert.equal(
  redirect("https://valuright.ai/pricing/", "POST"),
  null,
  "non-GET requests pass through",
);
assert.equal(redirect("https://x.lovable.app/pricing"), null);
assert.deepEqual(redirect("http://localhost:5173/pricing/"), { status: 301, location: "/pricing" });

console.log("canonical-redirect tests passed");
