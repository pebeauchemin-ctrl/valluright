import assert from "node:assert/strict";
import { analyzeTeaserAnonymity } from "./teaser-anonymity";

const businessName = "Reboot MVR Inc d/b/a Mountain View RV Resort";

const nameWarnings = analyzeTeaserAnonymity(businessName, [
  {
    field: "Anonymous description",
    text: "Mountain View RV Resort is an established destination park.",
  },
]);
assert.equal(nameWarnings.length, 1);
assert.equal(nameWarnings[0].kind, "business_name");
assert.equal(nameWarnings[0].matchedText, "mountain view rv resort");

const punctuationWarnings = analyzeTeaserAnonymity(businessName, [
  {
    field: "Highlights",
    text: "Mountain-View RV Resort has loyal seasonal guests.",
  },
]);
assert.equal(punctuationWarnings.length, 1);
assert.equal(punctuationWarnings[0].kind, "business_name");

const locationWarnings = analyzeTeaserAnonymity("Anonymous Services LLC", [
  {
    field: "Anonymous description",
    text: "Located 6 miles west of Canon City CO with easy highway access.",
  },
  { field: "Transition support", text: "Meet at 123 Main Street after NDA." },
  { field: "Highlights", text: "Serving the 81212 area." },
]);
assert.equal(locationWarnings.filter((warning) => warning.kind === "precise_location").length, 3);

const safeWarnings = analyzeTeaserAnonymity(businessName, [
  {
    field: "Anonymous description",
    text: "Established hospitality business in a tourism-driven western market.",
  },
]);
assert.deepEqual(safeWarnings, []);

console.log("teaser anonymity tests passed");
