import { createFileRoute } from "@tanstack/react-router";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy - ValuRight.ai" },
      {
        name: "description",
        content: "How ValuRight.ai handles business, financial, account, and buyer-sharing data.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      description="ValuRight.ai works with sensitive business and financial information. This page explains what we collect, why we use it, and how customers can control it."
      updated="July 30, 2026"
    >
      <LegalSection title="Information we collect">
        <p>
          We collect account information such as name, email address, company name, login activity,
          and product settings. We also collect business profile details such as industry, location,
          employees, owner involvement, customer concentration, exit timeline, and other operating
          assumptions entered by a customer.
        </p>
        <p>
          We store financial inputs used by the valuation workflow, including revenue, cost of goods
          sold, operating expenses, owner compensation, add-backs, depreciation, amortization,
          interest, taxes, assets, liabilities, debt, valuation outputs, recommendations, scenarios,
          and report snapshots.
        </p>
        <p>
          If you upload documents to a data room, we collect file names, categories, file metadata,
          and the files themselves. If you invite advisors or receive buyer access requests, we
          collect the contact details and messages needed to manage those workflows.
        </p>
      </LegalSection>

      <LegalSection title="Accounting connections">
        <p>
          When you connect Xero, QuickBooks, or another accounting provider, ValuRight.ai uses the
          provider's OAuth authorization flow. We use the authorization you grant to import business
          financial reports and account-level data needed for valuation, normalization, and mapping
          review.
        </p>
        <p>
          Accounting connection tokens are treated as sensitive business credentials. We do not ask
          for consumer bank login credentials, and customers can revoke access through the
          accounting provider or supported in-app controls.
        </p>
      </LegalSection>

      <LegalSection title="How we use information">
        <p>
          We use customer information to provide valuation estimates, dashboards, reports, data room
          features, buyer-safe teaser pages, account support, accounting imports, advisor
          collaboration, buyer access workflows, product security, and service improvements.
        </p>
        <p>
          Valuation results depend on user-provided data and assumptions. Incorrect or incomplete
          inputs can materially affect outputs.
        </p>
      </LegalSection>

      <LegalSection title="Marketing communications and choices">
        <p>
          We send marketing emails only when a customer has chosen to receive them or when another
          valid legal basis applies. Marketing messages may include exit-planning education, product
          updates, and resources related to the customer’s use of ValuRight.ai.
        </p>
        <p>
          Customers can opt in during account creation, change their choice at any time in Settings,
          or use the unsubscribe link included in each marketing email. Unsubscribing from marketing
          does not stop necessary account, security, billing, password-reset, or advisor-invitation
          emails.
        </p>
      </LegalSection>

      <LegalSection title="Automation and AI-assisted processing">
        <p>
          ValuRight.ai may use software automation and AI-assisted workflows to normalize account
          names, identify missing or unusual inputs, draft explanations, summarize data quality
          issues, and generate recommendations or report text. These outputs are not professional
          advice and should be reviewed by the customer and qualified advisors.
        </p>
      </LegalSection>

      <LegalSection title="Sharing and buyer-safe pages">
        <p>
          We do not publish private business data by default. Buyer teaser pages are designed to
          expose only the fields an owner chooses to publish. Data room files and full financial
          detail are intended to remain private unless access is granted by the owner.
        </p>
        <p>
          Advisor access, buyer requests, and data room access are designed around owner-controlled
          permissions. Customers are responsible for choosing what to publish, what to share, and
          whether a recipient should receive sensitive information.
        </p>
      </LegalSection>

      <LegalSection title="Retention and deletion">
        <p>
          We retain account and business records while an account is active or as needed to provide
          the service, comply with legal obligations, and maintain security records. Customers may
          request deletion of account data, subject to legal, security, and backup limitations.
        </p>
        <p>
          Deleted records may remain for a limited period in backups, logs, audit records, or
          provider systems where retention is required for security, legal, fraud-prevention, or
          operational reasons.
        </p>
        <p>
          Until self-serve export and deletion tools are complete, customers can request account,
          business, financial, report, buyer, advisor, import, or uploaded-file export/deletion
          through the support contact listed in the product. Requests require account or business
          ownership verification before data is exported or deleted.
        </p>
        <p>
          Accounting connection tokens are deleted when a connection is disconnected or when a
          verified deletion request covers the connected account. Uploaded data room files should be
          deleted with the related business or file record, subject to backup and provider retention
          windows.
        </p>
      </LegalSection>

      <LegalSection title="Backups and recovery">
        <p>
          Production database backups should be enabled before broader customer launch. Backup
          copies are used only for recovery, security, operational continuity, and troubleshooting,
          and they expire according to the active provider's backup retention settings.
        </p>
        <p>
          Restores should be tested in a non-production environment where practical before being
          used for production recovery. A restore may recover records from before a deletion request
          until the backup retention window expires, so deletion confirmations are subject to normal
          backup lifecycle limitations.
        </p>
      </LegalSection>

      <LegalSection title="Legal review status">
        <p>
          This privacy policy is product-readiness content for launch preparation. It should be
          reviewed by counsel before being treated as final legal language for production,
          fundraising, platform review, or marketplace submission.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about privacy, data access, correction, or deletion can be sent to the
          ValuRight.ai support contact listed in your account or onboarding materials.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
