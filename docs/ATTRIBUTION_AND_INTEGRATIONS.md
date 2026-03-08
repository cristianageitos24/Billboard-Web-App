# Attribution and integrations

This doc describes how the product is prepared for **lead source attribution** and **external data integrations** (e.g. CRM) without building them yet. It explains structural decisions and where future code should plug in.

---

## Current state

- **Metrics** are manual only: one row per board per month in `org_monthly_metrics` (leads, signed_cases, revenue). Users enter these in My Boards.
- **Dashboard ROI** reads those metrics via a single abstraction: `getManualMetricsForMonth()` in `src/lib/attribution/get-metrics.ts`. The API route `/api/dashboard/roi` calls that function and then computes spend, cost-per-lead, and ROI. No other source of metrics exists yet.

---

## Structural decisions

### 1. Single aggregation point for metrics

**Decision:** All “board-level metrics for a month” are obtained through the attribution layer (`src/lib/attribution/`), not by querying `org_monthly_metrics` directly from feature code.

**Why:** When we add CRM or referral data, we only need to (a) add a new fetcher (e.g. `getCrmMetricsForMonth`) and (b) merge its result with manual metrics inside one place (e.g. `getMetricsForMonth()`). The ROI route and any other consumer keep calling one function and stay unaware of how many sources exist.

**Where:** `src/lib/attribution/get-metrics.ts` is that place. Today it only exports `getManualMetricsForMonth()`. Later, add a `getMetricsForMonth()` that calls manual + integration getters and merges by board.

### 2. Shared types for “source of metrics”

**Decision:** Types like `MetricsSourceKind`, `BoardMetricsRow`, and `MonthMetricsPayload` live in `src/lib/attribution/types.ts`.

**Why:** So we can tag metrics by source (manual vs crm_sync vs referral) if we ever show “breakdown by source” or need to merge without overwriting. The ROI API does not expose source today; it’s there for future use.

### 3. No new tables or env until we build an integration

**Decision:** We did not add `org_integrations`, `lead_sources`, or `leads` tables, and no CRM env vars or SDKs.

**Why:** Keeps the prep minimal and avoids unused schema. When we implement the first integration (e.g. HubSpot), we’ll add the tables and env in one go and plug the sync into the attribution layer.

### 4. Settings explains “Data & integrations” without actions

**Decision:** The Settings page has a “Data & integrations” section that describes CRM and referral attribution as “coming soon” and states that future integrations will feed the same dashboard/ROI.

**Why:** Sets user expectations and gives a single place to add “Connect CRM” when we’re ready, without building a separate Integrations app or overengineering the UI now.

---

## Where CRM integrations plug in later

1. **Database**
   - `org_integrations`: organization_id, provider (e.g. hubspot), status, credentials or OAuth ref, last_sync_at, config (jsonb).
   - Optionally `lead_sources` and `leads`: lead_sources (e.g. per org_billboard or per channel), leads (lead_source_id, outcome, revenue, occurred_at, external_id for CRM id). RLS by organization_id.

2. **Code**
   - **Sync:** A server-side job or webhook that, per org with an active integration, calls the CRM API, maps deals/contacts to your `leads` (and possibly `lead_sources`), and writes/updates rows. No need to touch the ROI route for that.
   - **Aggregation:** Implement something like `getCrmMetricsForMonth(orgId, month)` that reads from `leads` (and `lead_sources` / `org_billboards`) and returns the same shape as `getManualMetricsForMonth`: map of org_billboard_id → { leads, signedCases, revenue }.
   - **Merge:** In `get-metrics.ts`, add `getMetricsForMonth(supabase, orgId, month)` that calls `getManualMetricsForMonth` and `getCrmMetricsForMonth` (or similar), then merges the maps (e.g. sum by board or apply rules). Point `/api/dashboard/roi` at `getMetricsForMonth` instead of `getManualMetricsForMonth`.

3. **UI**
   - Settings → Data & integrations: add “Connect HubSpot” (or similar) that starts OAuth and creates/updates `org_integrations`. Optionally show “Last synced” and disconnect.

---

## Where referral / lead-source attribution plugs in

- **Data model:** Same as above: `lead_sources` (with optional `org_billboard_id`) and `leads` with `lead_source_id`. Referral partners or “offline” sources get a `lead_sources` row not tied to a board if needed; board-specific attribution uses `org_billboard_id`.
- **Code:** Once those tables exist, a small “referral” or “lead entry” flow can insert into `leads`. Attribution aggregation is the same as CRM: a function that aggregates `leads` by board/month and returns the same map shape; merge it in `getMetricsForMonth()`.
- **No separate “referral system”** is required for the merge; it’s just another source of rows in `leads` that get aggregated by `lead_sources` → `org_billboard_id`.

---

## File reference

| Path | Purpose |
|------|--------|
| `src/lib/attribution/types.ts` | MetricsSourceKind, BoardMetricsRow, MonthMetricsPayload |
| `src/lib/attribution/constants.ts` | CURRENT_METRICS_SOURCE, placeholder integration provider list |
| `src/lib/attribution/get-metrics.ts` | getManualMetricsForMonth(); future merge point for all sources |
| `src/lib/attribution/README.md` | Short “where integrations plug in” for developers |
| `src/app/api/dashboard/roi/route.ts` | Uses getManualMetricsForMonth(); later switch to getMetricsForMonth() |
| `src/app/settings/page.tsx` | Account + “Data & integrations” section (coming soon) |
| `docs/ATTRIBUTION_AND_INTEGRATIONS.md` | This document |

---

## Summary

- **Refactor:** ROI route now gets metrics only via `getManualMetricsForMonth()`, so all future sources are added in one place.
- **Placeholder:** Types and constants in `src/lib/attribution/` and an in-folder README describe where CRM and referral data will plug in.
- **UI:** Settings has a “Data & integrations” section; no new routes or heavy UI.
- **Docs:** This file and `src/lib/attribution/README.md` explain the structure and where to add integrations when the time comes.
