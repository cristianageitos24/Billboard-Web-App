import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/api-auth";
import type { AddCustomBoardBody, ClaimBoardBody, OrgBillboardWithBoard, OrgBillboardWithBoardRaw } from "@/types/org-billboard";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseUuid(value: string | null): string | null {
  if (value == null || value === "") return null;
  const t = value.trim();
  return UUID_REGEX.test(t) ? t : null;
}

/** GET /api/org-billboards — list org's claimed boards; ?billboard_id= to check one. */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const billboardId = parseUuid(searchParams.get("billboard_id"));
  const activeOnly = searchParams.get("active") !== "false";

  const supabase = await createClient();

  let query = supabase
    .from("org_billboards")
    .select(
      "id, organization_id, billboard_id, custom_name, custom_address, custom_lat, custom_lng, monthly_cost, notes, is_active, created_at, billboards(name, address, board_type, traffic_tier, price_tier)"
    )
    .order("created_at", { ascending: false });

  if (billboardId) {
    query = query.eq("billboard_id", billboardId).not("billboard_id", "is", null);
  }
  if (activeOnly && !billboardId) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const raw = (data ?? []) as OrgBillboardWithBoardRaw[];
  const rows: OrgBillboardWithBoard[] = raw.map((row) => ({
    ...row,
    billboards: Array.isArray(row.billboards) ? row.billboards[0] ?? null : row.billboards,
  }));
  return NextResponse.json({ orgBillboards: rows });
}

/** POST /api/org-billboards — claim from inventory or add custom board. */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 403 }
    );
  }

  const billboardId = parseUuid((body as ClaimBoardBody).billboard_id ?? null);

  if (billboardId) {
    const { billboard_id, monthly_cost, notes } = body as ClaimBoardBody;
    if (monthly_cost != null) {
      const n = Number(monthly_cost);
      if (Number.isNaN(n) || n < 0) {
        return NextResponse.json(
          { error: "monthly_cost must be a non-negative number" },
          { status: 400 }
        );
      }
    }
    const { data: existing } = await supabase
      .from("billboards")
      .select("id")
      .eq("id", billboardId)
      .single();
    if (!existing) {
      return NextResponse.json(
        { error: "Billboard not found" },
        { status: 404 }
      );
    }
    const { data: inserted, error } = await supabase
      .from("org_billboards")
      .insert({
        organization_id: profile.organization_id,
        billboard_id: billboardId,
        monthly_cost: monthly_cost ?? null,
        notes: notes != null && String(notes).trim() !== "" ? String(notes).trim() : null,
      })
      .select("id, billboard_id, monthly_cost, notes, is_active, created_at")
      .single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This board is already in My Boards" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(inserted, { status: 201 });
  }

  const { custom_name, custom_address, custom_lat, custom_lng, monthly_cost, notes } =
    body as AddCustomBoardBody;
  const nameTrimmed = custom_name != null ? String(custom_name).trim() : "";
  if (!nameTrimmed) {
    return NextResponse.json(
      { error: "custom_name is required for custom boards" },
      { status: 400 }
    );
  }
  if (monthly_cost != null) {
    const n = Number(monthly_cost);
    if (Number.isNaN(n) || n < 0) {
      return NextResponse.json(
        { error: "monthly_cost must be a non-negative number" },
        { status: 400 }
      );
    }
  }
  let lat: number | null = null;
  let lng: number | null = null;
  if (custom_lat != null) {
    const n = Number(custom_lat);
    if (!Number.isNaN(n) && n >= -90 && n <= 90) lat = n;
  }
  if (custom_lng != null) {
    const n = Number(custom_lng);
    if (!Number.isNaN(n) && n >= -180 && n <= 180) lng = n;
  }
  const { data: inserted, error } = await supabase
    .from("org_billboards")
    .insert({
      organization_id: profile.organization_id,
      billboard_id: null,
      custom_name: nameTrimmed,
      custom_address:
        custom_address != null && String(custom_address).trim() !== ""
          ? String(custom_address).trim()
          : null,
      custom_lat: lat,
      custom_lng: lng,
      monthly_cost: monthly_cost ?? null,
      notes: notes != null && String(notes).trim() !== "" ? String(notes).trim() : null,
    })
    .select("id, billboard_id, custom_name, custom_address, monthly_cost, notes, is_active, created_at")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(inserted, { status: 201 });
}
