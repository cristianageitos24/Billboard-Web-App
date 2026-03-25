import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/api-auth";
import { eachFirstOfMonth } from "@/lib/dashboard/month-range";
import type {
  DashboardMetricsTimelineResponse,
  DashboardOrgMonthPoint,
  DashboardTimelineBoard,
} from "@/types/dashboard-timeline";

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

function shortDisplayId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
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
  const addr = joined?.address?.trim();
  if (addr) return addr;
  return "—";
}

function resolveCity(board: OrgBoardRow): string | null {
  const joined = pickJoined(board);
  const c = joined?.cities;
  if (!c) return null;
  const city = Array.isArray(c) ? c[0] : c;
  const n = city?.name?.trim();
  return n || null;
}

/**
 * GET /api/dashboard/metrics-timeline?from=YYYY-MM&to=YYYY-MM
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

  const months = eachFirstOfMonth(from, to);

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
    const leads = Number(row.leads) || 0;
    const signedCases = Number(row.signed_cases) || 0;
    const revenue = Number(row.revenue) || 0;
    byBoardMonth.set(key, { leads, signedCases, revenue });
  }

  const boardPayloads: DashboardTimelineBoard[] = boards.map((board) => {
    const joined = board.billboards;
    const billboardName = Array.isArray(joined)
      ? joined[0]?.name ?? null
      : joined?.name ?? null;
    const displayName =
      (board.custom_name?.trim() || billboardName) ?? "—";
    const leadsByMonth: Record<string, number> = {};
    const signedCasesByMonth: Record<string, number> = {};
    const revenueByMonth: Record<string, number> = {};
    for (const m of months) {
      const v = byBoardMonth.get(`${board.id}::${m}`);
      leadsByMonth[m] = v?.leads ?? 0;
      signedCasesByMonth[m] = v?.signedCases ?? 0;
      revenueByMonth[m] = v?.revenue ?? 0;
    }
    return {
      orgBillboardId: board.id,
      displayId: shortDisplayId(board.id),
      name: displayName,
      location: resolveLocation(board),
      city: resolveCity(board),
      isActive: board.is_active,
      monthlyCost: Number(board.monthly_cost) || 0,
      leadsByMonth,
      signedCasesByMonth,
      revenueByMonth,
    };
  });

  const totalSpend = boards
    .filter((b) => b.is_active)
    .reduce((s, b) => s + (Number(b.monthly_cost) || 0), 0);

  const orgSeries: DashboardOrgMonthPoint[] = months.map((month) => {
    let totalLeads = 0;
    let totalSignedCases = 0;
    let totalRevenue = 0;
    for (const board of boards) {
      const v = byBoardMonth.get(`${board.id}::${month}`);
      if (v) {
        totalLeads += v.leads;
        totalSignedCases += v.signedCases;
        totalRevenue += v.revenue;
      }
    }
    return {
      month,
      totalSpend,
      totalLeads,
      totalSignedCases,
      totalRevenue,
      roiMultiple: totalSpend > 0 ? totalRevenue / totalSpend : null,
    };
  });

  const response: DashboardMetricsTimelineResponse = {
    from,
    to,
    months,
    orgSeries,
    boards: boardPayloads,
  };

  return NextResponse.json(response);
}
