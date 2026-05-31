import { createFileRoute } from "@tanstack/react-router";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security - ValuRight.ai" },
      {
        name: "description",
        content:
          "ValuRight.ai security posture for business financial data, storage, and buyer-safe sharing.",
      },
    ],
  }),
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <PublicPageShell
      eyebrow="Security"
      title="Security posture"
      description="ValuRight.ai is built around owner-controlled sharing, private financial data, and limited public exposure for buyer-safe materials."
      updated="May 27, 2026"
    >
      <LegalSection title="Private by default">
        <p>
          Business records, financial inputs, valuation outputs, advisor review
          materials, and data room documents are intended to be private by
          default and available only to authenticated users with appropriate
          access.
        </p>
      </LegalSection>

      <LegalSection title="Buyer-safe sharing">
        <p>
          Public teaser pages are designed to expose only owner-approved,
          buyer-safe fields. Full financial detail, uploaded documents, and
          sensitive company records should remain behind authenticated access and
          owner-controlled permissions.
        </p>
      </LegalSection>

      <LegalSection title="Accounting connections">
        <p>
          Accounting integrations should use provider OAuth flows and minimum
          practical scopes. Tokens and imported financial data should be handled
          as sensitive business information.
        </p>
      </LegalSection>

      <LegalSection title="Storage and access controls">
        <p>
          Financial documents and data room files should use private storage
          policies. Database access should enforce account ownership, advisor
          permissions, and buyer-view limitations at the server or database
          layer.
        </p>
      </LegalSection>

      <LegalSection title="Responsible reporting">
        <p>
          If you believe you have found a security issue, do not access,
          download, modify, or share data that is not yours. Report the issue
          through the support contact listed in your account or onboarding
          materials.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
