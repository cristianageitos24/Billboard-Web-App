import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/api-auth";
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
 * organization. Uses organization context via RLS (profiles.organization_id).
 *
 * Calculations:
 * - Total spend: sum(monthly_cost) over all org_billboards where is_active = true.
 *   We use current is_active; no historical "active at date."
 * - Total leads / signed cases / revenue: sum of org_monthly_metrics for the
 *   selected month (one row per board per month).
 * - Cost per lead = totalSpend / totalLeads (null if no leads).
 * - Cost per signed case = totalSpend / totalSignedCases (null if no cases).
 * - ROI multiple = totalRevenue / totalSpend (null if no spend).
 *
 * Board rows: only boards that have at least one metric row for the month.
 * Per-board spend for the month = that board's monthly_cost if active, else 0.
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

  const supabase = await createClient();

  // Fetch all org billboards for the org (RLS restricts to current user's org).
  // We need active + inactive to compute spend (active only) and to build board rows (with metrics).
  const { data: boardsData, error: boardsError } = await supabase
    .from("org_billboards")
    .select(
      "id, custom_name, monthly_cost, is_active, billboards(name, address)"
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
  };
  type BoardRow = {
    id: string;
    custom_name: string | null;
    monthly_cost: number | null;
    is_active: boolean;
    billboards: BoardJoined | BoardJoined[] | null;
  };
  const boards = (boardsData ?? []) as BoardRow[];

  // Fetch all metrics for the selected month (org-scoped by RLS).
  const { data: metricsData, error: metricsError } = await supabase
    .from("org_monthly_metrics")
    .select("org_billboard_id, leads, signed_cases, revenue")
    .eq("month", monthDate);

  if (metricsError) {
    return NextResponse.json(
      { error: metricsError.message },
      { status: 500 }
    );
  }

  const metricsRows = metricsData ?? [];

  // Build a map: org_billboard_id -> { leads, signed_cases, revenue } (one row per board per month, so we can sum if needed; currently one row per board)
  const metricsByBoard = new Map<
    string,
    { leads: number; signedCases: number; revenue: number }
  >();
  for (const row of metricsRows) {
    const id = row.org_billboard_id as string;
    const existing = metricsByBoard.get(id);
    const leads = Number(row.leads) || 0;
    const signedCases = Number(row.signed_cases) || 0;
    const revenue = Number(row.revenue) || 0;
    if (existing) {
      existing.leads += leads;
      existing.signedCases += signedCases;
      existing.revenue += revenue;
    } else {
      metricsByBoard.set(id, { leads, signedCases, revenue });
    }
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

  // Board-level rows: only boards that have metrics for this month.
  const boardRows: DashboardROIBoardRow[] = [];
  for (const board of boards) {
    const m = metricsByBoard.get(board.id);
    if (!m) continue;

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
      name: displayName,
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
    boards: boardRows,
  };

  return NextResponse.json(response);
}
