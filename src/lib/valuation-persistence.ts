import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { BusinessInputs, HealthBreakdown, MethodResult, Valuation } from "@/lib/valuation";

type ValuationInsert = Database["public"]["Tables"]["valuations"]["Insert"];
type JsonValue = ValuationInsert["inputs_snapshot"];
type MethodResultInsert = Database["public"]["Tables"]["valuation_method_results"]["Insert"];

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


export function buildValuationMethodResultInserts(
  businessId: string,
  valuationId: string,
  valuation: Valuation,
): MethodResultInsert[] {
  return valuation.methods
    .filter((method) => method.available)
    .map((method) => ({
      business_id: businessId,
      valuation_id: valuationId,
      method: method.method,
      value_mid: method.value,
      value_low: method.low,
      value_high: method.high,
      multiple_or_rate: method.capRateUsed ?? method.multipleUsed ?? null,
      weight: valuation.weights[method.method] ?? 0,
      is_selected: (valuation.weights[method.method] ?? 0) > 0,
      notes: method.notes || null,
      details: {
        label: method.label,
        input_used: method.inputUsed ?? null,
        input_label: method.inputLabel ?? null,
        confidence: method.confidence,
        formula: method.formula ?? null,
        reasoning: method.reasoning ?? null,
        multiple_source: method.multipleSource ?? null,
        multiple_notes: method.multipleNotes ?? null,
        multiple_confidence: method.multipleConfidence ?? null,
        warning: method.warning ?? null,
        role: method.role ?? null,
        cap_rate_used: method.capRateUsed ?? null,
        cap_rate_low: method.capRateLow ?? null,
        cap_rate_high: method.capRateHigh ?? null,
        noi: method.noi ?? null,
        enterprise_value: method.enterpriseValue ?? null,
        debt: method.debt ?? null,
        equity_value: method.equityValue ?? null,
      } as unknown as JsonValue,
    }));
}

export async function persistValuationSnapshot(
  supabase: SupabaseClient<Database>,
  businessId: string,
  inputs: BusinessInputs,
  valuation: Valuation,
  health: HealthResult,
) {
  const { data: savedValuation, error: valuationError } = await supabase
    .from("valuations")
    .insert(buildValuationInsert(businessId, inputs, valuation, health))
    .select("id")
    .single();

  if (valuationError) throw valuationError;

  const methodResults = buildValuationMethodResultInserts(
    businessId,
    savedValuation.id,
    valuation,
  );

  if (methodResults.length === 0) return savedValuation;

  const { error: methodResultsError } = await supabase
    .from("valuation_method_results")
    .insert(methodResults);

  if (methodResultsError) throw methodResultsError;
  return savedValuation;
}
