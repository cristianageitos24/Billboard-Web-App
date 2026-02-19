import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/admin";

const HOUSTON_ID_FALLBACK = "00000000-0000-0000-0000-000000000001";

function getHoustonCityId(): string {
  return process.env.HOUSTON_CITY_ID ?? HOUSTON_ID_FALLBACK;
}

export async function GET() {
  const houstonId = getHoustonCityId();
  const supabase = createServerSupabaseClient();

  // Query distinct zipcodes from billboards table
  const { data, error } = await supabase
    .from("billboards")
    .select("zipcode")
    .eq("city_id", houstonId)
    .not("zipcode", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Extract unique zipcodes and sort numerically
  const zipcodesSet = new Set<string>();
  (data ?? []).forEach((row) => {
    const zipcode = row.zipcode as string | null;
    if (zipcode && zipcode.trim() !== "") {
      zipcodesSet.add(zipcode.trim());
    }
  });

  // Convert to array and sort numerically (smallest to largest)
  const zipcodes = Array.from(zipcodesSet).sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      // If not numeric, sort alphabetically
      return a.localeCompare(b);
    }
    return numA - numB;
  });

  return NextResponse.json({ zipcodes });
}
