import type { Database } from "@/integrations/supabase/types";
import type { BusinessInputs, HealthBreakdown, MethodResult, Valuation } from "@/lib/valuation";

type ValuationInsert = Database["public"]["Tables"]["valuations"]["Insert"];
type JsonValue = ValuationInsert["inputs_snapshot"];

type HealthResult = {
  total: number;
  breakdown: HealthBreakdown;
};

export function buildValuationInsert(
  businessId: string,
  inputs: BusinessInputs,
  valuation: Valuation,
  health: HealthResult,
): ValuationInsert {
  const findMethod = (method: MethodResult["method"]) =>
    valuation.methods.find((m) => m.method === method);

  return {
    business_id: businessId,
    range_low: valuation.rangeLow,
    range_mid: valuation.rangeMid,
    range_high: valuation.rangeHigh,
    sde_value: findMethod("sde")?.value ?? null,
    sde_low: findMethod("sde")?.low ?? null,
    sde_high: findMethod("sde")?.high ?? null,
    ebitda_value: findMethod("ebitda")?.value ?? null,
    ebitda_low: findMethod("ebitda")?.low ?? null,
    ebitda_high: findMethod("ebitda")?.high ?? null,
    revenue_value: findMethod("revenue")?.value ?? null,
    revenue_low: findMethod("revenue")?.low ?? null,
    revenue_high: findMethod("revenue")?.high ?? null,
    dcf_value: findMethod("dcf")?.value ?? null,
    dcf_low: findMethod("dcf")?.low ?? null,
    dcf_high: findMethod("dcf")?.high ?? null,
    asset_value: findMethod("asset")?.value ?? null,
    asset_low: findMethod("asset")?.low ?? null,
    asset_high: findMethod("asset")?.high ?? null,
    comparable_value: findMethod("comparable")?.value ?? null,
    health_score: health.total,
    health_breakdown: health.breakdown as unknown as JsonValue,
    inputs_snapshot: inputs as unknown as JsonValue,
  };
}
