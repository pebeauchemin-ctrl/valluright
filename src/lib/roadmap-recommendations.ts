import { supabase } from "@/integrations/supabase/client";

export type RoadmapRecommendationInput = {
  actionSteps: string[];
  buyerConcern: string;
  category: string;
  description: string;
  impactHigh: number;
  impactLow: number;
  key: string;
  timeRequired: string;
  title: string;
};

export type RoadmapScenarioLink = {
  id: string;
  recommendationKey: string;
};

const DEFAULT_ROADMAP_PHASE = "Next 90 Days";

function recommendationValueDelta(recommendation: RoadmapRecommendationInput) {
  return Math.round((recommendation.impactLow + recommendation.impactHigh) / 2);
}

export async function loadRoadmapRecommendationLinks(businessId: string) {
  const { data, error } = await supabase
    .from("scenarios")
    .select("id,name")
    .eq("business_id", businessId);
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, title: row.name }));
}

export async function addRecommendationToRoadmap({
  businessId,
  recommendation,
}: {
  businessId: string;
  recommendation: RoadmapRecommendationInput;
}) {
  const { data: existing, error: existingError } = await supabase
    .from("scenarios")
    .select("id")
    .eq("business_id", businessId)
    .eq("name", recommendation.title)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.id) return existing.id;

  const valueDelta = recommendationValueDelta(recommendation);
  const { data, error } = await supabase
    .from("scenarios")
    .insert({
      action_steps: recommendation.actionSteps,
      business_id: businessId,
      current_value: null,
      description: `${recommendation.description}\n\nBuyer concern: ${recommendation.buyerConcern}`,
      include_in_report: false,
      name: recommendation.title,
      projected_value: null,
      roadmap_phase: DEFAULT_ROADMAP_PHASE,
      timeline_months: null,
      value_delta: valueDelta,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function removeRecommendationFromRoadmap({
  businessId,
  scenarioId,
  title,
}: {
  businessId: string;
  scenarioId?: string;
  title: string;
}) {
  const { error } = scenarioId
    ? await supabase.from("scenarios").delete().eq("business_id", businessId).eq("id", scenarioId)
    : await supabase.from("scenarios").delete().eq("business_id", businessId).eq("name", title);
  if (error) throw error;
}
