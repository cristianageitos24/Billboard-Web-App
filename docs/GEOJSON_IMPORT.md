# GeoJSON billboard import

Import Houston billboards from `Billboards_1.geojson` (permit data) into the `billboards` table. Mapping follows the GeoJSON vs Billboard DB plan (geometry for lat/lng; MATCH_ADDR/PERMITTED/SIGN_CO/etc.).

## Prerequisites

- Migration applied (Houston city and `billboards` table exist).
- `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and optionally `HOUSTON_CITY_ID` (default: `00000000-0000-0000-0000-000000000001`).

## Run the import

From the project root, pass the **full path** to the GeoJSON file:

```bash
npm run seed:geojson -- "C:\Users\...\Downloads\Billboards_1.geojson"
```

Or call Node directly:

```bash
node scripts/seed-geojson.js "C:\path\to\Billboards_1.geojson"
```

The script loads `.env.local` from the project root, reads the GeoJSON, maps each feature using **geometry** for lat/lng and properties for name/vendor/address, and inserts in batches of 100. Defaults: `board_type=static`, `traffic_tier=medium`, `price_tier=$$`, `source=houston_geojson`.

## After import

- The map (Phase 2) will show 1000+ clustered markers with correct locations.
- To re-run: delete existing rows (e.g. `source = 'houston_geojson'`) in Supabase, then run the script again.

## Verification (runbook)

1. **Env:** Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Run `npm install` and `npm run build`.
2. **Database:** Phase 1 migration must be applied (Supabase project used by the app). Run `npm run verify:db` to check that `cities` has Houston and `billboards` has rows for that `city_id` (or confirm in Supabase Dashboard).
3. **API:** With dev server running (`npm run dev`), run `npm run verify:api` to assert 200 and `{ billboards: [...] }`. Or call `GET /api/billboards?limit=10` manually. Empty DB returns `{ billboards: [] }`. Optional params: `board_type`, `traffic_tier`, `price_tier`, `limit`.
4. **Frontend:** Run `npm run dev`, open the app. Map should load; with data, markers cluster and clicking a marker opens the detail panel. With no data, map is empty and panel shows "Click a marker to see details."
