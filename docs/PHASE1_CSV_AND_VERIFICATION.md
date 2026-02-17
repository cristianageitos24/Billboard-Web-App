# Phase 1: CSV template and verification

## CSV template (billboard import)

Use this header. Set `city_id` to Houston’s UUID for all rows (e.g. `00000000-0000-0000-0000-000000000001`).

```csv
city_id,name,vendor,address,latitude,longitude,board_type,traffic_tier,price_tier,image_url,source
```

- **city_id**: Houston’s UUID (same as in seed / `HOUSTON_CITY_ID`).
- **name**, **vendor**, **address**: text (optional).
- **latitude**, **longitude**: required numbers.
- **board_type**: `static` or `digital`.
- **traffic_tier**: `low`, `medium`, `high`, or `prime`.
- **price_tier**: `$`, `$$`, `$$$`, or `$$$$`.
- **image_url**, **source**: text (optional).

Import in Supabase Table Editor → `billboards` → Insert → Import CSV, or via a script using the service-role client.

---

## Verification checklist

- [ ] **Env**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `HOUSTON_CITY_ID` in `.env.local`; `.env.local` in `.gitignore`.
- [ ] **Schema**: All six tables exist; `billboards` has name, vendor, address, board_type, traffic_tier, price_tier, image_url, source; `org_billboards` has nullable billboard_id, custom_*, monthly_cost, is_active; `org_monthly_metrics` has billboard_leads, signed_cases, revenue; `current_org_id()` exists.
- [ ] **RLS**: Billboards readable by authenticated; organizations, profiles, org_billboards, org_monthly_metrics have select/insert/update/delete scoped to `current_org_id()` or `auth.uid()`.
- [ ] **Seed**: Houston in `cities`; sample rows in `billboards` with correct tiers.
- [ ] **API**: `GET /api/billboards` returns `{ billboards: [ { id, name, vendor, address, lat, lng, board_type, traffic_tier, price_tier, image_url } ] }`; Houston-only; filters `board_type`, `traffic_tier`, `price_tier`, `limit` work; invalid params return 400.
- [ ] **Security**: `SUPABASE_SECRET_KEY` only used in server code (e.g. `src/lib/supabase/admin.ts` and API route); never in client or `NEXT_PUBLIC_*`.
