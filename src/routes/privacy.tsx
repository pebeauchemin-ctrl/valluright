import { createFileRoute } from "@tanstack/react-router";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy - ValuRight.ai" },
      {
        name: "description",
        content:
          "How ValuRight.ai handles business, financial, account, and buyer-sharing data.",
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
      updated="May 27, 2026"
    >
      <LegalSection title="Information we collect">
        <p>
          We collect account information, business profile details, financial
          inputs, uploaded documents, advisor and buyer invitation details, and
          usage information needed to operate the service.
        </p>
        <p>
          If you connect accounting software, we use the authorization you
          provide to import business financial data. We do not ask for consumer
          bank login credentials.
        </p>
      </LegalSection>

      <LegalSection title="How we use information">
        <p>
          We use customer information to provide valuation estimates, dashboards,
          reports, data room features, buyer-safe teaser pages, account support,
          product security, and service improvements.
        </p>
        <p>
          Valuation results depend on user-provided data and assumptions.
          Incorrect or incomplete inputs can materially affect outputs.
        </p>
      </LegalSection>

      <LegalSection title="Sharing and buyer-safe pages">
        <p>
          We do not publish private business data by default. Buyer teaser pages
          are designed to expose only the fields an owner chooses to publish.
          Data room files and full financial detail are intended to remain
          private unless access is granted by the owner.
        </p>
      </LegalSection>

      <LegalSection title="Retention and deletion">
        <p>
          We retain account and business records while an account is active or
          as needed to provide the service, comply with legal obligations, and
          maintain security records. Customers may request deletion of account
          data, subject to legal, security, and backup limitations.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about privacy, data access, correction, or deletion can be
          sent to the ValuRight.ai support contact listed in your account or
          onboarding materials.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
