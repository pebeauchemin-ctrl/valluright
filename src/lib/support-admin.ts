export type SupportOnboardingStatus = {
  hasBusinessProfile: boolean;
  financialYearCount: number;
  hasValuation: boolean;
  buyerTeaserPublished: boolean;
  reportCount: number;
  advisorInviteCount: number;
  dataRoomFileCount: number;
};

export type SupportMetadataValue = string | number | boolean | null | string[];

export type SupportImportStatus = {
  source: string | null;
  status: string | null;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  warningCount: number;
  retryAction: string | null;
  reportNames: string[];
  metadata: Record<string, SupportMetadataValue>;
};

export type SupportConnectionStatus = {
  xeroCount: number;
  quickBooksCount: number;
  lastXeroSyncAt: string | null;
  lastQuickBooksSyncAt: string | null;
};

export type SupportEventSummary = {
  eventName: string;
  area: string;
  severity: string;
  createdAt: string;
  metadata: Record<string, SupportMetadataValue>;
};

export type SupportAccountSummary = {
  userId: string;
  email: string | null;
  fullName: string | null;
  company: string | null;
  businessId: string | null;
  businessName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  onboarding: SupportOnboardingStatus;
  lastValuationRunAt: string | null;
  importStatus: SupportImportStatus | null;
  connections: SupportConnectionStatus;
  recentEvents: SupportEventSummary[];
};

export const SUPPORT_ADMIN_NOTICE =
  "Support view intentionally hides financial values, buyer PII, OAuth tokens, and raw import data.";

export const SUPPORT_ACTIONS = [
  {
    title: "Resend invite",
    body: "Confirm the recipient and business first, then resend from the advisor workflow or send a manual invite email. Do not expose financial details in the email.",
  },
  {
    title: "Reset import connection",
    body: "Ask the user to reconnect Xero or QuickBooks from Financials. Only remove a server-side connection after explicit user authorization.",
  },
  {
    title: "Inspect failed import",
    body: "Use the latest import status, source, error message, warning count, and safe metadata. Do not download or inspect raw uploaded financial files unless authorized.",
  },
  {
    title: "Deactivate account",
    body: "Require a written request and identity check. Disable access first; export or preserve records before deleting any business data.",
  },
] as const;

const SENSITIVE_METADATA_KEYS = new Set([
  "access_token",
  "refresh_token",
  "token",
  "authorization",
  "password",
  "secret",
  "client_secret",
  "email",
  "phone",
  "revenue",
  "net_income",
  "ebitda",
  "sde",
  "valuation",
]);

export function sanitizeSupportMetadata(value: unknown): Record<string, SupportMetadataValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const safeEntries = Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !SENSITIVE_METADATA_KEYS.has(key.toLowerCase()))
    .slice(0, 12)
    .map(([key, raw]): [string, SupportMetadataValue] => {
      if (
        raw === null ||
        typeof raw === "string" ||
        typeof raw === "number" ||
        typeof raw === "boolean"
      ) {
        return [key, raw];
      }
      if (Array.isArray(raw)) return [key, raw.slice(0, 5).map((item) => String(item))];
      return [key, "[object]"];
    });

  return Object.fromEntries(safeEntries);
}

export function buildOnboardingStatus(input: {
  hasBusinessProfile: boolean;
  financialYearCount: number;
  hasValuation: boolean;
  buyerTeaserPublished: boolean;
  reportCount: number;
  advisorInviteCount: number;
  dataRoomFileCount: number;
}): SupportOnboardingStatus {
  return {
    hasBusinessProfile: input.hasBusinessProfile,
    financialYearCount: Math.max(0, input.financialYearCount),
    hasValuation: input.hasValuation,
    buyerTeaserPublished: input.buyerTeaserPublished,
    reportCount: Math.max(0, input.reportCount),
    advisorInviteCount: Math.max(0, input.advisorInviteCount),
    dataRoomFileCount: Math.max(0, input.dataRoomFileCount),
  };
}
