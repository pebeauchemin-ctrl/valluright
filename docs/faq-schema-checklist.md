# FAQ schema: drift check + post-publish checklist (REB-164)

## In CI (automatic)
`npm run test:faq-schema` (part of `npm test`, so it runs in CI; it starts `vite dev` itself) finds every route with
`"FAQPage"` JSON-LD, renders it, and fails if any JSON-LD question or answer is not
in the visible page text. Fix by making the JSON-LD string match the visible copy
(visible copy wins; do not change page copy just to satisfy the check).

Run locally: `npm run dev` in one terminal, then `npm run check:faq-schema`.
Against live: `node scripts/check-faq-schema.mjs https://valuright.ai`.

Limits: answers that continue with links ("More: …") match on the leading text;
visible FAQs that are missing from JSON-LD are not detected automatically — check by eye.

## After each Lovable publish that touches an FAQ page
1. `node scripts/check-faq-schema.mjs https://valuright.ai` → all `ok`.
2. Google Rich Results Test (https://search.google.com/test/rich-results) on each changed URL → "FAQ" detected, 0 errors.
3. Visible FAQ count on the page = Q&A count printed by the script.
4. GSC → URL Inspection → Request indexing for changed URLs (see REB-176).
5. Note result in the Linear issue.
