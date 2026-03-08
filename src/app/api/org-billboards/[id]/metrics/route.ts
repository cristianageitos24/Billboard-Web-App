import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/api-auth";
import type { CreateMonthlyMetricBody, OrgMonthlyMetric } from "@/types/org-monthly-metric";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseUuid(value: string | null): string | null {
  if (value == null || value === "") return null;
  const t = value.trim();
  return UUID_REGEX.test(t) ? t : null;
}

/** Normalize month to first-of-month YYYY-MM-DD. */
function toFirstOfMonth(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!match) return null;
  const [, y, m] = match;
  const year = parseInt(y!, 10);
  const month = parseInt(m!, 10);
  if (month < 1 || month > 12 || year < 2000 || year > 2100) return null;
  return `${y}-${m.padStart(2, "0")}-01`;
}

/** GET /api/org-billboards/[id]/metrics — list metrics for this claimed board. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseUuid((await params).id);
  if (!id) {
    return NextResponse.json({ error: "Invalid board id" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: board } = await supabase
    .from("org_billboards")
    .select("id, organization_id")
    .eq("id", id)
    .single();

  if (!board) {
    return NextResponse.json({ error: "Board not found or access denied" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("org_monthly_metrics")
    .select("id, organization_id, org_billboard_id, month, leads, signed_cases, revenue, created_at")
    .eq("org_billboard_id", id)
    .order("month", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const metrics = (data ?? []) as OrgMonthlyMetric[];
  return NextResponse.json({ metrics });
}

/** POST /api/org-billboards/[id]/metrics — add metrics for one month (no duplicate board+month). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseUuid((await params).id);
  if (!id) {
    return NextResponse.json({ error: "Invalid board id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { month: monthRaw, leads, signed_cases, revenue } = body as CreateMonthlyMetricBody;
  if (monthRaw == null || String(monthRaw).trim() === "") {
    return NextResponse.json({ error: "month is required" }, { status: 400 });
  }

  const month = toFirstOfMonth(String(monthRaw));
  if (!month) {
    return NextResponse.json(
      { error: "month must be YYYY-MM or YYYY-MM-DD (e.g. 2025-03)" },
      { status: 400 }
    );
  }

  if (leads != null) {
    const n = Number(leads);
    if (Number.isNaN(n) || n < 0) {
      return NextResponse.json({ error: "leads must be a non-negative integer" }, { status: 400 });
    }
  }
  if (signed_cases != null) {
    const n = Number(signed_cases);
    if (Number.isNaN(n) || n < 0) {
      return NextResponse.json(
        { error: "signed_cases must be a non-negative integer" },
        { status: 400 }
      );
    }
  }
  if (revenue != null) {
    const n = Number(revenue);
    if (Number.isNaN(n) || n < 0) {
      return NextResponse.json({ error: "revenue must be a non-negative number" }, { status: 400 });
    }
  }

  const supabase = await createClient();

  const { data: board } = await supabase
    .from("org_billboards")
    .select("id, organization_id")
    .eq("id", id)
    .single();

  if (!board) {
    return NextResponse.json({ error: "Board not found or access denied" }, { status: 404 });
  }

  const { data: inserted, error } = await supabase
    .from("org_monthly_metrics")
    .insert({
      organization_id: board.organization_id,
      org_billboard_id: id,
      month,
      leads: leads != null ? Number(leads) : null,
      signed_cases: signed_cases != null ? Number(signed_cases) : null,
      revenue: revenue != null ? Number(revenue) : null,
    })
    .select("id, org_billboard_id, month, leads, signed_cases, revenue, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Metrics for this board and month already exist. Edit the existing entry instead." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(inserted, { status: 201 });
}
