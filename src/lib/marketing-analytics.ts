/**
 * Marketing funnel events for GTM (REB-110).
 * Names are CMO/Leader-locked. Keep separate from product-analytics.ts.
 * Never push PII (email, name, phone, tokens, passwords).
 */

export const MARKETING_FUNNEL_EVENTS = [
  "signup_start",
  "signup_complete",
  "demo_click",
  "valuation_started",
  "valuation_result_viewed",
  "plan_viewed",
] as const;

export type MarketingFunnelEvent = (typeof MARKETING_FUNNEL_EVENTS)[number];

export const GTM_CONTAINER_ID = "GTM-P2WWZ59B";

/** Inline GTM bootstrap for <head> (standard Google snippet). */
export const GTM_HEAD_SCRIPT = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');`;

type SafeParamValue = string | number | boolean | null;
type SafeParams = Record<string, SafeParamValue | undefined>;

const PII_KEY = /^(email|password|full.?name|name|phone|token|authorization|ssn)$/i;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

function sanitizeParams(params?: SafeParams): Record<string, SafeParamValue> {
  if (!params) return {};
  const out: Record<string, SafeParamValue> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (PII_KEY.test(key)) continue;
    out[key] = value;
  }
  return out;
}

/** Suppress duplicate pushes of the same event within 1s (click + route mount). */
let lastPush: { name: string; at: number } | null = null;

/** Push a marketing event to window.dataLayer (GTM). SSR-safe. */
export function pushMarketingEvent(name: MarketingFunnelEvent, params?: SafeParams): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (lastPush && lastPush.name === name && now - lastPush.at < 1000) return;
  lastPush = { name, at: now };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...sanitizeParams(params) });
}

const memoryOnce = new Set<string>();

function claimOnce(storageKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = `vr_mkt_${storageKey}`;
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    if (memoryOnce.has(storageKey)) return false;
    memoryOnce.add(storageKey);
    return true;
  }
}

/** Primary signup CTA click or opening signup UI. */
export function trackSignupStart(): void {
  pushMarketingEvent("signup_start");
}

/** Free Preview (or paid) account created successfully — no PII. */
export function trackSignupComplete(params?: { plan?: string | null }): void {
  pushMarketingEvent("signup_complete", {
    plan: params?.plan ?? "free_preview",
  });
}

/** Click / navigation intent toward /demo. */
export function trackDemoClick(): void {
  pushMarketingEvent("demo_click");
}

/** First Free Preview wizard step after auth — once per browser session. */
export function trackValuationStarted(): void {
  if (!claimOnce("valuation_started")) return;
  pushMarketingEvent("valuation_started");
}

/** Planning-range / results screen first viewed — once per browser session. */
export function trackValuationResultViewed(): void {
  if (!claimOnce("valuation_result_viewed")) return;
  pushMarketingEvent("valuation_result_viewed");
}

/** /pricing page view. */
export function trackPlanViewed(): void {
  pushMarketingEvent("plan_viewed");
}
