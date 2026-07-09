# Security Hardening Notes

## OAuth Token Encryption

Server-side OAuth token encryption requires a dedicated `TOKEN_ENCRYPTION_KEY`.
Do not reuse the Supabase service-role key, OAuth client secrets, or any public
frontend environment variable for token encryption.

Generate a high-entropy value of at least 32 characters and set it in every
deployed server environment before enabling Xero or QuickBooks OAuth flows.

## Buyer Lead Spam Mitigation

The public buyer-access RPC rate-limits repeated submissions for the same
published business and email address. If lead spam appears, add edge protection
in front of the public teaser submit path:

- Apply a Cloudflare or hosting WAF rule to the buyer-access request endpoint.
- Rate-limit by IP and user-agent over short windows.
- Challenge or temporarily block sources with repeated failed or high-volume
  submissions.
- Keep the application-level per-email rate limit in place as a secondary guard.

This preserves the public buyer workflow while giving operations a place to
respond to email-rotation or bot-driven spam.
