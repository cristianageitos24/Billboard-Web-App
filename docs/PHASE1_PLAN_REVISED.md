# Phase 1 plan (revised for MVP)

## Summary

- **Billboards**: MVP map columns — name, vendor, address, board_type (static|digital), traffic_tier (low|medium|high|prime), price_tier ($|$$|$$$|$$$$), image_url, source; latitude/longitude required; optional traffic/price_cents for future.
- **org_billboards**: Claiming with monthly_cost; user-added boards (billboard_id nullable); custom_name, custom_address, custom_lat, custom_lng; is_active.
- **org_monthly_metrics**: month (date), billboard_leads, signed_cases, revenue; optional impressions/spend_cents for later.
- **RLS**: Billboards readable by authenticated (or anon if public later). Organizations, profiles, org_billboards, org_monthly_metrics: select/insert/update/delete scoped to current_org_id() or auth.uid().
- **API GET /api/billboards**: Houston-only (HOUSTON_CITY_ID or seeded UUID). Filters: board_type, traffic_tier, price_tier, limit. Response: `{ billboards: [ { id, name, vendor, address, lat, lng, board_type, traffic_tier, price_tier, image_url } ] }`.

## Files

| Path | Purpose |
|------|---------|
| `supabase/migrations/20250217000000_phase1_mvp_schema.sql` | Schema + RLS + seed (run in billboard Supabase project). |
| `.env.local.example` | Env template including HOUSTON_CITY_ID. |
| `src/lib/supabase/admin.ts` | Server-only Supabase client (SUPABASE_SECRET_KEY). |
| `src/app/api/billboards/route.ts` | GET /api/billboards with filters and response shape. |
| `docs/PHASE1_CSV_AND_VERIFICATION.md` | CSV template and verification checklist. |

## Apply migration

Run the SQL in your **billboard** Supabase project (Dashboard → SQL Editor, or Supabase CLI). Use the single migration file; seed is at the end (Houston + 3 sample billboards).
