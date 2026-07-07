export function displayIndustryLabel(
  industry?: string | null,
  subIndustry?: string | null,
  fallback = "Confidential industry",
): string {
  if (isRvParkOrCampground(industry, subIndustry)) return "RV Park / Campground";

  const parts = [industry, subIndustry].filter(
    (part): part is string => typeof part === "string" && part.trim().length > 0,
  );
  return parts.length > 0 ? parts.join(" / ") : fallback;
}

function isRvParkOrCampground(industry?: string | null, subIndustry?: string | null): boolean {
  const text = `${industry ?? ""} ${subIndustry ?? ""}`.toLowerCase();
  return /rv park|campground/.test(text);
}
