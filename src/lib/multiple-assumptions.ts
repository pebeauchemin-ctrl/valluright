import type { MultipleAssumption } from "@/lib/valuation";

export function normalizeMultipleAssumptions(rows: unknown): MultipleAssumption[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => row as Record<string, unknown>)
    .filter((row) => typeof row.slug === "string" && typeof row.industry === "string")
    .map((row) => ({
      slug: String(row.slug),
      industry: String(row.industry),
      business_category: typeof row.business_category === "string" ? row.business_category : "any",
      revenue_min: row.revenue_min == null ? null : Number(row.revenue_min),
      revenue_max: row.revenue_max == null ? null : Number(row.revenue_max),
      owner_dependence: typeof row.owner_dependence === "string" ? row.owner_dependence : "any",
      confidence_level:
        row.confidence_level === "low" || row.confidence_level === "high"
          ? row.confidence_level
          : "medium",
      sde_low: Number(row.sde_low),
      sde_mid: Number(row.sde_mid),
      sde_high: Number(row.sde_high),
      ebitda_low: Number(row.ebitda_low),
      ebitda_mid: Number(row.ebitda_mid),
      ebitda_high: Number(row.ebitda_high),
      revenue_low: Number(row.revenue_low),
      revenue_mid: Number(row.revenue_mid),
      revenue_high: Number(row.revenue_high),
      source_label: String(row.source_label ?? "Configured assumption"),
      source_notes: String(row.source_notes ?? "Configured planning assumption."),
      active: row.active !== false,
    }))
    .filter(
      (row) =>
        Number.isFinite(row.sde_low) &&
        Number.isFinite(row.sde_mid) &&
        Number.isFinite(row.sde_high) &&
        Number.isFinite(row.ebitda_low) &&
        Number.isFinite(row.ebitda_mid) &&
        Number.isFinite(row.ebitda_high) &&
        Number.isFinite(row.revenue_low) &&
        Number.isFinite(row.revenue_mid) &&
        Number.isFinite(row.revenue_high),
    ) as MultipleAssumption[];
}
