import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/api-auth";
import type { UpdateMonthlyMetricBody } from "@/types/org-monthly-metric";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseUuid(value: string | null): string | null {
  if (value == null || value === "") return null;
  const t = value.trim();
  return UUID_REGEX.test(t) ? t : null;
}

function toFirstOfMonth(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!match) return null;
  const [, y, m] = match;
  const month = parseInt(m!, 10);
  const year = parseInt(y!, 10);
  if (month < 1 || month > 12 || year < 2000 || year > 2100) return null;
  return `${y}-${m.padStart(2, "0")}-01`;
}

/** PATCH /api/org-billboards/[id]/metrics/[metricId] — update one metric row. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; metricId: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await params;
  const boardId = parseUuid(resolved.id);
  const metricId = parseUuid(resolved.metricId);
  if (!boardId || !metricId) {
    return NextResponse.json({ error: "Invalid id or metricId" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { month: monthRaw, leads, signed_cases, revenue } = body as UpdateMonthlyMetricBody;
  const updates: Record<string, unknown> = {};

  if (monthRaw !== undefined) {
    if (monthRaw == null || String(monthRaw).trim() === "") {
      return NextResponse.json({ error: "month cannot be empty" }, { status: 400 });
    }
    const month = toFirstOfMonth(String(monthRaw));
    if (!month) {
      return NextResponse.json(
        { error: "month must be YYYY-MM or YYYY-MM-DD" },
        { status: 400 }
      );
    }
    updates.month = month;
  }
  if (leads !== undefined) {
    if (leads === null) {
      updates.leads = null;
    } else {
      const n = Number(leads);
      if (Number.isNaN(n) || n < 0) {
        return NextResponse.json({ error: "leads must be a non-negative integer" }, { status: 400 });
      }
      updates.leads = n;
    }
  }
  if (signed_cases !== undefined) {
    if (signed_cases === null) {
      updates.signed_cases = null;
    } else {
      const n = Number(signed_cases);
      if (Number.isNaN(n) || n < 0) {
        return NextResponse.json(
          { error: "signed_cases must be a non-negative integer" },
          { status: 400 }
        );
      }
      updates.signed_cases = n;
    }
  }
  if (revenue !== undefined) {
    if (revenue === null) {
      updates.revenue = null;
    } else {
      const n = Number(revenue);
      if (Number.isNaN(n) || n < 0) {
        return NextResponse.json({ error: "revenue must be a non-negative number" }, { status: 400 });
      }
      updates.revenue = n;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Provide at least one of month, leads, signed_cases, revenue" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("org_monthly_metrics")
    .select("id, org_billboard_id")
    .eq("id", metricId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Metric not found or access denied" }, { status: 404 });
  }
  if (existing.org_billboard_id !== boardId) {
    return NextResponse.json({ error: "Metric does not belong to this board" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("org_monthly_metrics")
    .update(updates)
    .eq("id", metricId)
    .select("id, org_billboard_id, month, leads, signed_cases, revenue, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Another entry already exists for this board and month." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/** DELETE /api/org-billboards/[id]/metrics/[metricId] — delete one metric row. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; metricId: string }> }
) {
  const user = await getUserFromRequest(_request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await params;
  const boardId = parseUuid(resolved.id);
  const metricId = parseUuid(resolved.metricId);
  if (!boardId || !metricId) {
    return NextResponse.json({ error: "Invalid id or metricId" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("org_monthly_metrics")
    .select("id, org_billboard_id")
    .eq("id", metricId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Metric not found or access denied" }, { status: 404 });
  }
  if (existing.org_billboard_id !== boardId) {
    return NextResponse.json({ error: "Metric does not belong to this board" }, { status: 400 });
  }

  const { error } = await supabase
    .from("org_monthly_metrics")
    .delete()
    .eq("id", metricId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
