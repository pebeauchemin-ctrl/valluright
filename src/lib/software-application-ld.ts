import { COMMERCIAL_PLANS, FREE_TRIAL_LIMITS } from "@/lib/commercial-model";
import { buildSoftwareApplicationNode } from "@/lib/site-entity";

/** SoftwareApplication node for / and /pricing, priced from COMMERCIAL_PLANS. */
export const SOFTWARE_APPLICATION_NODE = buildSoftwareApplicationNode(
  COMMERCIAL_PLANS,
  FREE_TRIAL_LIMITS.name,
);
