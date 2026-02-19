/**
 * Seed billboards table from Houston GeoJSON (Billboards_1.geojson).
 * Uses geometry for lat/lng; maps properties per geojson_vs_billboard_db plan.
 *
 * Usage (from project root):
 *   node scripts/seed-geojson.js <path-to-Billboards_1.geojson>
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, and optionally HOUSTON_CITY_ID.
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });
const { createClient } = require("@supabase/supabase-js");

const HOUSTON_CITY_ID =
  process.env.HOUSTON_CITY_ID || "00000000-0000-0000-0000-000000000001";
const BATCH_SIZE = 100;

function trim(s) {
  if (s == null || typeof s !== "string") return null;
  const t = s.trim();
  return t === "" ? null : t;
}

function rowFromFeature(feature, cityId) {
  const geom = feature.geometry;
  if (!geom || geom.type !== "Point" || !Array.isArray(geom.coordinates)) return null;
  const [lng, lat] = geom.coordinates;
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  const p = feature.properties || {};
  const addrMatch = trim(p.MATCH_ADDR);
  const addrPermitted = trim(p.PERMITTED);
  const actualAdd = trim(p.ACTUAL_ADD);
  const streetNam = trim(p.STREET_NAM);
  const address =
    addrMatch ||
    addrPermitted ||
    (actualAdd && streetNam ? `${actualAdd} ${streetNam}`.trim() : null) ||
    (actualAdd || streetNam);
  const name = trim(p.ID_NUMBER) || trim(p.KEY) || address;

  return {
    city_id: cityId,
    name: name || null,
    vendor: trim(p.SIGN_CO) || null,
    address: address || null,
    zipcode: trim(p.ZIP) || null,
    source_properties: feature.properties || null,
    latitude: lat,
    longitude: lng,
    board_type: "static",
    traffic_tier: "medium",
    price_tier: "$$",
    image_url: null,
    source: "houston_geojson",
    traffic: null,
    price_cents: null,
  };
}

async function main() {
  const geoPath = process.argv[2];
  if (!geoPath) {
    console.error("Usage: node scripts/seed-geojson.js <path-to-Billboards_1.geojson>");
    process.exit(1);
  }

  const absPath = path.isAbsolute(geoPath) ? geoPath : path.join(process.cwd(), geoPath);
  if (!fs.existsSync(absPath)) {
    console.error("File not found:", absPath);
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
    process.exit(1);
  }

  console.log("Reading GeoJSON from", absPath);
  const raw = fs.readFileSync(absPath, "utf8");
  const geojson = JSON.parse(raw);
  const features = geojson.features || [];
  console.log("Features in file:", features.length);

  const rows = [];
  for (const f of features) {
    const row = rowFromFeature(f, HOUSTON_CITY_ID);
    if (row) rows.push(row);
  }
  console.log("Rows to insert (valid geometry):", rows.length);

  const supabase = createClient(url, key);

  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from("billboards").insert(batch).select("id");
    if (error) {
      console.error("Insert error at batch", Math.floor(i / BATCH_SIZE) + 1, ":", error.message);
      process.exit(1);
    }
    inserted += (data || []).length;
    console.log("Inserted", inserted, "/", rows.length);
  }

  console.log("Done. Inserted", inserted, "billboards.");
}

main();
