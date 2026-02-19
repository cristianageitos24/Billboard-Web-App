/**
 * Verify GET /api/billboards returns 200 and { billboards: array }.
 * Run from project root. Optional: BASE_URL (default http://localhost:3000).
 * Start the dev server first: npm run dev
 */

const path = require("path");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function main() {
  const url = `${BASE_URL}/api/billboards?limit=10`;
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    console.error("Request failed (is the dev server running?):", err.message);
    process.exit(1);
  }

  if (!res.ok) {
    console.error("API returned", res.status, res.statusText);
    process.exit(1);
  }

  const data = await res.json();
  if (!Array.isArray(data.billboards)) {
    console.error("Response missing billboards array:", data);
    process.exit(1);
  }

  console.log("API OK: 200, billboards.length =", data.billboards.length);
  if (data.billboards.length > 0) {
    const first = data.billboards[0];
    const keys = ["id", "name", "vendor", "address", "lat", "lng", "board_type", "traffic_tier", "price_tier", "image_url"];
    const missing = keys.filter((k) => !(k in first));
    if (missing.length) console.warn("First item missing keys:", missing);
    else console.log("First item has required keys.");
  }
  process.exit(0);
}

main();
