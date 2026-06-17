# Release Process

Use this process for every pull request before publishing the app.

## Pull Request Checks

- Open a pull request against `main`.
- Confirm the GitHub `CI` check passes before merging.
- The CI check runs typecheck, lint, unit tests, valuation tests, and a production build.
- Do not merge if CI is red unless the failure has a documented follow-up and the release owner accepts the risk.

## Preview QA

- Use the Lovable preview or branch preview for the pull request when available.
- Smoke test the public homepage, login, dashboard, financials, valuation, reports, data room, buyer teaser, and buyer leads when the change touches those areas.
- For database changes, confirm Lovable has applied the matching Supabase migration to the live backend before testing the app.
- If the app reports a missing table or function, ask Lovable to apply the missing migration and reload the Supabase schema cache.

## Production Publish

- Merge only after CI passes and preview QA is acceptable.
- Publish or sync the production app from Lovable after the merge.
- Confirm the live public site and logged-in dashboard load after publish.
- Run a short smoke test for the changed workflow on production.

## Backup and Restore Readiness

- Before broader customer launch, confirm the active production backend project and backup settings.
- Confirm daily database backups are enabled and record the retention window.
- Confirm whether point-in-time recovery and private storage recovery/versioning are available.
- Run at least one non-production restore test and record the backup timestamp, tester, validation steps, and result.
- Use `docs/backup-restore-data-retention.md` as the operating procedure for restore incidents, data export requests, and deletion requests.

## Release Notes

Add these notes to the pull request description or release tracker:

- Linear issue:
- User-visible change:
- Database migrations applied:
- QA completed:
- Backup/restore impact:
- Known follow-ups:

GitHub pull requests provide the release history. Lovable publish history provides the deployment history.
