import type { DashboardROIResponse } from "@/types/dashboard-roi";

/**
 * True when there are no metrics at all for the selected month
 * (no leads, no signed cases, no revenue, and no board rows).
 * Used to show the full empty state instead of summary cards.
 */
export function hasNoMetricsForMonth(data: DashboardROIResponse): boolean {
  const { summary, boards } = data;
  return (
    boards.length === 0 &&
    summary.totalLeads === 0 &&
    summary.totalSignedCases === 0 &&
    summary.totalRevenue === 0
  );
}
