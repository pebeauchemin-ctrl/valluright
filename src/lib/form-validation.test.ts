import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assertIncludes(path: string, expected: string, message: string) {
  assert(read(path).includes(expected), `${message}: ${path}`);
}

const advisors = "src/routes/app.advisors.tsx";
const buyerTeaser = "src/routes/app.buyer-teaser.tsx";
const financials = "src/routes/app.financials.tsx";

assertIncludes(financials, "NON_NEGATIVE_FINANCIAL_FIELDS", "Financials must identify non-negative fields");
assertIncludes(financials, "financialFieldBounds", "Financial inputs must share field bounds");
assertIncludes(financials, "Review financial inputs before saving", "Financial save must block invalid values");
assertIncludes(financials, "That value is too large", "Financial entry must flag unusually large values");

assertIncludes(buyerTeaser, "validateAskingPrice", "Buyer teaser must validate asking price");
assertIncludes(buyerTeaser, "Asking price low must be less than or equal", "Asking price range must be ordered");
assertIncludes(buyerTeaser, "min={0}", "Asking price inputs must reject negatives");
assertIncludes(buyerTeaser, "max={ASKING_PRICE_MAX}", "Asking price inputs must cap extreme values");

assertIncludes(advisors, "EMAIL_PATTERN", "Advisor invite must validate email format");
assertIncludes(advisors, "Enter an advisor email address.", "Advisor invite must flag missing email");
assertIncludes(advisors, "Enter a valid email address.", "Advisor invite must flag invalid email");
assertIncludes(advisors, "aria-invalid={emailError", "Advisor email field must expose validation state");

console.log("Form validation checks passed.");
