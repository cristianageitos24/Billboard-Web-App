import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/api-auth";
import { eachFirstOfMonth } from "@/lib/dashboard/month-range";

function toFirstOfMonth(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!match) return null;
  const [, y, m] = match;
  const year = parseInt(y!, 10);
  const monthNum = parseInt(m!, 10);
  if (monthNum < 1 || monthNum > 12 || year < 2000 || year > 2100) return null;
  return `${y}-${m!.padStart(2, "0")}-01`;
}

function csvEscape(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

type BoardJoined = {
  name: string | null;
  address: string | null;
  cities: { name: string } | { name: string }[] | null;
};

type OrgBoardRow = {
  id: string;
  custom_name: string | null;
  custom_address: string | null;
  monthly_cost: number | null;
  is_active: boolean;
  billboards: BoardJoined | BoardJoined[] | null;
};

function pickJoined(board: OrgBoardRow): BoardJoined | null {
  const j = board.billboards;
  if (!j) return null;
  return Array.isArray(j) ? j[0] ?? null : j;
}

function resolveLocation(board: OrgBoardRow): string {
  const ca = board.custom_address?.trim();
  if (ca) return ca;
  const joined = pickJoined(board);
  return joined?.address?.trim() || "—";
}

function resolveCity(board: OrgBoardRow): string | null {
  const joined = pickJoined(board);
  const c = joined?.cities;
  if (!c) return null;
  const city = Array.isArray(c) ? c[0] : c;
  return city?.name?.trim() || null;
}

/**
 * GET /api/dashboard/export?from=YYYY-MM&to=YYYY-MM
 * Returns CSV of per-board monthly metrics in range.
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  if (!fromParam || !toParam) {
    return NextResponse.json(
      { error: "Query parameters from and to are required (YYYY-MM)" },
      { status: 400 }
    );
  }

  const from = toFirstOfMonth(fromParam);
  const to = toFirstOfMonth(toParam);
  if (!from || !to || from > to) {
    return NextResponse.json(
      { error: "from and to must be valid YYYY-MM and from <= to" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: boardsData, error: boardsError } = await supabase
    .from("org_billboards")
    .select(
      "id, custom_name, custom_address, monthly_cost, is_active, billboards(name, address, cities(name))"
    )
    .order("created_at", { ascending: false });

  if (boardsError) {
    return NextResponse.json({ error: boardsError.message }, { status: 500 });
  }

  const boards = (boardsData ?? []) as OrgBoardRow[];

  const { data: metricsData, error: metricsError } = await supabase
    .from("org_monthly_metrics")
    .select("org_billboard_id, month, leads, signed_cases, revenue")
    .gte("month", from)
    .lte("month", to);

  if (metricsError) {
    return NextResponse.json({ error: metricsError.message }, { status: 500 });
  }

  type MetricRow = {
    org_billboard_id: string;
    month: string;
    leads: number | null;
    signed_cases: number | null;
    revenue: number | null;
  };

  const byBoardMonth = new Map<
    string,
    { leads: number; signedCases: number; revenue: number }
  >();

  for (const row of (metricsData ?? []) as MetricRow[]) {
    const bid = row.org_billboard_id as string;
    const mk = `${row.month}`;
    const key = `${bid}::${mk}`;
    byBoardMonth.set(key, {
      leads: Number(row.leads) || 0,
      signedCases: Number(row.signed_cases) || 0,
      revenue: Number(row.revenue) || 0,
    });
  }

  const months = eachFirstOfMonth(from, to);

  const lines: string[] = [
    [
      "month",
      "board_id",
      "board_name",
      "location",
      "city",
      "active",
      "monthly_cost",
      "spend",
      "leads",
      "signed_cases",
      "revenue",
      "roi_multiple",
    ].join(","),
  ];

  for (const month of months) {
    for (const board of boards) {
      const joined = board.billboards;
      const billboardName = Array.isArray(joined)
        ? joined[0]?.name ?? null
        : joined?.name ?? null;
      const displayName =
        (board.custom_name?.trim() || billboardName) ?? "—";
      const monthlyCost = Number(board.monthly_cost) || 0;
      const spend = board.is_active ? monthlyCost : 0;
      const v = byBoardMonth.get(`${board.id}::${month}`) ?? {
        leads: 0,
        signedCases: 0,
        revenue: 0,
      };
      const roi =
        spend > 0 && v.revenue > 0 ? v.revenue / spend : spend > 0 ? 0 : "";
      lines.push(
        [
          csvEscape(month),
          csvEscape(board.id),
          csvEscape(displayName),
          csvEscape(resolveLocation(board)),
          csvEscape(resolveCity(board)),
          board.is_active ? "1" : "0",
          monthlyCost,
          spend,
          v.leads,
          v.signedCases,
          v.revenue,
          roi === "" ? "" : Number(roi).toFixed(4),
        ].join(",")
      );
    }
  }

  const csv = lines.join("\r\n");
  const filename = `billboard-roi-${from.slice(0, 7)}-to-${to.slice(0, 7)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
