import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/api-auth";
import { getManualMetricsForMonth } from "@/lib/attribution/get-metrics";
import type {
  DashboardROIResponse,
  DashboardROISummary,
  DashboardROIBoardRow,
} from "@/types/dashboard-roi";

/**
 * Normalize month to first-of-month YYYY-MM-DD for DB comparison.
 */
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

/**
 * GET /api/dashboard/roi?month=YYYY-MM
 *
 * Returns ROI summary and per-board breakdown for the authenticated user's
 * organization. Metrics are loaded via the attribution layer (currently
 * manual org_monthly_metrics only; CRM/referral data would be merged there).
 *
 * Calculations:
 * - Total spend: sum(monthly_cost) over all org_billboards where is_active = true.
 * - Total leads / signed cases / revenue: from getManualMetricsForMonth (later merged with integrations).
 * - Cost per lead, cost per signed case, ROI multiple: derived from above.
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");
  if (!monthParam) {
    return NextResponse.json(
      { error: "Query parameter month is required (YYYY-MM)" },
      { status: 400 }
    );
  }

  const monthDate = toFirstOfMonth(monthParam);
  if (!monthDate) {
    return NextResponse.json(
      { error: "month must be YYYY-MM (e.g. 2025-03)" },
      { status: 400 }
    );
  }

  const includeAllBoards =
    searchParams.get("includeAllBoards") === "1" ||
    searchParams.get("includeAllBoards") === "true";

  const supabase = await createClient();

  // Fetch all org billboards for the org (RLS restricts to current user's org).
  // We need active + inactive to compute spend (active only) and to build board rows (with metrics).
  const { data: boardsData, error: boardsError } = await supabase
    .from("org_billboards")
    .select(
      "id, custom_name, custom_address, monthly_cost, is_active, billboards(name, address, cities(name))"
    )
    .order("created_at", { ascending: false });

  if (boardsError) {
    return NextResponse.json(
      { error: boardsError.message },
      { status: 500 }
    );
  }

  type BoardJoined = {
    name: string | null;
    address: string | null;
    cities: { name: string } | { name: string }[] | null;
  };
  type BoardRow = {
    id: string;
    custom_name: string | null;
    custom_address: string | null;
    monthly_cost: number | null;
    is_active: boolean;
    billboards: BoardJoined | BoardJoined[] | null;
  };
  const boards = (boardsData ?? []) as BoardRow[];

  function shortDisplayId(id: string): string {
    return id.replace(/-/g, "").slice(0, 8).toUpperCase();
  }

  function pickJoined(board: BoardRow): BoardJoined | null {
    const j = board.billboards;
    if (!j) return null;
    return Array.isArray(j) ? j[0] ?? null : j;
  }

  function resolveLocation(board: BoardRow): string {
    const ca = board.custom_address?.trim();
    if (ca) return ca;
    const joined = pickJoined(board);
    const addr = joined?.address?.trim();
    if (addr) return addr;
    return "—";
  }

  function resolveCity(board: BoardRow): string | null {
    const joined = pickJoined(board);
    const c = joined?.cities;
    if (!c) return null;
    const city = Array.isArray(c) ? c[0] : c;
    const n = city?.name?.trim();
    return n || null;
  }

  let metricsByBoard: Map<
    string,
    { leads: number; signedCases: number; revenue: number }
  >;
  try {
    const payload = await getManualMetricsForMonth(supabase, monthDate);
    metricsByBoard = payload.byBoard;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load metrics" },
      { status: 500 }
    );
  }

  // Total spend: sum(monthly_cost) for active boards only (for this one month).
  const totalSpend = boards
    .filter((b) => b.is_active)
    .reduce((sum, b) => sum + (Number(b.monthly_cost) || 0), 0);

  const totalLeads = Array.from(metricsByBoard.values()).reduce(
    (s, m) => s + m.leads,
    0
  );
  const totalSignedCases = Array.from(metricsByBoard.values()).reduce(
    (s, m) => s + m.signedCases,
    0
  );
  const totalRevenue = Array.from(metricsByBoard.values()).reduce(
    (s, m) => s + m.revenue,
    0
  );

  const summary: DashboardROISummary = {
    totalSpend,
    totalLeads,
    totalSignedCases,
    totalRevenue,
    costPerLead:
      totalLeads > 0 ? totalSpend / totalLeads : null,
    costPerSignedCase:
      totalSignedCases > 0 ? totalSpend / totalSignedCases : null,
    roiMultiple: totalSpend > 0 ? totalRevenue / totalSpend : null,
  };

  // Board-level rows: default only boards with metrics; includeAllBoards adds zeros for missing months.
  const boardRows: DashboardROIBoardRow[] = [];
  for (const board of boards) {
    const raw = metricsByBoard.get(board.id);
    if (!includeAllBoards && !raw) continue;

    const hasMetrics = raw != null;
    const m = raw ?? { leads: 0, signedCases: 0, revenue: 0 };

    const monthlyCost = Number(board.monthly_cost) || 0;
    const spend = board.is_active ? monthlyCost : 0;

    const joined = board.billboards;
    const billboardName = Array.isArray(joined)
      ? joined[0]?.name ?? null
      : joined?.name ?? null;
    const displayName =
      (board.custom_name?.trim() || billboardName) ?? "—";
    boardRows.push({
      orgBillboardId: board.id,
      displayId: shortDisplayId(board.id),
      name: displayName,
      location: resolveLocation(board),
      city: resolveCity(board),
      isActive: board.is_active,
      hasMetrics,
      monthlyCost,
      spend,
      leads: m.leads,
      signedCases: m.signedCases,
      revenue: m.revenue,
      costPerLead: m.leads > 0 ? spend / m.leads : null,
      costPerSignedCase: m.signedCases > 0 ? spend / m.signedCases : null,
      roiMultiple: spend > 0 ? m.revenue / spend : null,
    });
  }

  // Sort by revenue descending so best performers are first.
  boardRows.sort((a, b) => b.revenue - a.revenue);

  const response: DashboardROIResponse = {
    period: { type: "month", month: monthDate },
    summary,
    orgBoardCount: boards.length,
    boards: boardRows,
  };

  return NextResponse.json(response);
}
