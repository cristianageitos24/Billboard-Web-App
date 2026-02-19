/**
 * Verify Phase 1 DB state: Houston city exists and billboards table has data for it.
 * Run from project root. Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.
 */

const path = require("path");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });
const { createClient } = require("@supabase/supabase-js");

const HOUSTON_CITY_ID =
  process.env.HOUSTON_CITY_ID || "00000000-0000-0000-0000-000000000001";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { data: city, error: cityError } = await supabase
    .from("cities")
    .select("id, name, state_code")
    .eq("id", HOUSTON_CITY_ID)
    .maybeSingle();

  if (cityError) {
    console.error("Cities table error (migration may not be applied):", cityError.message);
    process.exit(1);
  }
  if (!city) {
    console.error("Houston city not found. Expected id:", HOUSTON_CITY_ID);
    process.exit(1);
  }
  console.log("Houston city OK:", city.name, city.state_code);

  const { count, error: countError } = await supabase
    .from("billboards")
    .select("id", { count: "exact", head: true })
    .eq("city_id", HOUSTON_CITY_ID);

  if (countError) {
    console.error("Billboards table error:", countError.message);
    process.exit(1);
  }
  console.log("Billboards for Houston:", count ?? 0);
  process.exit(0);
}

main();
