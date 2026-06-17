# Backup, Restore, and Data Retention Plan

Last updated: June 17, 2026

This plan defines how ValuRight protects customer data, recovers from operational mistakes or outages, and handles deletion/export requests during the launch phase.

## Scope

Covered data:

- User profiles, authentication-linked account records, and business ownership records.
- Business profile inputs, financial years, normalized add-backs, valuation snapshots, recommendations, scenarios, reports, buyer teaser settings, advisor workflow records, buyer access requests, and audit events.
- Accounting connection metadata and encrypted OAuth tokens for Xero and QuickBooks.
- Uploaded data room files and file metadata.
- Import, mapping, and troubleshooting metadata.

Not covered:

- Data retained by Xero, QuickBooks, GitHub, Lovable, Supabase, payment providers, email providers, or other third-party systems outside ValuRight control.
- Local exports downloaded by customers or files customers share outside the app.

## Backup Schedule

Production database backups must be enabled before broader customer launch.

- Frequency: daily managed database backups at minimum.
- Retention target: at least 7 days during early launch, expanded as the paid plan and compliance posture mature.
- Point-in-time recovery: enable if available on the active production database plan.
- Storage files: data room storage must be covered by provider backup/versioning where available, or by a documented provider recovery process.
- Secrets: environment variables and OAuth client secrets are not restored from database backups; they must be maintained in the hosting/provider secret store.

Operational owner:

- The app operator is responsible for confirming backups are enabled in the active production backend, including Lovable Cloud or the connected Supabase project actually used by production.
- The operator should record the provider/project reference, backup setting, retention window, and last restore test date in the release tracker or operations notes.

## Restore Procedure

Use a restore when data is corrupted, deleted by mistake, affected by a faulty migration, or the production database becomes unusable.

1. Identify the affected environment, provider project, and approximate incident time.
2. Pause risky writes where practical, such as publishing, imports, or file changes.
3. Preserve evidence: error messages, affected account/business IDs, migration names, deployment IDs, and user reports.
4. Choose the restore target:
   - Prefer restoring to a temporary/staging database first.
   - Restore production directly only when the operator accepts the downtime and data-loss window.
5. Validate the restored data:
   - Login works.
   - Business profile and financial years load.
   - Latest valuation/report data exists.
   - Data room file metadata and storage paths are consistent.
   - Accounting connection records are present, but tokens may need reconnecting if provider secrets changed.
6. Repoint the app or copy validated records back into production, depending on incident scope.
7. Reload the PostgREST/schema cache after database-level restore or migration repair.
8. Smoke test the changed workflow in production.
9. Document incident summary, restore point, data-loss window, validation results, and follow-up actions.

## Restore Test

Before public launch, perform and record one restore test.

Minimum test:

- Restore the latest production-like backup into a non-production database.
- Confirm one sample owner account, one business, three financial years, one valuation, buyer settings, and one uploaded-file metadata row can be read.
- Confirm the app can point at the restored database in a test environment or that SQL-level verification covers the expected tables.
- Record test date, provider project, backup timestamp, tester, result, and gaps found.

Do not test restore by overwriting production unless there is an actual incident and the operator accepts the risk.

## Data Retention

Default retention targets:

- Active accounts and business records: retained while the account is active and needed to provide the service.
- Deleted businesses: delete primary business records and dependent financial, valuation, advisor, buyer, report, scenario, recommendation, mapping, and file metadata records according to database cascade/policy behavior.
- Uploaded files: delete from private storage when the corresponding business/file record is deleted, or document any manual cleanup required if storage and metadata diverge.
- Accounting connection tokens: delete when a user disconnects the provider or requests account deletion.
- OAuth state records: short-lived; expire or delete after connection completion/failure.
- Import and audit logs: retain long enough for security, troubleshooting, fraud prevention, and operational review.
- Backups: retain for the configured provider backup window, then expire through the provider backup lifecycle.

Deletion caveats:

- Deleted data may remain temporarily in backups, security logs, audit records, provider logs, or third-party systems until those systems expire it.
- Legal, fraud-prevention, chargeback, security, or compliance obligations may require retaining limited records.
- Customer-shared public teaser URLs, downloaded reports, exported files, or information sent to buyers/advisors may persist outside ValuRight after deletion from the app.

## Data Export and Deletion Requests

Until self-serve export/delete tools are complete, use this support process.

Export request:

1. Verify the requester controls the account or business.
2. Confirm requested scope: account profile, business profile, financial inputs, valuation outputs, reports, buyer settings, advisor records, buyer leads, data room file list, or uploaded files.
3. Export only data the requester is authorized to receive.
4. Deliver through a secure channel appropriate for sensitive financial data.
5. Record the request date, requester, scope, completion date, and operator.

Deletion request:

1. Verify the requester controls the account or business.
2. Confirm scope: one business, uploaded files, accounting connection, or full account.
3. Revoke accounting connections before deleting related token records where practical.
4. Delete application records and private storage files in the requested scope.
5. Confirm whether buyer/advisor-shared materials or downloaded reports may remain outside the app.
6. Tell the requester that backups/logs may retain limited copies until normal expiry.
7. Record request date, requester, scope, completion date, operator, and any retained records.

## Launch Readiness Checklist

- [ ] Confirm the active production backend project.
- [ ] Confirm daily database backups are enabled.
- [ ] Confirm backup retention window.
- [ ] Confirm whether point-in-time recovery is available/enabled.
- [ ] Confirm private storage recovery/versioning posture for data room files.
- [ ] Run and record one restore test.
- [ ] Confirm accounting token deletion on disconnect.
- [ ] Confirm business deletion covers dependent records and data room file cleanup.
- [ ] Confirm support process for export/deletion requests.
- [ ] Review this plan with counsel/security advisor before public launch.
