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
      description="These terms describe the practical rules for using ValuRight.ai. They are not a substitute for final legal review."
      updated="May 27, 2026"
    >
      <LegalSection title="Software-generated estimates">
        <p>
          ValuRight.ai provides planning and educational estimates based on
          customer-provided business and financial information. The service does
          not provide certified appraisals, fairness opinions, tax advice, legal
          advice, investment advice, or guaranteed sale prices.
        </p>
      </LegalSection>

      <LegalSection title="Customer responsibility">
        <p>
          Customers are responsible for the accuracy, completeness, and right to
          use the information they enter, upload, import, or share through the
          service. Outputs should be reviewed with qualified advisors before
          making sale, tax, legal, financing, or investment decisions.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>
          Customers may not use ValuRight.ai to upload unlawful content, misuse
          another person's data, attempt to bypass access controls, probe system
          security without permission, or misrepresent software-generated
          estimates as certified professional opinions.
        </p>
      </LegalSection>

      <LegalSection title="Availability and changes">
        <p>
          ValuRight.ai may update features, pricing, integrations, and
          documentation over time. Preview, beta, or placeholder capabilities may
          change before general availability.
        </p>
      </LegalSection>

      <LegalSection title="Final terms">
        <p>
          These public terms are launch-readiness content and should be reviewed
          by counsel before relying on them as final legal terms.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
