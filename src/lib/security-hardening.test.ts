import { readFileSync } from "node:fs";
import { decryptToken, encryptToken, isEncryptedToken } from "./token-crypto.server";

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

process.env.TOKEN_ENCRYPTION_KEY = "test-token-encryption-key-32-chars-minimum";
delete process.env.XERO_TOKEN_ENCRYPTION_KEY;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

const plaintext = "oauth-refresh-token";
const encrypted = await encryptToken(plaintext);

assert(isEncryptedToken(encrypted), "New encrypted tokens must be detected as encrypted");
assert(encrypted.startsWith("enc:v2:"), "New encrypted tokens must use the HKDF-backed v2 prefix");
assert((await decryptToken(encrypted)) === plaintext, "Encrypted token must round-trip");

process.env.TOKEN_ENCRYPTION_KEY = "different-token-encryption-key-32-chars-minimum";
try {
  await decryptToken(encrypted);
  throw new Error("Decrypting with the wrong token key should fail");
} catch (error) {
  assert(
    error instanceof Error &&
      error.message.includes("Disconnect and reconnect the accounting integration"),
    "Wrong-key decrypt failures must produce a reconnect-required message",
  );
}
process.env.TOKEN_ENCRYPTION_KEY = "test-token-encryption-key-32-chars-minimum";

assertIncludes(
  ".gitignore",
  ".env",
  "Raw environment files must stay ignored",
);
assertIncludes(
  ".env.example",
  "TOKEN_ENCRYPTION_KEY=",
  "Environment example must document the dedicated token key",
);
assertIncludes(
  "src/integrations/supabase/client.ts",
  "FALLBACK_SUPABASE_URL",
  "Client Supabase bootstrap must keep the Lovable Cloud public fallback",
);
assertIncludes(
  "src/integrations/supabase/auth-middleware.ts",
  "FALLBACK_SUPABASE_PUBLISHABLE_KEY",
  "Authenticated server functions must keep the public Supabase fallback",
);
assertIncludes(
  "docs/security-hardening.md",
  "Buyer Lead Spam Mitigation",
  "Lead spam mitigation must be documented",
);
assertIncludes(
  "src/lib/token-crypto.server.ts",
  "TOKEN_ENCRYPTION_KEY is required",
  "Token crypto must fail closed without a dedicated key",
);
assertIncludes(
  "src/lib/token-crypto.server.ts",
  'name: "HKDF"',
  "Token crypto must use HKDF",
);
assertNotIncludes(
  "src/lib/token-crypto.server.ts",
  "SUPABASE_SERVICE_ROLE_KEY",
  "Token crypto must not fall back to the Supabase service-role key",
);
assertIncludes(
  "src/lib/observability.functions.ts",
  "resolveOwnedBusinessId",
  "Product analytics writes must ownership-check business IDs",
);
assertIncludes(
  "src/lib/observability.functions.ts",
  '.eq("owner_id", userId)',
  "Product analytics business IDs must be scoped to the authenticated owner",
);

console.log("Security hardening checks passed.");
