# Support Admin Playbook

The support admin view is for early-user troubleshooting. It intentionally shows account status,
onboarding progress, import status, safe error metadata, connection counts, and recent safe events.
It does not show financial values, buyer PII, OAuth tokens, raw uploaded files, or full valuation
outputs.

## Common Actions

### Resend invite

Confirm the business and recipient first. Resend from the advisor workflow when available, or send a
manual email that contains no financial details.

### Reset import connection

Ask the user to reconnect Xero or QuickBooks from the Financials page. Only remove a server-side
connection after explicit user authorization.

### Inspect failed import

Use the latest import status, source, safe error message, warning count, retry action, report names,
and sanitized metadata. Do not inspect raw uploaded financial data unless the user explicitly asks
for that support action.

### Deactivate account

Require a written request and identity check. Disable access first, preserve or export records as
needed, and avoid deleting business data until retention and user-confirmation requirements are
clear.
