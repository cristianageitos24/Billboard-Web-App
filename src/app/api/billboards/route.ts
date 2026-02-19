import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/admin";
import type { BillboardListItem } from "@/types/billboard";

const HOUSTON_ID_FALLBACK = "00000000-0000-0000-0000-000000000001";

const BOARD_TYPES = ["static", "digital"] as const;
const TRAFFIC_TIERS = ["low", "medium", "high", "prime"] as const;
const PRICE_TIERS = ["$", "$$", "$$$", "$$$$"] as const;
const MAX_LIMIT = 2500;
const DEFAULT_LIMIT = 50;

export type { BillboardListItem };

function getHoustonCityId(): string {
  return process.env.HOUSTON_CITY_ID ?? HOUSTON_ID_FALLBACK;
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
  const houstonId = getHoustonCityId();

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
  
  // Build base query for count
  let countQuery = supabase
    .from("billboards")
    .select("*", { count: "exact", head: true })
    .eq("city_id", houstonId);

  if (boardType != null && boardType !== "") {
    countQuery = countQuery.eq("board_type", boardType);
  }
  if (trafficTier != null && trafficTier !== "") {
    countQuery = countQuery.eq("traffic_tier", trafficTier);
  }
  if (priceTier != null && priceTier !== "") {
    countQuery = countQuery.eq("price_tier", priceTier);
  }
  if (zipcodes.length > 0) {
    countQuery = countQuery.in("zipcode", zipcodes);
  }

  // Build query for data
  let query = supabase
    .from("billboards")
    .select("id, name, vendor, address, zipcode, source_properties, latitude, longitude, board_type, traffic_tier, price_tier, image_url")
    .eq("city_id", houstonId)
    .limit(limit);

  if (boardType != null && boardType !== "") {
    query = query.eq("board_type", boardType);
  }
  if (trafficTier != null && trafficTier !== "") {
    query = query.eq("traffic_tier", trafficTier);
  }
  if (priceTier != null && priceTier !== "") {
    query = query.eq("price_tier", priceTier);
  }
  if (zipcodes.length > 0) {
    query = query.in("zipcode", zipcodes);
  }

  // Execute both queries in parallel
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
