# Attribution and integrations (placeholder)

This folder holds types and the **single aggregation point** for metrics used in the dashboard and my-boards. The goal is to make future CRM and referral-source integrations a local change.

## Current behavior

- **Metrics** come only from `org_monthly_metrics` (manual entry per board per month).
- **ROI route** (`/api/dashboard/roi`) calls `getManualMetricsForMonth()` from `get-metrics.ts` to fetch and shape that data. Spend comes from `org_billboards.monthly_cost`.

## Where integrations plug in later

1. **New data source**
   - Add a function in this folder (e.g. `getCrmMetricsForMonth(orgId, month)`) that returns the same shape as `getManualMetricsForMonth`: a map of `org_billboard_id` → `{ leads, signedCases, revenue }`.
   - In `get-metrics.ts`, add a `getMetricsForMonth()` (or extend the existing one) that:
     - Calls `getManualMetricsForMonth()` and any integration fetchers.
     - Merges by board (e.g. sum leads, or prefer one source per board by config).
   - Point the ROI route at `getMetricsForMonth()` instead of calling `getManualMetricsForMonth()` directly.

2. **CRM**
   - Backed by future tables: `org_integrations` (provider, credentials, last_sync), and `leads` with `lead_source_id` → `lead_sources` (optional `org_billboard_id`).
   - Sync job or webhook writes into `leads`; aggregation by board/month is done in a function here and merged into the same payload the dashboard expects.

3. **Referral / lead source attribution**
   - Same as above: `lead_sources` + `leads` tables. Attribution = `leads.lead_source_id`; some `lead_sources` rows link to `org_billboard_id`. No code in this folder until those tables exist; then add a getter that aggregates `leads` by board/month and merge in `getMetricsForMonth()`.

## Files

- **types.ts** – `MetricsSourceKind`, `BoardMetricsRow`, `MonthMetricsPayload`. Shared so ROI and any future "sources" UI can stay consistent.
- **constants.ts** – `CURRENT_METRICS_SOURCE`, placeholder provider list. No env or secrets here.
- **get-metrics.ts** – Fetches manual metrics for a month. Later: merge point for manual + CRM + referral.
- **README.md** – This file.
