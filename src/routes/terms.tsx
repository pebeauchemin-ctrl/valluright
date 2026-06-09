import { createFileRoute } from "@tanstack/react-router";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service - ValuRight.ai" },
      {
        name: "description",
        content:
          "Terms for using ValuRight.ai business valuation planning software.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PublicPageShell
      eyebrow="Terms"
      title="Terms of Service"
      description="These terms describe the practical rules for using ValuRight.ai and include end-user license terms for the hosted software."
      updated="June 8, 2026"
    >
      <LegalSection title="Use of the service">
        <p>
          ValuRight.ai provides hosted software for business owners, advisors, and authorized
          collaborators to organize business data, estimate value ranges, evaluate risks, prepare
          reports, manage data room materials, and share buyer-safe information.
        </p>
        <p>
          You may use the service only for businesses and data you are authorized to access. You are
          responsible for keeping account credentials secure and for activity performed through your
          account.
        </p>
      </LegalSection>

      <LegalSection title="Software-generated estimates">
        <p>
          ValuRight.ai provides planning and educational estimates based on
          customer-provided business and financial information. The service does
          not provide certified appraisals, fairness opinions, tax advice, legal
          advice, investment advice, or guaranteed sale prices.
        </p>
        <p>
          Valuation ranges, health scores, scenarios, recommendations, and report language are
          software outputs. They should be reviewed with qualified appraisers, accountants,
          attorneys, brokers, tax professionals, or financial advisors before being used in a sale,
          financing, tax, legal, or investment decision.
        </p>
      </LegalSection>

      <LegalSection title="Customer responsibility">
        <p>
          Customers are responsible for the accuracy, completeness, and right to
          use the information they enter, upload, import, or share through the
          service. Outputs should be reviewed with qualified advisors before
          making sale, tax, legal, financing, or investment decisions.
        </p>
        <p>
          You are responsible for deciding what information to publish in a buyer teaser, what files
          to upload to a data room, which advisors or buyers should receive access, and whether any
          recipient should be under an NDA or other confidentiality obligation.
        </p>
      </LegalSection>

      <LegalSection title="Accounting integrations and uploaded files">
        <p>
          If you connect accounting software, you authorize ValuRight.ai to request and process the
          accounting information needed to provide import, mapping, normalization, valuation, and
          reporting features. You are responsible for ensuring you have permission to connect that
          accounting account.
        </p>
        <p>
          Uploaded files must not include unlawful content, malware, or information you are not
          authorized to store or share through the service.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>
          Customers may not use ValuRight.ai to upload unlawful content, misuse
          another person's data, attempt to bypass access controls, probe system
          security without permission, or misrepresent software-generated
          estimates as certified professional opinions.
        </p>
        <p>
          You may not interfere with the service, attempt to reverse engineer or bypass access
          controls, scrape private data, overload infrastructure, or use the service to build a
          competing product except where allowed by law.
        </p>
      </LegalSection>

      <LegalSection title="License and ownership">
        <p>
          Subject to these terms, ValuRight.ai grants customers a limited, non-exclusive,
          non-transferable right to access and use the hosted software for internal business
          planning and authorized sharing workflows. ValuRight.ai and its licensors retain ownership
          of the software, design, workflows, models, templates, documentation, and related
          intellectual property.
        </p>
        <p>
          Customers retain ownership of their business data, uploaded files, and content they
          provide to the service, subject to the rights needed for ValuRight.ai to host, process,
          secure, support, and improve the service.
        </p>
      </LegalSection>

      <LegalSection title="Availability and changes">
        <p>
          ValuRight.ai may update features, pricing, integrations, and
          documentation over time. Preview, beta, or placeholder capabilities may
          change before general availability.
        </p>
        <p>
          The service may be unavailable during maintenance, outages, provider disruptions, or
          security events. Accounting integrations depend on third-party providers and may change
          when those providers change APIs, scopes, review requirements, or availability.
        </p>
      </LegalSection>

      <LegalSection title="Legal review status">
        <p>
          These public terms are launch-readiness content and should be reviewed
          by counsel before relying on them as final legal terms.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
