import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/admin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseUuid(value: string | null): string | null {
  if (value == null || value === "") return null;
  const t = value.trim();
  return UUID_REGEX.test(t) ? t : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityId = parseUuid(searchParams.get("city_id"));
  const stateId = parseUuid(searchParams.get("state_id"));

  const supabase = createServerSupabaseClient();

  let cityIds: string[] | null = null;
  if (cityId) {
    cityIds = [cityId];
  } else if (stateId) {
    const { data: citiesInState } = await supabase.from("cities").select("id").eq("state_id", stateId);
    cityIds = (citiesInState ?? []).map((c: { id: string }) => c.id);
    if (cityIds.length === 0) {
      return NextResponse.json({ zipcodes: [] });
    }
  }

  let query = supabase.from("billboards").select("zipcode").not("zipcode", "is", null);
  if (cityIds != null && cityIds.length > 0) {
    query = query.in("city_id", cityIds);
  }

  const { data, error } = await query;

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
