# GTM funnel events — Tag Assistant verify playbook (REB-171)

Container: `GTM-P2WWZ59B`. Helpers: `src/lib/marketing-analytics.ts`. No PII is ever pushed
(sanitizer drops name/email/phone/address/financial keys and any email-like value).

| Event | Fires when | Payload |
|---|---|---|
| `signup_start` | Signup CTA click / signup UI opened | none |
| `signup_complete` | `/auth` email signup succeeds | `plan` (string slug, e.g. `free_preview`, `essentials`) |
| `demo_click` | Click toward `/demo` | none |
| `valuation_started` | `/app/onboarding` wizard mounts (once per browser session) | none |
| `valuation_result_viewed` | `/app` dashboard renders a valuation result (once per session) | none |
| `plan_viewed` | `/pricing` view | none |

## GTM setup (Paul)
1. Variables: Data Layer Variable `plan` (DLV - plan).
2. Triggers: Custom Event for each of `signup_complete`, `valuation_started`, `valuation_result_viewed`.
3. Tags: GA4 Event tags with the same event names; add `plan` param to `signup_complete`.
4. Preview in Tag Assistant, then Submit/Publish the container.

## Verify with Tag Assistant
1. tagassistant.google.com → Add domain → production URL → Connect.
2. Sign up a fresh test account → expect `signup_complete` with `plan`.
3. Continue to onboarding → expect `valuation_started` once.
4. Finish preview, land on `/app` with a result → expect `valuation_result_viewed` once.
5. Check each event's Data Layer tab: no email, name, business name, or dollar figures.
6. Console alternative: `window.dataLayer.filter(e => e.event && !e.event.startsWith('gtm.'))`.
