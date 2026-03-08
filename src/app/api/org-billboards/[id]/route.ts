import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/api-auth";
import type { UpdateOrgBillboardBody } from "@/types/org-billboard";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseUuid(value: string | null): string | null {
  if (value == null || value === "") return null;
  const t = value.trim();
  return UUID_REGEX.test(t) ? t : null;
}

/** PATCH /api/org-billboards/[id] — update monthly_cost, notes, or is_active. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseUuid((await params).id);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { monthly_cost, notes, is_active, custom_name, custom_address, custom_lat, custom_lng } =
    body as UpdateOrgBillboardBody;
  const updates: Record<string, unknown> = {};

  if (monthly_cost !== undefined) {
    if (monthly_cost === null) {
      updates.monthly_cost = null;
    } else {
      const n = Number(monthly_cost);
      if (Number.isNaN(n) || n < 0) {
        return NextResponse.json(
          { error: "monthly_cost must be a non-negative number or null" },
          { status: 400 }
        );
      }
      updates.monthly_cost = n;
    }
  }
  if (notes !== undefined) {
    updates.notes =
      notes != null && String(notes).trim() !== "" ? String(notes).trim() : null;
  }
  if (typeof is_active === "boolean") {
    updates.is_active = is_active;
  }
  if (custom_name !== undefined) {
    updates.custom_name =
      custom_name != null && String(custom_name).trim() !== "" ? String(custom_name).trim() : null;
  }
  if (custom_address !== undefined) {
    updates.custom_address =
      custom_address != null && String(custom_address).trim() !== ""
        ? String(custom_address).trim()
        : null;
  }
  if (custom_lat !== undefined) {
    const n = custom_lat === null ? null : Number(custom_lat);
    if (n !== null && (Number.isNaN(n) || n < -90 || n > 90)) {
      return NextResponse.json(
        { error: "custom_lat must be between -90 and 90 or null" },
        { status: 400 }
      );
    }
    updates.custom_lat = n;
  }
  if (custom_lng !== undefined) {
    const n = custom_lng === null ? null : Number(custom_lng);
    if (n !== null && (Number.isNaN(n) || n < -180 || n > 180)) {
      return NextResponse.json(
        { error: "custom_lng must be between -180 and 180 or null" },
        { status: 400 }
      );
    }
    updates.custom_lng = n;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Provide at least one of monthly_cost, notes, is_active, custom_name, custom_address, custom_lat, custom_lng" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("org_billboards")
    .update(updates)
    .eq("id", id)
    .select("id, monthly_cost, notes, is_active, custom_name, custom_address")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "Not found or access denied" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
