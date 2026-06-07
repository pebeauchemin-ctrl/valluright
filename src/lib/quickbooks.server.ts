const QUICKBOOKS_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QUICKBOOKS_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QUICKBOOKS_SCOPE = "com.intuit.quickbooks.accounting";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  x_refresh_token_expires_in?: number;
};

export type QuickBooksCompanyInfo = {
  companyName: string | null;
};

export function getQuickBooksCreds() {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "QuickBooks is not configured. Missing QUICKBOOKS_CLIENT_ID or QUICKBOOKS_CLIENT_SECRET.",
    );
  }
  return { clientId, clientSecret };
}

export function getQuickBooksApiBase() {
  return process.env.QUICKBOOKS_ENVIRONMENT === "sandbox"
    ? "https://sandbox-quickbooks.api.intuit.com"
    : "https://quickbooks.api.intuit.com";
}

export function buildQuickBooksAuthorizeUrl(opts: { state: string; redirectUri: string }) {
  const { clientId } = getQuickBooksCreds();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: QUICKBOOKS_SCOPE,
    redirect_uri: opts.redirectUri,
    state: opts.state,
  });
  return `${QUICKBOOKS_AUTH_URL}?${params.toString()}`;
}

function basicAuthHeader() {
  const { clientId, clientSecret } = getQuickBooksCreds();
  return `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
}

export async function exchangeQuickBooksCodeForToken(
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const res = await fetch(QUICKBOOKS_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`QuickBooks token exchange failed [${res.status}]`);
  return res.json() as Promise<TokenResponse>;
}

export async function refreshQuickBooksAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(QUICKBOOKS_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`QuickBooks token refresh failed [${res.status}]`);
  return res.json() as Promise<TokenResponse>;
}

export async function fetchQuickBooksCompanyInfo(opts: {
  accessToken: string;
  realmId: string;
}): Promise<QuickBooksCompanyInfo> {
  const url = `${getQuickBooksApiBase()}/v3/company/${opts.realmId}/companyinfo/${opts.realmId}?minorversion=75`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`QuickBooks company info failed [${res.status}]`);
  const json = (await res.json()) as { CompanyInfo?: { CompanyName?: string } };
  return { companyName: json.CompanyInfo?.CompanyName ?? null };
}
