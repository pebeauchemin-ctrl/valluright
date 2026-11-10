const APEX_HOST = "valuright.ai";
const WWW_HOST = "www.valuright.ai";

/**
 * One-hop 301 for GET/HEAD requests on a non-canonical URL: www.valuright.ai goes to the https
 * apex, and a trailing slash is dropped. Returns null when the URL is already canonical.
 * Other hosts (lovable.app previews, localhost) only get the trailing-slash rule, as a
 * relative Location, so they never bounce to production.
 */
export function canonicalRedirect(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  const isWww = url.hostname === WWW_HOST;
  const hasTrailingSlash = url.pathname.length > 1 && url.pathname.endsWith("/");
  if (!isWww && !hasTrailingSlash) return null;

  const path = url.pathname.replace(/\/+$/, "").replace(/^\/+/, "/") || "/";
  const location = isWww ? `https://${APEX_HOST}${path}${url.search}` : `${path}${url.search}`;
  return new Response(null, { status: 301, headers: { location } });
}
