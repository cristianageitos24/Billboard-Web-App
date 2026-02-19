/**
 * Seed billboards table from Blip digital billboards JSON (full national import).
 * Resolves state from province name and get-or-creates cities; stores full Blip object in source_properties.
 *
 * Usage (from project root):
 *   node scripts/seed-blip-digital.js [path-to-Digital_Billboards_blip_Houston.json]
 * Default path: WebScrapeData/Digital_Billboards_blip_Houston.json
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY.
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });
const { createClient } = require("@supabase/supabase-js");

const DEFAULT_JSON_PATH = path.join(process.cwd(), "WebScrapeData", "Digital_Billboards_blip_Houston.json");
const BATCH_SIZE = 100;

const TRAFFIC_TIERS = ["low", "medium", "high", "prime"];
const PRICE_TIERS = ["$", "$$", "$$$", "$$$$"];

function trim(s) {
  if (s == null || typeof s !== "string") return null;
  const t = String(s).trim();
  return t === "" ? null : t;
}

function trafficTierFromImpressions(dailyImp) {
  if (dailyImp == null || typeof dailyImp !== "number" || Number.isNaN(dailyImp)) return "medium";
  if (dailyImp < 10000) return "low";
  if (dailyImp < 50000) return "medium";
  if (dailyImp < 200000) return "high";
  return "prime";
}

function priceTierFromBlip(blip) {
  const cpm = blip.cpm_range && (blip.cpm_range.high_cpm ?? blip.cpm_range.low_cpm);
  if (typeof cpm === "number" && !Number.isNaN(cpm)) {
    if (cpm < 5) return "$";
    if (cpm < 10) return "$$";
    if (cpm < 20) return "$$$";
    return "$$$$";
  }
  const minPrice = blip.max_minimum_price;
  if (typeof minPrice === "number" && !Number.isNaN(minPrice)) {
    if (minPrice < 0.1) return "$";
    if (minPrice < 0.3) return "$$";
    if (minPrice < 0.7) return "$$$";
    return "$$$$";
  }
  return "$$";
}

function rowFromBlip(blip, cityId) {
  const lat = blip.lat;
  const lon = blip.lon;
  if (typeof lat !== "number" || typeof lon !== "number" || Number.isNaN(lat) || Number.isNaN(lon)) return null;

  const name = trim(blip.display_name) || trim(blip.name) || null;
  const address = trim(blip.address) || null;
  const zipcode = trim(blip.postal_code) || null;

  let image_url = null;
  if (Array.isArray(blip.photos) && blip.photos.length > 0) {
    const first = blip.photos[0];
    image_url = trim(first.thumbnail_url) || trim(first.url) || null;
  }

  return {
    city_id: cityId,
    name,
    vendor: "Blip",
    address,
    latitude: lat,
    longitude: lon,
    board_type: "digital",
    traffic_tier: trafficTierFromImpressions(blip.daily_impressions),
    price_tier: priceTierFromBlip(blip),
    image_url,
    source: "blip_digital",
    zipcode,
    source_properties: blip,
    traffic: null,
    price_cents: null,
  };
}

async function main() {
  const jsonPath = process.argv[2] ? (path.isAbsolute(process.argv[2]) ? process.argv[2] : path.join(process.cwd(), process.argv[2])) : DEFAULT_JSON_PATH;
  if (!fs.existsSync(jsonPath)) {
    console.error("File not found:", jsonPath);
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log("Loading states...");
  const { data: states, error: statesErr } = await supabase.from("states").select("id, name, state_code");
  if (statesErr) {
    console.error("Failed to load states:", statesErr.message);
    process.exit(1);
  }
  const stateByName = {};
  (states || []).forEach((s) => {
    stateByName[s.name] = s.id;
  });
  console.log("States loaded:", Object.keys(stateByName).length);

  console.log("Reading Blip JSON from", jsonPath);
  const raw = fs.readFileSync(jsonPath, "utf8");
  const blipList = JSON.parse(raw);
  if (!Array.isArray(blipList)) {
    console.error("JSON root must be an array");
    process.exit(1);
  }
  console.log("Blip records in file:", blipList.length);

  console.log("Deleting existing blip_digital billboards...");
  const { error: delErr } = await supabase.from("billboards").delete().eq("source", "blip_digital");
  if (delErr) {
    console.error("Delete error:", delErr.message);
    process.exit(1);
  }

  const cityCache = {};
  async function getOrCreateCity(cityName, stateId) {
    const key = `${stateId}:${cityName}`;
    if (cityCache[key]) return cityCache[key];
    const { data: existing } = await supabase
      .from("cities")
      .select("id")
      .eq("state_id", stateId)
      .eq("name", cityName)
      .limit(1)
      .single();
    if (existing) {
      cityCache[key] = existing.id;
      return existing.id;
    }
    const { data: inserted, error } = await supabase.from("cities").insert({ name: cityName, state_id: stateId, state_code: (states || []).find((s) => s.id === stateId)?.state_code || "" }).select("id").single();
    if (error) {
      if (error.code === "23505") {
        const { data: retry } = await supabase.from("cities").select("id").eq("state_id", stateId).eq("name", cityName).limit(1).single();
        if (retry) {
          cityCache[key] = retry.id;
          return retry.id;
        }
      }
      throw new Error(`City insert failed: ${error.message}`);
    }
    cityCache[key] = inserted.id;
    return inserted.id;
  }

  const rows = [];
  let skipped = 0;
  for (const blip of blipList) {
    const province = trim(blip.province);
    const cityName = trim(blip.city);
    if (!province || !cityName) {
      skipped++;
      continue;
    }
    const stateId = stateByName[province];
    if (!stateId) {
      skipped++;
      continue;
    }
    try {
      const cityId = await getOrCreateCity(cityName, stateId);
      const row = rowFromBlip(blip, cityId);
      if (row) rows.push(row);
      else skipped++;
    } catch (e) {
      console.error("Error processing record:", blip.id || blip.display_name, e.message);
      skipped++;
    }
  }
  console.log("Rows to insert:", rows.length, "skipped:", skipped);

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

  console.log("Done. Inserted", inserted, "digital billboards.");
}

main();
