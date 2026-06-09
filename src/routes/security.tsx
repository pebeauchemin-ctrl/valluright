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
      updated="June 8, 2026"
    >
      <LegalSection title="Private by default">
        <p>
          Business records, financial inputs, valuation outputs, advisor review
          materials, and data room documents are intended to be private by
          default and available only to authenticated users with appropriate
          access.
        </p>
        <p>
          Database policies and server-side checks should scope access to the business owner,
          authorized advisors, and approved buyer workflows. Public access should be limited to
          explicit buyer-safe teaser data selected by the owner.
        </p>
      </LegalSection>

      <LegalSection title="Buyer-safe sharing">
        <p>
          Public teaser pages are designed to expose only owner-approved,
          buyer-safe fields. Full financial detail, uploaded documents, and
          sensitive company records should remain behind authenticated access and
          owner-controlled permissions.
        </p>
        <p>
          Buyer request workflows are designed to collect buyer information before sensitive
          materials are shared. Owners should confirm confidentiality obligations before granting
          deeper access to financial statements, data room files, customer details, or operational
          records.
        </p>
      </LegalSection>

      <LegalSection title="Accounting connections">
        <p>
          Accounting integrations use provider OAuth flows. ValuRight.ai requests the practical
          scopes needed to import financial reports, connection metadata, and account-level data
          used for mapping and normalization.
        </p>
        <p>
          Connection tokens and imported financial data are handled as sensitive business
          information. Customers can revoke access through the accounting provider and supported
          product controls.
        </p>
      </LegalSection>

      <LegalSection title="Storage and access controls">
        <p>
          Financial documents and data room files should use private storage
          policies. Database access should enforce account ownership, advisor
          permissions, and buyer-view limitations at the server or database
          layer.
        </p>
        <p>
          The product includes audit records for sensitive actions such as accounting connection
          events, imports, file access changes, advisor access changes, and buyer request handling
          where those workflows are implemented.
        </p>
      </LegalSection>

      <LegalSection title="Data protection practices">
        <p>
          ValuRight.ai should use encrypted transport, managed authentication, private storage
          buckets for confidential files, token encryption for accounting credentials, least
          privilege database policies, and environment-specific secrets for integrations.
        </p>
        <p>
          Security reviews should include dependency updates, provider configuration checks,
          database policy review, API route review, and verification that public pages do not expose
          owner-private data.
        </p>
      </LegalSection>

      <LegalSection title="Customer responsibilities">
        <p>
          Customers should use strong account credentials, limit advisor and buyer access to people
          who need it, avoid uploading unnecessary sensitive personal data, review buyer-safe
          publishing settings before sharing a teaser, and revoke integrations or user access when
          no longer needed.
        </p>
      </LegalSection>

      <LegalSection title="Responsible reporting">
        <p>
          If you believe you have found a security issue, do not access,
          download, modify, or share data that is not yours. Report the issue
          through the support contact listed in your account or onboarding
          materials.
        </p>
        <p>
          This security posture page is a transparency summary, not a guarantee that a system is
          free from risk. It should be reviewed by counsel and security advisors before public
          launch claims are finalized.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
