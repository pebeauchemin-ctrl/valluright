import assert from "node:assert/strict";
import {
  buildQuickBooksAuthorizeUrl,
  getQuickBooksApiBase,
} from "./quickbooks.server";

process.env.QUICKBOOKS_CLIENT_ID = "client-id";
process.env.QUICKBOOKS_CLIENT_SECRET = "client-secret";

const authUrl = new URL(
  buildQuickBooksAuthorizeUrl({
    state: "state-123",
    redirectUri: "https://valuright.ai/api/public/quickbooks/callback",
  }),
);

assert.equal(authUrl.origin + authUrl.pathname, "https://appcenter.intuit.com/connect/oauth2");
assert.equal(authUrl.searchParams.get("client_id"), "client-id");
assert.equal(authUrl.searchParams.get("response_type"), "code");
assert.equal(authUrl.searchParams.get("scope"), "com.intuit.quickbooks.accounting");
assert.equal(
  authUrl.searchParams.get("redirect_uri"),
  "https://valuright.ai/api/public/quickbooks/callback",
);
assert.equal(authUrl.searchParams.get("state"), "state-123");

process.env.QUICKBOOKS_ENVIRONMENT = "sandbox";
assert.equal(getQuickBooksApiBase(), "https://sandbox-quickbooks.api.intuit.com");
process.env.QUICKBOOKS_ENVIRONMENT = "production";
assert.equal(getQuickBooksApiBase(), "https://quickbooks.api.intuit.com");

console.log("quickbooks oauth tests passed");
