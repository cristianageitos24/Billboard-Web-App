import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/admin";
import type { BillboardListItem } from "@/types/billboard";

const BOARD_TYPES = ["static", "digital"] as const;
const TRAFFIC_TIERS = ["low", "medium", "high", "prime"] as const;
const PRICE_TIERS = ["$", "$$", "$$$", "$$$$"] as const;
const MAX_LIMIT = 2500;
const DEFAULT_LIMIT = 50;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type { BillboardListItem };

function parseUuid(value: string | null): string | null {
  if (value == null || value === "") return null;
  const t = value.trim();
  return UUID_REGEX.test(t) ? t : null;
}

function parseLimit(value: string | null): number {
  if (value == null || value === "") return DEFAULT_LIMIT;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const boardType = searchParams.get("board_type");
  const trafficTier = searchParams.get("traffic_tier");
  const priceTier = searchParams.get("price_tier");
  const zipcodesRaw = searchParams.get("zipcodes");
  const limitRaw = searchParams.get("limit");
  const cityId = parseUuid(searchParams.get("city_id"));
  const stateId = parseUuid(searchParams.get("state_id"));

  if (boardType != null && boardType !== "" && !BOARD_TYPES.includes(boardType as (typeof BOARD_TYPES)[number])) {
    return NextResponse.json(
      { error: "Invalid board_type; use static or digital" },
      { status: 400 }
    );
  }
  if (trafficTier != null && trafficTier !== "" && !TRAFFIC_TIERS.includes(trafficTier as (typeof TRAFFIC_TIERS)[number])) {
    return NextResponse.json(
      { error: "Invalid traffic_tier; use low, medium, high, or prime" },
      { status: 400 }
    );
  }
  if (priceTier != null && priceTier !== "" && !PRICE_TIERS.includes(priceTier as (typeof PRICE_TIERS)[number])) {
    return NextResponse.json(
      { error: "Invalid price_tier; use $, $$, $$$, or $$$$" },
      { status: 400 }
    );
  }

  const limit = parseLimit(limitRaw);

  // Parse zipcodes
  const zipcodes: string[] = [];
  if (zipcodesRaw != null && zipcodesRaw !== "") {
    zipcodesRaw
      .split(",")
      .map((z) => z.trim())
      .filter((z) => z !== "" && /^\d{5}$/.test(z))
      .forEach((z) => {
        if (!zipcodes.includes(z)) {
          zipcodes.push(z);
        }
      });
  }

  const supabase = createServerSupabaseClient();

  let cityIds: string[] | null = null;
  if (cityId) {
    cityIds = [cityId];
  } else if (stateId) {
    const { data: citiesInState } = await supabase.from("cities").select("id").eq("state_id", stateId);
    cityIds = (citiesInState ?? []).map((c: { id: string }) => c.id);
    if (cityIds.length === 0) {
      return NextResponse.json({ billboards: [], totalCount: 0 });
    }
  }

  let countQuery = supabase.from("billboards").select("*", { count: "exact", head: true });
  let query = supabase
    .from("billboards")
    .select("id, name, vendor, address, zipcode, source_properties, latitude, longitude, board_type, traffic_tier, price_tier, image_url")
    .limit(limit);

  if (cityIds != null && cityIds.length > 0) {
    countQuery = countQuery.in("city_id", cityIds);
    query = query.in("city_id", cityIds);
  }

  if (boardType != null && boardType !== "") {
    countQuery = countQuery.eq("board_type", boardType);
    query = query.eq("board_type", boardType);
  }
  if (trafficTier != null && trafficTier !== "") {
    countQuery = countQuery.eq("traffic_tier", trafficTier);
    query = query.eq("traffic_tier", trafficTier);
  }
  if (priceTier != null && priceTier !== "") {
    countQuery = countQuery.eq("price_tier", priceTier);
    query = query.eq("price_tier", priceTier);
  }
  if (zipcodes.length > 0) {
    countQuery = countQuery.in("zipcode", zipcodes);
    query = query.in("zipcode", zipcodes);
  }

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    query,
    countQuery,
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const billboards: BillboardListItem[] = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: (row.name as string | null) ?? null,
    vendor: (row.vendor as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    zipcode: (row.zipcode as string | null) ?? null,
    source_properties: (row.source_properties as Record<string, unknown> | null) ?? null,
    lat: row.latitude as number,
    lng: row.longitude as number,
    board_type: row.board_type as string,
    traffic_tier: row.traffic_tier as string,
    price_tier: row.price_tier as string,
    image_url: (row.image_url as string | null) ?? null,
  }));

  return NextResponse.json({ billboards, totalCount: count ?? 0 });
}
