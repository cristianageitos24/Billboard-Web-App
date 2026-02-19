/**
 * Delete the 3 seed billboards from the billboards table (source = 'seed').
 * Run from project root. Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.
 * After this, run the GeoJSON import to load 1000+ billboards.
 */

const path = require("path");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });
const { createClient } = require("@supabase/supabase-js");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { data: deleted, error } = await supabase
    .from("billboards")
    .delete()
    .eq("source", "seed")
    .select("id, name");

  if (error) {
    console.error("Delete failed:", error.message);
    process.exit(1);
  }

  const count = deleted?.length ?? 0;
  console.log("Deleted", count, "seed billboard(s):", deleted?.map((r) => r.name).join(", ") ?? "—");
  if (count > 0) {
    console.log("Run the GeoJSON import to load 1000+ billboards:");
    console.log('  npm run seed:geojson -- "C:\\path\\to\\Billboards_1.geojson"');
  }
  process.exit(0);
}

main();
