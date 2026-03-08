import type { SupabaseClient } from "@supabase/supabase-js";
import { CURRENT_METRICS_SOURCE } from "./constants";
import type { MonthMetricsPayload } from "./types";

/**
 * Fetches manual metrics for the given month from org_monthly_metrics.
 * Returns a map of org_billboard_id → { leads, signedCases, revenue }.
 *
 * This is the single place that reads "board-level metrics" for ROI.
 * When we add CRM or referral integrations, add getCrmMetricsForMonth()
 * (or similar) and merge results here before returning, so the ROI route
 * only ever calls one function.
 */
export async function getManualMetricsForMonth(
  supabase: SupabaseClient,
  monthDate: string
): Promise<MonthMetricsPayload> {
  const { data, error } = await supabase
    .from("org_monthly_metrics")
    .select("org_billboard_id, leads, signed_cases, revenue")
    .eq("month", monthDate);

  if (error) throw error;

  const byBoard = new Map<
    string,
    { leads: number; signedCases: number; revenue: number }
  >();

  for (const row of data ?? []) {
    const id = row.org_billboard_id as string;
    const existing = byBoard.get(id);
    const leads = Number(row.leads) || 0;
    const signedCases = Number(row.signed_cases) || 0;
    const revenue = Number(row.revenue) || 0;
    if (existing) {
      existing.leads += leads;
      existing.signedCases += signedCases;
      existing.revenue += revenue;
    } else {
      byBoard.set(id, { leads, signedCases, revenue });
    }
  }

  return { byBoard, source: CURRENT_METRICS_SOURCE };
}
